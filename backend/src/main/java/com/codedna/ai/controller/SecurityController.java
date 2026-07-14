package com.codedna.ai.controller;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.SecurityReport;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.SecurityReportRepository;
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

@RestController
@RequestMapping("/api/projects/{projectId}/security")
public class SecurityController {

    private final ProjectRepository projectRepository;
    private final SecurityReportRepository securityReportRepository;
    private final UserRepository userRepository;

    public SecurityController(
            ProjectRepository projectRepository, 
            SecurityReportRepository securityReportRepository,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.securityReportRepository = securityReportRepository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<?> getSecurityReport(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        SecurityReport report = securityReportRepository.findByProject(project)
                .orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT).body("No security report generated. Please analyze the project first.");
        }
        return ResponseEntity.ok(report);
    }
}
