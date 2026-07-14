package com.codedna.ai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sbom_reports")
public class SBOMReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String format; // e.g. SPDX_JSON, CYCLONEDX_JSON

    @Lob
    @Column(columnDefinition = "LONGTEXT", nullable = false)
    private String content;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public SBOMReport() {}

    public SBOMReport(Long id, Project project, String format, String content) {
        this.id = id;
        this.project = project;
        this.format = format;
        this.content = content;
        this.createdAt = LocalDateTime.now();
    }

    public static SBOMReportBuilder builder() {
        return new SBOMReportBuilder();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getFormat() { return format; }
    public void setFormat(String format) { this.format = format; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Builder
    public static class SBOMReportBuilder {
        private Long id;
        private Project project;
        private String format;
        private String content;

        public SBOMReportBuilder id(Long id) { this.id = id; return this; }
        public SBOMReportBuilder project(Project project) { this.project = project; return this; }
        public SBOMReportBuilder format(String format) { this.format = format; return this; }
        public SBOMReportBuilder content(String content) { this.content = content; return this; }

        public SBOMReport build() {
            return new SBOMReport(id, project, format, content);
        }
    }
}
