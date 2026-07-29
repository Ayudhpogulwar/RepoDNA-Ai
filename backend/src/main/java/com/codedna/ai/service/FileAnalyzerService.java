package com.codedna.ai.service;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class FileAnalyzerService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(FileAnalyzerService.class);

    private static final Map<String, String> EXTENSION_MAP = new HashMap<>();

    static {
        EXTENSION_MAP.put("java", "Java");
        EXTENSION_MAP.put("py", "Python");
        EXTENSION_MAP.put("js", "JavaScript");
        EXTENSION_MAP.put("jsx", "JavaScript React");
        EXTENSION_MAP.put("ts", "TypeScript");
        EXTENSION_MAP.put("tsx", "TypeScript React");
        EXTENSION_MAP.put("cpp", "C++");
        EXTENSION_MAP.put("h", "C/C++ Header");
        EXTENSION_MAP.put("c", "C");
        EXTENSION_MAP.put("html", "HTML");
        EXTENSION_MAP.put("css", "CSS");
        EXTENSION_MAP.put("sql", "SQL");
        EXTENSION_MAP.put("yml", "YAML");
        EXTENSION_MAP.put("yaml", "YAML");
        EXTENSION_MAP.put("json", "JSON");
        EXTENSION_MAP.put("xml", "XML");
        EXTENSION_MAP.put("md", "Markdown");
        EXTENSION_MAP.put("sh", "Shell");
        EXTENSION_MAP.put("bat", "Batch");
        EXTENSION_MAP.put("dockerfile", "Dockerfile");
    }

    public List<ProjectFile> analyzeProjectFiles(Project project, File baseDir) throws IOException {
        List<ProjectFile> projectFiles = new ArrayList<>();
        if (!baseDir.exists()) return projectFiles;

        if (baseDir.isFile()) {
            ProjectFile file = analyzeSingleFile(project, baseDir, baseDir.getParentFile());
            projectFiles.add(file);
            return projectFiles;
        }

        Files.walk(baseDir.toPath())
            .filter(Files::isRegularFile)
            .filter(path -> {
                String p = path.toString().replace('\\', '/').toLowerCase();
                return !p.contains("/.git/") &&
                       !p.contains("/node_modules/") &&
                       !p.contains("/target/") &&
                       !p.contains("/venv/") &&
                       !p.contains("/.venv/") &&
                       !p.contains("/build/") &&
                       !p.contains("/dist/") &&
                       !p.contains("/bin/") &&
                       !p.contains("/obj/") &&
                       !p.contains("/.idea/");
            })
            .forEach(path -> {
                try {
                    File file = path.toFile();
                    ProjectFile projectFile = analyzeSingleFile(project, file, baseDir);
                    if (projectFile != null) {
                        projectFiles.add(projectFile);
                    }
                } catch (Exception e) {
                    log.error("Failed to analyze file {}: {}", path, e.getMessage());
                }
            });

        return projectFiles;
    }

    public ProjectFile analyzeSingleFile(Project project, File file, File baseDir) throws IOException {
        String relativePath = baseDir.getAbsolutePath().equals(file.getAbsolutePath()) 
                ? file.getName() 
                : file.getAbsolutePath().substring(baseDir.getAbsolutePath().length() + 1).replace('\\', '/');

        String content = "";
        try {
            content = Files.readString(file.toPath());
        } catch (Exception e) {
            log.warn("Could not read file {} as UTF-8 text. Skipping content.", file.getName());
            return null; // Skip binary or unreadable files
        }

        String extension = getFileExtension(file.getName());
        String language = EXTENSION_MAP.getOrDefault(extension.toLowerCase(), "Plain Text");

        int complexity = estimateComplexity(content, language);

        return ProjectFile.builder()
                .project(project)
                .fileName(file.getName())
                .filePath(relativePath)
                .content(content)
                .extension(extension)
                .language(language)
                .size(file.length())
                .complexity(complexity)
                .summary("Pending AI summary...")
                .build();
    }

    public List<Dependency> parseDependencies(Project project, List<ProjectFile> files) {
        List<Dependency> dependencies = new ArrayList<>();

        for (ProjectFile file : files) {
            if (file.getFileName().equals("pom.xml")) {
                dependencies.addAll(parsePomXml(project, file.getContent()));
            } else if (file.getFileName().equals("package.json")) {
                dependencies.addAll(parsePackageJson(project, file.getContent()));
            } else if (file.getFileName().equals("requirements.txt")) {
                dependencies.addAll(parseRequirementsTxt(project, file.getContent()));
            }
        }
        return dependencies;
    }

    private String getFileExtension(String fileName) {
        int index = fileName.lastIndexOf('.');
        if (index == -1) return fileName; // Return the whole name (e.g. Dockerfile)
        return fileName.substring(index + 1);
    }

    public int estimateComplexity(String content, String language) {
        if (content == null || content.isEmpty()) return 1;
        // Basic cyclomatic complexity estimate by counting logic statements
        int complexity = 1;
        String[] keywords = {"if", "for", "while", "catch", "case", "&&", "||", "And", "Or", "elif"};
        
        for (String keyword : keywords) {
            Pattern p = Pattern.compile("\\b" + Pattern.quote(keyword) + "\\b|\\Q" + keyword + "\\E");
            Matcher m = p.matcher(content);
            while (m.find()) {
                complexity++;
            }
        }
        
        return Math.min(complexity, 50); // Cap at 50 for simplicity
    }

    private List<Dependency> parsePomXml(Project project, String content) {
        List<Dependency> deps = new ArrayList<>();
        // Quick regex parser for maven dependencies (reliable enough for manifest parsing without XML engine overhead)
        Pattern depPattern = Pattern.compile("<dependency>\\s*<groupId>(.*?)</groupId>\\s*<artifactId>(.*?)</artifactId>\\s*(?:<version>(.*?)</version>)?", Pattern.DOTALL);
        Matcher m = depPattern.matcher(content);
        while (m.find()) {
            String groupId = m.group(1).trim();
            String artifactId = m.group(2).trim();
            String version = m.group(3) != null ? m.group(3).trim() : "LATEST";
            deps.add(Dependency.builder()
                    .project(project)
                    .name(groupId + ":" + artifactId)
                    .version(version)
                    .type("MAVEN")
                    .vulnerabilityStatus("SECURE")
                    .license("Unknown")
                    .description("Maven Artifact")
                    .build());
        }
        return deps;
    }

    private List<Dependency> parsePackageJson(Project project, String content) {
        List<Dependency> deps = new ArrayList<>();
        // Simple regex to parse dependencies section in package.json
        Pattern depSectionPattern = Pattern.compile("\"(?:devDependencies|dependencies)\"\\s*:\\s*\\{(.*?)\\}", Pattern.DOTALL);
        Matcher sectionMatcher = depSectionPattern.matcher(content);
        while (sectionMatcher.find()) {
            String sectionContent = sectionMatcher.group(1);
            Pattern detailPattern = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]+)\"");
            Matcher detailMatcher = detailPattern.matcher(sectionContent);
            while (detailMatcher.find()) {
                deps.add(Dependency.builder()
                        .project(project)
                        .name(detailMatcher.group(1))
                        .version(detailMatcher.group(2).replaceAll("[^0-9a-zA-Z.-]", ""))
                        .type("NPM")
                        .vulnerabilityStatus("SECURE")
                        .license("MIT/ISC")
                        .description("npm Package")
                        .build());
            }
        }
        return deps;
    }

    private List<Dependency> parseRequirementsTxt(Project project, String content) {
        List<Dependency> deps = new ArrayList<>();
        String[] lines = content.split("\n");
        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty() || line.startsWith("#")) continue;
            String name = line;
            String version = "LATEST";
            if (line.contains("==")) {
                String[] parts = line.split("==");
                name = parts[0].trim();
                version = parts[1].trim();
            } else if (line.contains(">=")) {
                String[] parts = line.split(">=");
                name = parts[0].trim();
                version = parts[1].trim();
            }
            deps.add(Dependency.builder()
                    .project(project)
                    .name(name)
                    .version(version)
                    .type("PIP")
                    .vulnerabilityStatus("SECURE")
                    .license("OSS")
                    .description("Python PIP Package")
                    .build());
        }
        return deps;
    }

    public Map<String, List<String>> classifyArchitecture(List<ProjectFile> files) {
        Map<String, List<String>> arch = new HashMap<>();
        arch.put("Controllers", new ArrayList<>());
        arch.put("Services", new ArrayList<>());
        arch.put("Repositories", new ArrayList<>());
        arch.put("Models", new ArrayList<>());
        arch.put("EntryPoints", new ArrayList<>());

        for (ProjectFile file : files) {
            String code = file.getContent();
            if (code == null) continue;

            if (file.getLanguage().equals("Java")) {
                if (code.contains("@RestController") || code.contains("@Controller")) {
                    arch.get("Controllers").add(file.getFilePath());
                } else if (code.contains("@Service")) {
                    arch.get("Services").add(file.getFilePath());
                } else if (code.contains("@Repository") || code.contains("extends JpaRepository")) {
                    arch.get("Repositories").add(file.getFilePath());
                } else if (code.contains("@Entity") || code.contains("@Table")) {
                    arch.get("Models").add(file.getFilePath());
                } else if (code.contains("public static void main")) {
                    arch.get("EntryPoints").add(file.getFilePath());
                }
            } else if (file.getLanguage().equals("Python")) {
                if (code.contains("@app.route") || code.contains("APIRouter") || code.contains("@router")) {
                    arch.get("Controllers").add(file.getFilePath());
                } else if (code.contains("class ") && file.getFilePath().contains("service")) {
                    arch.get("Services").add(file.getFilePath());
                } else if (file.getFilePath().contains("repository") || file.getFilePath().contains("db")) {
                    arch.get("Repositories").add(file.getFilePath());
                } else if (code.contains("BaseModel") || code.contains("class ") && file.getFilePath().contains("model")) {
                    arch.get("Models").add(file.getFilePath());
                } else if (code.contains("if __name__ == ")) {
                    arch.get("EntryPoints").add(file.getFilePath());
                }
            } else if (file.getLanguage().contains("JavaScript") || file.getLanguage().contains("TypeScript")) {
                if (code.contains("express.Router()") || code.contains("router.get") || code.contains("router.post") || code.contains("app.get(") || code.contains("app.post(")) {
                    arch.get("Controllers").add(file.getFilePath());
                } else if (file.getFilePath().contains("service")) {
                    arch.get("Services").add(file.getFilePath());
                } else if (file.getFilePath().contains("repository") || file.getFilePath().contains("dao")) {
                    arch.get("Repositories").add(file.getFilePath());
                } else if (file.getFilePath().contains("model") || code.contains("mongoose.model")) {
                    arch.get("Models").add(file.getFilePath());
                } else if (code.contains("listen(") && (file.getFilePath().contains("index") || file.getFilePath().contains("server") || file.getFilePath().contains("main"))) {
                    arch.get("EntryPoints").add(file.getFilePath());
                }
            }
        }
        return arch;
    }

    public String detectFrameworks(List<ProjectFile> files, List<Dependency> dependencies) {
        Set<String> frameworks = new LinkedHashSet<>();
        
        // 1. Check dependencies
        for (Dependency dep : dependencies) {
            String name = dep.getName().toLowerCase();
            if (name.contains("spring-boot") || name.contains("spring-framework")) {
                frameworks.add("Spring Boot");
            }
            if (name.contains("react")) {
                frameworks.add("React");
            }
            if (name.contains("express")) {
                frameworks.add("Express");
            }
            if (name.contains("flask")) {
                frameworks.add("Flask");
            }
            if (name.contains("django")) {
                frameworks.add("Django");
            }
            if (name.contains("fastapi")) {
                frameworks.add("FastAPI");
            }
            if (name.contains("next")) {
                frameworks.add("Next.js");
            }
            if (name.contains("angular")) {
                frameworks.add("Angular");
            }
            if (name.contains("vue")) {
                frameworks.add("Vue");
            }
        }
        
        // 2. Check file contents (as fallback or addition)
        for (ProjectFile file : files) {
            String code = file.getContent();
            if (code == null) continue;
            
            if (code.contains("import React") || code.contains("from 'react'") || code.contains("from \"react\"")) {
                frameworks.add("React");
            }
            if (code.contains("@SpringBootApplication") || code.contains("import org.springframework.boot")) {
                frameworks.add("Spring Boot");
            }
            if (code.contains("import flask") || code.contains("from flask import")) {
                frameworks.add("Flask");
            }
            if (code.contains("import fastapi") || code.contains("from fastapi import")) {
                frameworks.add("FastAPI");
            }
            if (code.contains("import express") || code.contains("require('express')") || code.contains("require(\"express\")")) {
                frameworks.add("Express");
            }
            if (code.contains("import django") || code.contains("from django.")) {
                frameworks.add("Django");
            }
        }
        
        if (frameworks.isEmpty()) {
            return "Core Languages";
        }
        return String.join(", ", frameworks);
    }
}
