package com.codedna.ai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "analysis_runs")
public class AnalysisRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @JsonIgnore
    private Project project;

    @Column(name = "health_score", nullable = false)
    private Integer healthScore;

    @Column(name = "security_score", nullable = false)
    private Integer securityScore;

    @Column(name = "lines_of_code", nullable = false)
    private Long linesOfCode;

    @Column(name = "vulnerabilities_count", nullable = false)
    private Integer vulnerabilitiesCount;

    @Column(name = "run_date", nullable = false)
    private LocalDateTime runDate;

    public AnalysisRun() {}

    public AnalysisRun(Project project, Integer healthScore, Integer securityScore, Long linesOfCode, Integer vulnerabilitiesCount) {
        this.project = project;
        this.healthScore = healthScore;
        this.securityScore = securityScore;
        this.linesOfCode = linesOfCode;
        this.vulnerabilitiesCount = vulnerabilitiesCount;
        this.runDate = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Integer getHealthScore() { return healthScore; }
    public void setHealthScore(Integer healthScore) { this.healthScore = healthScore; }

    public Integer getSecurityScore() { return securityScore; }
    public void setSecurityScore(Integer securityScore) { this.securityScore = securityScore; }

    public Long getLinesOfCode() { return linesOfCode; }
    public void setLinesOfCode(Long linesOfCode) { this.linesOfCode = linesOfCode; }

    public Integer getVulnerabilitiesCount() { return vulnerabilitiesCount; }
    public void setVulnerabilitiesCount(Integer vulnerabilitiesCount) { this.vulnerabilitiesCount = vulnerabilitiesCount; }

    public LocalDateTime getRunDate() { return runDate; }
    public void setRunDate(LocalDateTime runDate) { this.runDate = runDate; }
}
