package com.codedna.ai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "projects")
public class Project {

    public enum ProjectType {
        REPOSITORY, FOLDER, FILE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String description;

    @Column(name = "git_url")
    private String gitUrl;

    @Column(name = "local_path")
    private String localPath;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProjectType type;

    @Column(name = "health_score")
    private Integer healthScore;

    @Column(name = "security_score")
    private Integer securityScore;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnore
    private User user;

    private String frameworks;
    private String languages;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String summary;

    @Lob
    @Column(name = "learning_roadmap", columnDefinition = "LONGTEXT")
    private String learningRoadmap;

    public Project() {}

    public Project(Long id, String name, String description, String gitUrl, String localPath, ProjectType type, Integer healthScore, Integer securityScore, User user, String frameworks, String languages, String summary, String learningRoadmap) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.gitUrl = gitUrl;
        this.localPath = localPath;
        this.type = type;
        this.healthScore = healthScore;
        this.securityScore = securityScore;
        this.user = user;
        this.frameworks = frameworks;
        this.languages = languages;
        this.summary = summary;
        this.learningRoadmap = learningRoadmap;
        this.createdAt = LocalDateTime.now();
    }

    public static ProjectBuilder builder() {
        return new ProjectBuilder();
    }

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (healthScore == null) healthScore = 100;
        if (securityScore == null) securityScore = 100;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getGitUrl() { return gitUrl; }
    public void setGitUrl(String gitUrl) { this.gitUrl = gitUrl; }

    public String getLocalPath() { return localPath; }
    public void setLocalPath(String localPath) { this.localPath = localPath; }

    public ProjectType getType() { return type; }
    public void setType(ProjectType type) { this.type = type; }

    public Integer getHealthScore() { return healthScore; }
    public void setHealthScore(Integer healthScore) { this.healthScore = healthScore; }

    public Integer getSecurityScore() { return securityScore; }
    public void setSecurityScore(Integer securityScore) { this.securityScore = securityScore; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getFrameworks() { return frameworks; }
    public void setFrameworks(String frameworks) { this.frameworks = frameworks; }

    public String getLanguages() { return languages; }
    public void setLanguages(String languages) { this.languages = languages; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public String getLearningRoadmap() { return learningRoadmap; }
    public void setLearningRoadmap(String learningRoadmap) { this.learningRoadmap = learningRoadmap; }

    // Builder
    public static class ProjectBuilder {
        private Long id;
        private String name;
        private String description;
        private String gitUrl;
        private String localPath;
        private ProjectType type;
        private Integer healthScore;
        private Integer securityScore;
        private User user;
        private String frameworks;
        private String languages;
        private String summary;
        private String learningRoadmap;

        public ProjectBuilder id(Long id) { this.id = id; return this; }
        public ProjectBuilder name(String name) { this.name = name; return this; }
        public ProjectBuilder description(String description) { this.description = description; return this; }
        public ProjectBuilder gitUrl(String gitUrl) { this.gitUrl = gitUrl; return this; }
        public ProjectBuilder localPath(String localPath) { this.localPath = localPath; return this; }
        public ProjectBuilder type(ProjectType type) { this.type = type; return this; }
        public ProjectBuilder healthScore(Integer healthScore) { this.healthScore = healthScore; return this; }
        public ProjectBuilder securityScore(Integer securityScore) { this.securityScore = securityScore; return this; }
        public ProjectBuilder user(User user) { this.user = user; return this; }
        public ProjectBuilder frameworks(String frameworks) { this.frameworks = frameworks; return this; }
        public ProjectBuilder languages(String languages) { this.languages = languages; return this; }
        public ProjectBuilder summary(String summary) { this.summary = summary; return this; }
        public ProjectBuilder learningRoadmap(String learningRoadmap) { this.learningRoadmap = learningRoadmap; return this; }

        public Project build() {
            return new Project(id, name, description, gitUrl, localPath, type, healthScore, securityScore, user, frameworks, languages, summary, learningRoadmap);
        }
    }
}
