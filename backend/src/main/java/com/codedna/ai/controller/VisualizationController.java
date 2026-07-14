package com.codedna.ai.controller;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.repository.DependencyRepository;
import com.codedna.ai.repository.ProjectFileRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.service.VisualizationService;
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
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects/{projectId}/visualizations")
public class VisualizationController {

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final DependencyRepository dependencyRepository;
    private final VisualizationService visualizationService;
    private final UserRepository userRepository;

    public VisualizationController(
            ProjectRepository projectRepository,
            ProjectFileRepository projectFileRepository,
            DependencyRepository dependencyRepository,
            VisualizationService visualizationService,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.dependencyRepository = dependencyRepository;
        this.visualizationService = visualizationService;
        this.userRepository = userRepository;
    }

    private boolean isAuthorized(Project project, Principal principal) {
        if (project == null || principal == null) return false;
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        return user != null && com.codedna.ai.util.SecurityUtils.isAuthorized(project, user);
    }

    @GetMapping("/tree")
    public ResponseEntity<?> getFolderTree(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!isAuthorized(project, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<ProjectFile> files = projectFileRepository.findByProject(project);
        return ResponseEntity.ok(visualizationService.buildFolderTreeGraph(files));
    }

    @GetMapping("/dependencies")
    public ResponseEntity<?> getDependenciesGraph(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!isAuthorized(project, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<Dependency> dependencies = dependencyRepository.findByProject(project);
        return ResponseEntity.ok(visualizationService.buildDependencyGraph(dependencies));
    }

    @GetMapping("/flow")
    public ResponseEntity<?> getApiExecutionFlow(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!isAuthorized(project, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<ProjectFile> files = projectFileRepository.findByProject(project);
        return ResponseEntity.ok(visualizationService.buildApiExecutionFlow(files));
    }

    @GetMapping("/data")
    public ResponseEntity<?> getDataFlowGraph(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!isAuthorized(project, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<ProjectFile> files = projectFileRepository.findByProject(project);
        return ResponseEntity.ok(visualizationService.buildDataFlowGraph(files));
    }

    @GetMapping("/mermaid")
    public ResponseEntity<?> getMermaidDiagrams(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        if (!isAuthorized(project, principal)) return ResponseEntity.status(HttpStatus.FORBIDDEN).build();

        List<ProjectFile> files = projectFileRepository.findByProject(project);
        
        Map<String, String> diagrams = new HashMap<>();
        diagrams.put("classDiagram", visualizationService.generateMermaidClassDiagram(files));
        diagrams.put("sequenceDiagram", visualizationService.generateMermaidSequenceDiagram(files));
        return ResponseEntity.ok(diagrams);
    }
}
