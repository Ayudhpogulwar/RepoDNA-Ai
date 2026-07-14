package com.codedna.ai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "dependencies")
public class Dependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    private String version;

    private String type; // e.g. MAVEN, NPM, PIP

    private String license;

    @Column(name = "vulnerability_status")
    private String vulnerabilityStatus; // e.g. SECURE, OUTDATED, VULNERABLE

    private String description;

    public Dependency() {}

    public Dependency(Long id, Project project, String name, String version, String type, String license, String vulnerabilityStatus, String description) {
        this.id = id;
        this.project = project;
        this.name = name;
        this.version = version;
        this.type = type;
        this.license = license;
        this.vulnerabilityStatus = vulnerabilityStatus;
        this.description = description;
    }

    public static DependencyBuilder builder() {
        return new DependencyBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getVersion() { return version; }
    public void setVersion(String version) { this.version = version; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getLicense() { return license; }
    public void setLicense(String license) { this.license = license; }

    public String getVulnerabilityStatus() { return vulnerabilityStatus; }
    public void setVulnerabilityStatus(String vulnerabilityStatus) { this.vulnerabilityStatus = vulnerabilityStatus; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    // Builder
    public static class DependencyBuilder {
        private Long id;
        private Project project;
        private String name;
        private String version;
        private String type;
        private String license;
        private String vulnerabilityStatus;
        private String description;

        public DependencyBuilder id(Long id) { this.id = id; return this; }
        public DependencyBuilder project(Project project) { this.project = project; return this; }
        public DependencyBuilder name(String name) { this.name = name; return this; }
        public DependencyBuilder version(String version) { this.version = version; return this; }
        public DependencyBuilder type(String type) { this.type = type; return this; }
        public DependencyBuilder license(String license) { this.license = license; return this; }
        public DependencyBuilder vulnerabilityStatus(String vulnerabilityStatus) { this.vulnerabilityStatus = vulnerabilityStatus; return this; }
        public DependencyBuilder description(String description) { this.description = description; return this; }

        public Dependency build() {
            return new Dependency(id, project, name, version, type, license, vulnerabilityStatus, description);
        }
    }
}
