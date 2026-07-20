package com.codedna.ai.service;

import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.model.SBOMReport;
import com.codedna.ai.model.SecurityReport;
import com.codedna.ai.model.AnalysisRun;
import com.codedna.ai.repository.DependencyRepository;
import com.codedna.ai.repository.ProjectFileRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.SBOMReportRepository;
import com.codedna.ai.repository.SecurityReportRepository;
import com.codedna.ai.repository.AnalysisRunRepository;

@Service
public class AnalysisService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AnalysisService.class);

    private final GitService gitService;
    private final FileAnalyzerService fileAnalyzerService;
    private final SecurityService securityService;
    private final SbomService sbomService;
    private final AIService aiService;
    private final VectorStoreService vectorStoreService;

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final DependencyRepository dependencyRepository;
    private final SecurityReportRepository securityReportRepository;
    private final SBOMReportRepository sbomReportRepository;
    private final AnalysisRunRepository analysisRunRepository;

    public AnalysisService(
            GitService gitService,
            FileAnalyzerService fileAnalyzerService,
            SecurityService securityService,
            SbomService sbomService,
            AIService aiService,
            VectorStoreService vectorStoreService,
            ProjectRepository projectRepository,
            ProjectFileRepository projectFileRepository,
            DependencyRepository dependencyRepository,
            SecurityReportRepository securityReportRepository,
            SBOMReportRepository sbomReportRepository,
            AnalysisRunRepository analysisRunRepository
    ) {
        this.gitService = gitService;
        this.fileAnalyzerService = fileAnalyzerService;
        this.securityService = securityService;
        this.sbomService = sbomService;
        this.aiService = aiService;
        this.vectorStoreService = vectorStoreService;
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.dependencyRepository = dependencyRepository;
        this.securityReportRepository = securityReportRepository;
        this.sbomReportRepository = sbomReportRepository;
        this.analysisRunRepository = analysisRunRepository;
    }

    // Track active analysis progress (percentage and stage) for real-time live console queries
    private final Map<Long, String> projectAnalysisProgress = new HashMap<>();

    public String getAnalysisProgress(Long projectId) {
        return projectAnalysisProgress.getOrDefault(projectId, "Ready");
    }

    @Transactional
    public Project analyzeGitRepository(Project project, String geminiKey, String openaiKey, String devLevel) {
        Long id = project.getId();
        try {
            projectAnalysisProgress.put(id, "Cloning Repository... (15%)");
            File clonedDir = gitService.cloneRepository(project.getGitUrl());
            project.setLocalPath(clonedDir.getAbsolutePath());
            projectRepository.save(project);

            Project result = analyzeLocalPath(project, clonedDir, geminiKey, openaiKey, devLevel);
            
            // Clean up cloned files to save space after analyzing/indexing into database
            gitService.cleanDirectory(clonedDir);
            projectAnalysisProgress.put(id, "Ready");
            return result;
        } catch (Exception e) {
            log.error("Failed to analyze repository {}: {}", project.getName(), e.getMessage());
            projectAnalysisProgress.put(id, "Error: " + e.getMessage());
            throw new RuntimeException("Repository analysis failed: " + e.getMessage(), e);
        }
    }

    @Transactional
    public Project analyzeLocalDirectory(Project project, File directory, String geminiKey, String openaiKey, String devLevel) {
        Long id = project.getId();
        try {
            project.setLocalPath(directory.getAbsolutePath());
            projectRepository.save(project);

            Project result = analyzeLocalPath(project, directory, geminiKey, openaiKey, devLevel);
            projectAnalysisProgress.put(id, "Ready");
            return result;
        } catch (Exception e) {
            log.error("Failed to analyze folder {}: {}", project.getName(), e.getMessage());
            projectAnalysisProgress.put(id, "Error: " + e.getMessage());
            throw new RuntimeException("Folder analysis failed: " + e.getMessage(), e);
        }
    }

    private Project analyzeLocalPath(Project project, File dir, String geminiKey, String openaiKey, String devLevel) throws Exception {
        Long id = project.getId();
        List<ProjectFile> files;

        if (project.getType() == Project.ProjectType.REPOSITORY) {
            // Clean up previous run's data to prevent database constraint violations
            deleteExistingProjectData(project);

            // 1. Scan and read file structure from cloned repository
            projectAnalysisProgress.put(id, "Reading Files and Detecting Languages... (30%)");
            files = fileAnalyzerService.analyzeProjectFiles(project, dir);
            projectFileRepository.saveAll(files);
        } else {
            // For FOLDER and FILE projects, files are uploaded directly via REST API.
            // Load them from the database instead of scanning the backend root dir.
            projectAnalysisProgress.put(id, "Reading Uploaded Files... (30%)");
            files = projectFileRepository.findByProject(project);

            // Clean up old reports and dependencies (but preserve the files!)
            sbomReportRepository.findByProject(project).ifPresent(sbomReportRepository::delete);
            securityReportRepository.findByProject(project).ifPresent(securityReportRepository::delete);
            List<Dependency> dependencies = dependencyRepository.findByProject(project);
            if (!dependencies.isEmpty()) {
                dependencyRepository.deleteAll(dependencies);
            }
            sbomReportRepository.flush();
            securityReportRepository.flush();
            dependencyRepository.flush();
        }

        // 2. Parse dependencies
        projectAnalysisProgress.put(id, "Finding Dependencies and Generating SBOM... (50%)");
        List<Dependency> dependencies = fileAnalyzerService.parseDependencies(project, files);
        dependencyRepository.saveAll(dependencies);

        // Generate CycloneDX SBOM
        SBOMReport sbom = sbomService.generateSbom(project, dependencies, "CycloneDX");
        sbomReportRepository.save(sbom);

        // 3. Security Scan
        projectAnalysisProgress.put(id, "Running Security Scanner... (70%)");
        SecurityReport securityReport = securityService.runScan(project, files, dependencies);
        securityReportRepository.save(securityReport);

        // 4. Create RAG knowledge base
        projectAnalysisProgress.put(id, "Creating AI Knowledge Base... (85%)");
        vectorStoreService.indexProjectFiles(project.getId(), files);

        // 5. Generate AI summary, framework definitions and roadmap
        projectAnalysisProgress.put(id, "Generating Architecture & Documentation... (95%)");
        
        // Setup simple framework lists using the new framework detector
        String detectedFrameworks = fileAnalyzerService.detectFrameworks(files, dependencies);
        project.setFrameworks(detectedFrameworks);

        // Language lists
        String detectedLanguages = files.stream()
                .map(ProjectFile::getLanguage)
                .distinct()
                .collect(Collectors.joining(", "));
        project.setLanguages(detectedLanguages);

        // Call AI for Project Summary & Roadmap with rich codebase context
        StringBuilder codebaseContext = new StringBuilder();
        codebaseContext.append("Codebase Structure (File Paths):\n");
        int pathCount = 0;
        for (ProjectFile file : files) {
            if (pathCount++ < 60) {
                codebaseContext.append("- ").append(file.getFilePath()).append("\n");
            }
        }
        
        for (ProjectFile file : files) {
            String path = file.getFilePath().toLowerCase();
            if (path.equals("readme.md") || path.equals("package.json") || path.equals("requirements.txt") || path.equals("pom.xml") || path.endsWith("main.py") || path.endsWith("app.py") || path.contains("controller") || path.contains("router")) {
                codebaseContext.append("\nFile Content: ").append(file.getFilePath()).append("\n");
                String content = file.getContent();
                if (content != null) {
                    codebaseContext.append(content.substring(0, Math.min(content.length(), 1000))).append("\n");
                }
            }
        }

        String promptSummary = String.format(
                "You are analyzing the actual codebase of a project named '%s'.\n\n" +
                "Here is the context of the repository:\n%s\n\n" +
                "Please analyze the provided codebase context and write a detailed, professional project summary. " +
                "Focus on the actual files, architecture, design patterns, dependencies, and core libraries present in this specific codebase.",
                project.getName(), codebaseContext.toString());
        String summary = aiService.generateResponse("You are an expert software architect analyzing a codebase.", promptSummary, geminiKey, openaiKey);
        project.setSummary(summary);

        String promptRoadmap = String.format(
                "You are generating an onboarding roadmap for a new developer joining the project '%s'.\n\n" +
                "The target audience developer experience level is: '%s' (e.g. junior, mid, or senior).\n" +
                "Please customize the roadmap detail specifically for this level (e.g., if junior, give step-by-step instructions and command lines; if senior, focus on higher-level architectural design, system boundaries, and API integrations).\n\n" +
                "Here is the context of the repository:\n%s\n\n" +
                "Please generate a structured 5-day developer onboarding learning roadmap specific to this codebase. " +
                "Refer to the actual setup files (e.g. requirements.txt, pom.xml, package.json) and entry points present in this repository.",
                project.getName(), devLevel, codebaseContext.toString());
        String roadmap = aiService.generateResponse("You are an expert developer relations onboarding lead.", promptRoadmap, geminiKey, openaiKey);
        project.setLearningRoadmap(roadmap);

        // Update overall metrics
        project.setSecurityScore(securityReport.getScore());
        
        // Calculate health score: 40% Security + 40% Complexity/Maintainability + 20% Code Structure
        int avgComplexity = (int) files.stream().mapToInt(ProjectFile::getComplexity).average().orElse(1);
        int complexityScore = Math.max(20, 100 - (avgComplexity * 5));
        int structureScore = !files.isEmpty() ? 90 : 70;
        
        int health = (int) Math.round((securityReport.getScore() * 0.4) + (complexityScore * 0.4) + (structureScore * 0.2));
        health = Math.max(20, Math.min(100, health));
        project.setHealthScore(health);

        projectRepository.save(project);

        // Record history log snapshot
        long totalLoc = files.stream().mapToLong(f -> {
            String content = f.getContent();
            if (content == null) return 0;
            return content.split("\n").length;
        }).sum();

        int vulnerabilitiesCount = 0;
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            List<?> list = mapper.readValue(securityReport.getIssuesFound(), List.class);
            vulnerabilitiesCount = list.size();
        } catch (Exception e) {
            log.warn("Failed to parse issues count for history log: {}", e.getMessage());
        }

        AnalysisRun run = new AnalysisRun(project, health, securityReport.getScore(), totalLoc, vulnerabilitiesCount);
        analysisRunRepository.save(run);

        return project;
    }

    private void deleteExistingProjectData(Project project) {
        log.info("Cleaning up previous analysis data for project ID: {}", project.getId());
        
        // 1. Delete SBOM Reports
        sbomReportRepository.findByProject(project).ifPresent(sbomReportRepository::delete);
        
        // 2. Delete Security Reports
        securityReportRepository.findByProject(project).ifPresent(securityReportRepository::delete);
        
        // 3. Delete Dependencies
        List<Dependency> dependencies = dependencyRepository.findByProject(project);
        if (!dependencies.isEmpty()) {
            dependencyRepository.deleteAll(dependencies);
        }
        
        // 4. Delete Project Files
        List<ProjectFile> files = projectFileRepository.findByProject(project);
        if (!files.isEmpty()) {
            projectFileRepository.deleteAll(files);
        }
        
        // Flush all deletions to DB
        sbomReportRepository.flush();
        securityReportRepository.flush();
        dependencyRepository.flush();
        projectFileRepository.flush();
    }
}
