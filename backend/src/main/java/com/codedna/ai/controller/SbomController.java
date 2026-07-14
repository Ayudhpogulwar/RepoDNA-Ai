package com.codedna.ai.controller;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.SBOMReport;
import com.codedna.ai.repository.DependencyRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.SBOMReportRepository;
import com.codedna.ai.repository.UserRepository;
import com.codedna.ai.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;
import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/sbom")
public class SbomController {

    private final ProjectRepository projectRepository;
    private final DependencyRepository dependencyRepository;
    private final SBOMReportRepository sbomReportRepository;
    private final UserRepository userRepository;

    public SbomController(
            ProjectRepository projectRepository, 
            DependencyRepository dependencyRepository, 
            SBOMReportRepository sbomReportRepository,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.dependencyRepository = dependencyRepository;
        this.sbomReportRepository = sbomReportRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/dependencies")
    public ResponseEntity<?> getDependencies(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        List<Dependency> dependencies = dependencyRepository.findByProject(project);
        return ResponseEntity.ok(dependencies);
    }

    @GetMapping("/report")
    public ResponseEntity<?> getSbomReport(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        SBOMReport report = sbomReportRepository.findByProject(project).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No SBOM report generated yet. Run analysis.");
        }
        return ResponseEntity.ok(report);
    }
}
