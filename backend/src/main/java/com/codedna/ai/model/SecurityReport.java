package com.codedna.ai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "security_reports")
public class SecurityReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    private Integer score;

    @Lob
    @Column(name = "issues_found", columnDefinition = "LONGTEXT")
    private String issuesFound; // JSON array

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String recommendations;

    @Column(name = "scanned_at")
    private LocalDateTime scannedAt;

    public SecurityReport() {}

    public SecurityReport(Long id, Project project, Integer score, String issuesFound, String recommendations) {
        this.id = id;
        this.project = project;
        this.score = score;
        this.issuesFound = issuesFound;
        this.recommendations = recommendations;
        this.scannedAt = LocalDateTime.now();
    }

    public static SecurityReportBuilder builder() {
        return new SecurityReportBuilder();
    }

    @PrePersist
    protected void onCreate() {
        scannedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public Integer getScore() { return score; }
    public void setScore(Integer score) { this.score = score; }

    public String getIssuesFound() { return issuesFound; }
    public void setIssuesFound(String issuesFound) { this.issuesFound = issuesFound; }

    public String getRecommendations() { return recommendations; }
    public void setRecommendations(String recommendations) { this.recommendations = recommendations; }

    public LocalDateTime getScannedAt() { return scannedAt; }
    public void setScannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; }

    // Builder
    public static class SecurityReportBuilder {
        private Long id;
        private Project project;
        private Integer score;
        private String issuesFound;
        private String recommendations;
        private LocalDateTime scannedAt;

        public SecurityReportBuilder id(Long id) { this.id = id; return this; }
        public SecurityReportBuilder project(Project project) { this.project = project; return this; }
        public SecurityReportBuilder score(Integer score) { this.score = score; return this; }
        public SecurityReportBuilder issuesFound(String issuesFound) { this.issuesFound = issuesFound; return this; }
        public SecurityReportBuilder recommendations(String recommendations) { this.recommendations = recommendations; return this; }
        public SecurityReportBuilder scannedAt(LocalDateTime scannedAt) { this.scannedAt = scannedAt; return this; }

        public SecurityReport build() {
            SecurityReport report = new SecurityReport(id, project, score, issuesFound, recommendations);
            if (scannedAt != null) {
                report.setScannedAt(scannedAt);
            }
            return report;
        }
    }
}
