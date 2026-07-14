package com.codedna.ai.model;

import jakarta.persistence.*;

@Entity
@Table(name = "project_files")
public class ProjectFile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false, name = "file_path")
    private String filePath;

    @Column(nullable = false, name = "file_name")
    private String fileName;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String content;

    private String extension;
    private String language;
    private Long size;

    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String summary;

    private Integer complexity; // e.g. cyclomatic complexity score
    
    @Column(name = "vector_id")
    private String vectorId;

    public ProjectFile() {}

    public ProjectFile(Long id, Project project, String filePath, String fileName, String content, String extension, String language, Long size, String summary, Integer complexity, String vectorId) {
        this.id = id;
        this.project = project;
        this.filePath = filePath;
        this.fileName = fileName;
        this.content = content;
        this.extension = extension;
        this.language = language;
        this.size = size;
        this.summary = summary;
        this.complexity = complexity;
        this.vectorId = vectorId;
    }

    public static ProjectFileBuilder builder() {
        return new ProjectFileBuilder();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public String getFilePath() { return filePath; }
    public void setFilePath(String filePath) { this.filePath = filePath; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public String getExtension() { return extension; }
    public void setExtension(String extension) { this.extension = extension; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public Long getSize() { return size; }
    public void setSize(Long size) { this.size = size; }

    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }

    public Integer getComplexity() { return complexity; }
    public void setComplexity(Integer complexity) { this.complexity = complexity; }

    public String getVectorId() { return vectorId; }
    public void setVectorId(String vectorId) { this.vectorId = vectorId; }

    // Builder
    public static class ProjectFileBuilder {
        private Long id;
        private Project project;
        private String filePath;
        private String fileName;
        private String content;
        private String extension;
        private String language;
        private Long size;
        private String summary;
        private Integer complexity;
        private String vectorId;

        public ProjectFileBuilder id(Long id) { this.id = id; return this; }
        public ProjectFileBuilder project(Project project) { this.project = project; return this; }
        public ProjectFileBuilder filePath(String filePath) { this.filePath = filePath; return this; }
        public ProjectFileBuilder fileName(String fileName) { this.fileName = fileName; return this; }
        public ProjectFileBuilder content(String content) { this.content = content; return this; }
        public ProjectFileBuilder extension(String extension) { this.extension = extension; return this; }
        public ProjectFileBuilder language(String language) { this.language = language; return this; }
        public ProjectFileBuilder size(Long size) { this.size = size; return this; }
        public ProjectFileBuilder summary(String summary) { this.summary = summary; return this; }
        public ProjectFileBuilder complexity(Integer complexity) { this.complexity = complexity; return this; }
        public ProjectFileBuilder vectorId(String vectorId) { this.vectorId = vectorId; return this; }

        public ProjectFile build() {
            return new ProjectFile(id, project, filePath, fileName, content, extension, language, size, summary, complexity, vectorId);
        }
    }
}
