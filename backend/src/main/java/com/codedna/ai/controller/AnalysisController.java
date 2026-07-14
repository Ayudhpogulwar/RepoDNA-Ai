package com.codedna.ai.controller;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.repository.ProjectFileRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.service.AnalysisService;
import com.codedna.ai.repository.UserRepository;
import com.codedna.ai.model.User;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.io.File;
import java.security.Principal;
import java.util.concurrent.CompletableFuture;

@RestController
@RequestMapping("/api/analysis")
public class AnalysisController {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final AnalysisService analysisService;
    private final UserRepository userRepository;

    public AnalysisController(ProjectRepository projectRepository, ProjectFileRepository projectFileRepository, AnalysisService analysisService, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.analysisService = analysisService;
        this.userRepository = userRepository;
    }

    public static class CodeUploadRequest {
        private String fileName;
        private String content;
        private String language;

        public String getFileName() { return fileName; }
        public void setFileName(String fileName) { this.fileName = fileName; }
        public String getContent() { return content; }
        public void setContent(String content) { this.content = content; }
        public String getLanguage() { return language; }
        public void setLanguage(String language) { this.language = language; }
    }

    @PostMapping("/{projectId}")
    public ResponseEntity<?> startAnalysis(
            @PathVariable Long projectId,
            @RequestHeader(value = "X-Gemini-Key", required = false) String geminiKey,
            @RequestHeader(value = "X-OpenAI-Key", required = false) String openaiKey,
            @RequestHeader(value = "X-Developer-Level", defaultValue = "mid") String devLevel,
            Principal principal
    ) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Run analysis asynchronously so client doesn't block
        CompletableFuture.runAsync(() -> {
            if (project.getType() == Project.ProjectType.REPOSITORY) {
                analysisService.analyzeGitRepository(project, geminiKey, openaiKey, devLevel);
            } else {
                // Folder / file mock paths
                analysisService.analyzeLocalDirectory(project, new File(project.getLocalPath() != null ? project.getLocalPath() : "."), geminiKey, openaiKey, devLevel);
            }
        });

        return ResponseEntity.accepted().body("Analysis started.");
    }

    @GetMapping("/{projectId}/progress")
    public ResponseEntity<String> getProgress(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(analysisService.getAnalysisProgress(projectId));
    }

    @PostMapping("/{projectId}/upload-code")
    public ResponseEntity<?> uploadCode(
            @PathVariable Long projectId, 
            @RequestBody CodeUploadRequest request, 
            Principal principal
    ) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // Save uploaded file content directly to DB
        ProjectFile projectFile = ProjectFile.builder()
                .project(project)
                .fileName(request.getFileName())
                .filePath(request.getFileName())
                .content(request.getContent())
                .extension(request.getFileName().substring(request.getFileName().lastIndexOf('.') + 1))
                .language(request.getLanguage() != null ? request.getLanguage() : "Plain Text")
                .size((long) request.getContent().length())
                .complexity(1)
                .summary("Code block upload")
                .build();

        projectFileRepository.save(projectFile);

        // Update project path
        project.setLocalPath(new File(".").getAbsolutePath());
        projectRepository.save(project);

        return ResponseEntity.ok("File uploaded successfully.");
    }
}
