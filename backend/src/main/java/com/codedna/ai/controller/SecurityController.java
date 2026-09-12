package com.codedna.ai.controller;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.SecurityReport;
import com.codedna.ai.repository.DependencyRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.SecurityReportRepository;
import com.codedna.ai.repository.UserRepository;
import com.codedna.ai.model.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

@RestController
@RequestMapping("/api/projects/{projectId}/security")
public class SecurityController {

    private final ProjectRepository projectRepository;
    private final SecurityReportRepository securityReportRepository;
    private final DependencyRepository dependencyRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public SecurityController(
            ProjectRepository projectRepository,
            SecurityReportRepository securityReportRepository,
            DependencyRepository dependencyRepository,
            UserRepository userRepository
    ) {
        this.projectRepository = projectRepository;
        this.securityReportRepository = securityReportRepository;
        this.dependencyRepository = dependencyRepository;
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

        SecurityReport report = securityReportRepository.findByProject(project).orElse(null);
        if (report == null) {
            return ResponseEntity.status(HttpStatus.NO_CONTENT)
                    .body("No security report generated. Please analyze the project first.");
        }

        // ── Enrich: merge VULNERABLE dependencies into the issues JSON ──────────
        // This ensures SBOM-detected vulnerabilities always surface in the
        // Security Scan view, even if the stored report pre-dates the scanner fix.
        try {
            List<Dependency> vulnDeps = dependencyRepository.findByProject(project)
                    .stream()
                    .filter(d -> "VULNERABLE".equalsIgnoreCase(d.getVulnerabilityStatus()))
                    .toList();

            if (!vulnDeps.isEmpty()) {
                // Deserialize existing issues
                List<Map<String, Object>> issues = new ArrayList<>();
                String existing = report.getIssuesFound();
                if (existing != null && !existing.isBlank() && !existing.equals("[]")) {
                    issues = objectMapper.readValue(existing, new TypeReference<>() {});
                }

                // Build a set of already-present dep names to avoid duplicates
                java.util.Set<String> alreadyPresent = new java.util.HashSet<>();
                for (Map<String, Object> issue : issues) {
                    Object desc = issue.get("description");
                    if (desc != null) alreadyPresent.add(desc.toString());
                }

                // Inject missing vulnerable dependency issues
                for (Dependency dep : vulnDeps) {
                    String description = "Vulnerable dependency: " + dep.getName()
                            + " v" + dep.getVersion()
                            + " — marked VULNERABLE in SBOM scan.";
                    if (alreadyPresent.contains(description)) continue;

                    Map<String, Object> issue = new LinkedHashMap<>();
                    issue.put("filePath", "Dependency Manifest");
                    issue.put("line", 0);
                    issue.put("type", "OUTDATED_PACKAGE");
                    issue.put("severity", "HIGH");
                    issue.put("description", description);
                    issue.put("recommendation",
                            "Upgrade " + dep.getName() + " to the latest secure version and re-run analysis.");
                    issues.add(issue);
                }

                // Reserialize enriched list
                String enrichedJson = objectMapper.writeValueAsString(issues);
                report.setIssuesFound(enrichedJson);

                // Recompute score if it doesn't reflect the vulnerabilities
                long highCount = issues.stream()
                        .filter(i -> "HIGH".equals(i.get("severity"))).count();
                long medCount  = issues.stream()
                        .filter(i -> "MEDIUM".equals(i.get("severity"))).count();
                long lowCount  = issues.stream()
                        .filter(i -> "LOW".equals(i.get("severity"))).count();

                double weighted = (highCount * 12.0) + (medCount * 5.0) + (lowCount * 1.5);
                int newScore = (int) Math.round(100.0 - weighted);
                newScore = Math.max(10, Math.min(100, newScore));

                // Only lower the score — never inflate it artificially
                if (report.getScore() == null || newScore < report.getScore()) {
                    report.setScore(newScore);
                }
            }
        } catch (Exception e) {
            // Non-fatal — return original report if enrichment fails
        }

        return ResponseEntity.ok(report);
    }
}
