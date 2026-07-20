package com.codedna.ai.controller;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.model.User;
import com.codedna.ai.repository.ProjectFileRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.UserRepository;
import com.codedna.ai.repository.AnalysisRunRepository;
import com.codedna.ai.model.AnalysisRun;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import com.codedna.ai.repository.SecurityReportRepository;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final UserRepository userRepository;
    private final AnalysisRunRepository analysisRunRepository;
    private final SecurityReportRepository securityReportRepository;

    public ProjectController(
            ProjectRepository projectRepository, 
            ProjectFileRepository projectFileRepository, 
            UserRepository userRepository,
            AnalysisRunRepository analysisRunRepository,
            SecurityReportRepository securityReportRepository
    ) {
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.userRepository = userRepository;
        this.analysisRunRepository = analysisRunRepository;
        this.securityReportRepository = securityReportRepository;
    }

    public static class CreateProjectRequest {
        private String name;
        private String description;
        private String type; // REPOSITORY, FOLDER, FILE
        private String gitUrl;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getType() { return type; }
        public void setType(String type) { this.type = type; }
        public String getGitUrl() { return gitUrl; }
        public void setGitUrl(String gitUrl) { this.gitUrl = gitUrl; }
    }

    @GetMapping
    public ResponseEntity<List<Project>> getProjects(Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Project> projects = projectRepository.findByUserOrderByCreatedAtDesc(user);

        for (Project p : projects) {
            if (p.getHealthScore() == null || p.getHealthScore() <= 10 || p.getSecurityScore() == null || p.getSecurityScore() <= 0) {
                recalculateProjectScores(p);
            }
        }

        return ResponseEntity.ok(projects);
    }

    private void recalculateProjectScores(Project project) {
        List<ProjectFile> files = projectFileRepository.findByProject(project);
        int totalFiles = files.size();
        if (totalFiles == 0) {
            project.setHealthScore(85);
            project.setSecurityScore(90);
        } else {
            int secScore = 80;
            var secReportOpt = securityReportRepository.findByProject(project);
            if (secReportOpt.isPresent()) {
                String issuesFound = secReportOpt.get().getIssuesFound();
                int highCount = 0, medCount = 0, lowCount = 0;
                if (issuesFound != null) {
                    if (issuesFound.contains("HIGH")) highCount += 2;
                    if (issuesFound.contains("MEDIUM")) medCount += 2;
                    if (issuesFound.contains("LOW")) lowCount += 2;
                }
                double weightedIssues = (highCount * 8.0) + (medCount * 3.0) + (lowCount * 1.0);
                double fileScale = Math.max(1.0, Math.sqrt(totalFiles));
                secScore = (int) Math.round(100.0 - (weightedIssues / fileScale));
                secScore = Math.max(25, Math.min(100, secScore));
            } else {
                long loc = files.stream().mapToLong(f -> f.getContent() != null ? f.getContent().split("\n").length : 10).sum();
                secScore = (int) Math.max(50, 95 - (loc / 50));
            }
            project.setSecurityScore(secScore);

            int avgComplexity = (int) files.stream().mapToInt(f -> f.getComplexity() != null ? f.getComplexity() : 1).average().orElse(1);
            int complexityScore = Math.max(20, 100 - (avgComplexity * 5));
            int health = (int) Math.round((secScore * 0.4) + (complexityScore * 0.4) + (18.0));
            project.setHealthScore(Math.max(25, Math.min(100, health)));
        }
        projectRepository.save(project);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getProjectDetails(@PathVariable Long id, Principal principal) {
        try {
            Project project = projectRepository.findById(id).orElse(null);
            if (project == null) {
                return ResponseEntity.notFound().build();
            }
            // Verify owner via database user IDs
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
                String errorMsg = "Forbidden: Project Owner ID = " + project.getUser().getId() 
                        + " (" + project.getUser().getUsername() + "), Logged-in User ID = " 
                        + (user != null ? user.getId() : "null") + " (" + (user != null ? user.getUsername() : "null") 
                        + "), Principal Name = '" + principal.getName() + "'";
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(errorMsg);
            }
            return ResponseEntity.ok(project);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
        }
    }

    @PostMapping
    public ResponseEntity<?> createProject(@RequestBody CreateProjectRequest request, Principal principal) {
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Project.ProjectType type = Project.ProjectType.valueOf(request.getType().toUpperCase());
        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(type)
                .gitUrl(request.getGitUrl())
                .user(user)
                .healthScore(100)
                .securityScore(100)
                .build();

        Project saved = projectRepository.save(project);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping("/{id}/files")
    public ResponseEntity<?> getProjectFiles(@PathVariable Long id, Principal principal) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        List<ProjectFile> files = projectFileRepository.findByProject(project);
        
        // Remove code contents in listing to keep payloads light
        files.forEach(f -> f.setContent(null));
        return ResponseEntity.ok(files);
    }

    @GetMapping("/{id}/files/detail")
    public ResponseEntity<?> getProjectFileDetail(
            @PathVariable Long id, 
            @RequestParam String path, 
            Principal principal
    ) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        ProjectFile file = projectFileRepository.findByProjectAndFilePath(project, path).orElse(null);
        if (file == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(file);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteProject(@PathVariable Long id, Principal principal) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        projectRepository.delete(project);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/history")
    public ResponseEntity<?> getProjectHistory(@PathVariable Long id, Principal principal) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        
        List<AnalysisRun> history = analysisRunRepository.findByProjectOrderByRunDateAsc(project);
        
        // If history is empty, backfill it with the current project status!
        if (history.isEmpty()) {
            List<ProjectFile> files = projectFileRepository.findByProject(project);
            long totalLoc = files.stream().mapToLong(f -> {
                String content = f.getContent();
                if (content == null) return 0;
                return content.split("\n").length;
            }).sum();

            AnalysisRun run = new AnalysisRun(
                project, 
                project.getHealthScore() != null ? project.getHealthScore() : 100, 
                project.getSecurityScore() != null ? project.getSecurityScore() : 100, 
                totalLoc, 
                0
            );
            analysisRunRepository.save(run);
            history = List.of(run);
        }
        return ResponseEntity.ok(history);
    }

    public static class UpdateProjectRequest {
        private String summary;
        private String learningRoadmap;

        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
        public String getLearningRoadmap() { return learningRoadmap; }
        public void setLearningRoadmap(String learningRoadmap) { this.learningRoadmap = learningRoadmap; }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateProject(
            @PathVariable Long id, 
            @RequestBody UpdateProjectRequest request, 
            Principal principal
    ) {
        Project project = projectRepository.findById(id).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (request.getSummary() != null) {
            project.setSummary(request.getSummary());
        }
        if (request.getLearningRoadmap() != null) {
            project.setLearningRoadmap(request.getLearningRoadmap());
        }

        Project saved = projectRepository.save(project);
        return ResponseEntity.ok(saved);
    }
}
