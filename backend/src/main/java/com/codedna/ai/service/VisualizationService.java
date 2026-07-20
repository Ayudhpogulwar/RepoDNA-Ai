package com.codedna.ai.service;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.ProjectFile;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.regex.Pattern;
import java.util.regex.Matcher;

@Service
public class VisualizationService {

    public static class GraphNode {
        public String id;
        public String label;
        public String type; // e.g. file, folder, controller, service, model, package
        public Map<String, Object> data;

        public GraphNode(String id, String label, String type, String filePath) {
            this.id = id;
            this.label = label;
            this.type = type;
            this.data = new HashMap<>();
            this.data.put("label", label);
            this.data.put("filePath", filePath);
        }
    }

    public static class GraphEdge {
        public String id;
        public String source;
        public String target;
        public String label;
        public String animated;

        public GraphEdge(String source, String target, String label, boolean animated) {
            this.id = source + "->" + target;
            this.source = source;
            this.target = target;
            this.label = label;
            this.animated = animated ? "true" : "false";
        }
    }

    public static class GraphData {
        public List<GraphNode> nodes = new ArrayList<>();
        public List<GraphEdge> edges = new ArrayList<>();
    }

    public GraphData buildFolderTreeGraph(List<ProjectFile> files) {
        GraphData graph = new GraphData();
        Set<String> createdFolders = new HashSet<>();

        // Add root node
        graph.nodes.add(new GraphNode("root", "Project Root", "folder", ""));

        for (ProjectFile file : files) {
            String path = file.getFilePath();
            String[] parts = path.split("/");
            String parentId = "root";

            // Traverse directories
            StringBuilder currentPath = new StringBuilder();
            for (int i = 0; i < parts.length - 1; i++) {
                if (i > 0) currentPath.append("/");
                currentPath.append(parts[i]);
                String folderPath = currentPath.toString();

                if (!createdFolders.contains(folderPath)) {
                    createdFolders.add(folderPath);
                    GraphNode folderNode = new GraphNode(folderPath, parts[i], "folder", folderPath);
                    graph.nodes.add(folderNode);
                    graph.edges.add(new GraphEdge(parentId, folderPath, "", false));
                }
                parentId = folderPath;
            }

            // Add leaf file node
            GraphNode fileNode = new GraphNode(path, file.getFileName(), "file", path);
            fileNode.data.put("language", file.getLanguage());
            fileNode.data.put("size", file.getSize());
            graph.nodes.add(fileNode);
            graph.edges.add(new GraphEdge(parentId, path, "", false));
        }

        return graph;
    }

    public GraphData buildDependencyGraph(List<Dependency> dependencies) {
        GraphData graph = new GraphData();
        graph.nodes.add(new GraphNode("app-root", "Primary App", "app", ""));

        for (Dependency dep : dependencies) {
            String depId = "dep-" + dep.getName();
            GraphNode node = new GraphNode(depId, dep.getName() + " (" + dep.getVersion() + ")", "package", "");
            node.data.put("status", dep.getVulnerabilityStatus());
            node.data.put("license", dep.getLicense());
            graph.nodes.add(node);
            graph.edges.add(new GraphEdge("app-root", depId, dep.getType(), dep.getVulnerabilityStatus().equals("VULNERABLE")));
        }

        return graph;
    }

    public GraphData buildApiExecutionFlow(List<ProjectFile> files) {
        GraphData graph = new GraphData();
        List<ProjectFile> controllers = new ArrayList<>();
        List<ProjectFile> services = new ArrayList<>();
        List<ProjectFile> repos = new ArrayList<>();
        List<ProjectFile> models = new ArrayList<>();

        for (ProjectFile file : files) {
            String content = file.getContent();
            if (content == null) continue;
            String path = file.getFilePath().toLowerCase();

            // 1. JAVA / SPRING BOOT
            if (file.getLanguage().equals("Java")) {
                if (content.contains("@RestController") || content.contains("@Controller") || content.contains("@RequestMapping")) {
                    controllers.add(file);
                } else if (content.contains("@Service") || path.contains("service")) {
                    services.add(file);
                } else if (content.contains("@Repository") || content.contains("JpaRepository") || path.contains("repository")) {
                    repos.add(file);
                } else if (content.contains("@Entity") || content.contains("@Table") || path.contains("model") || path.contains("dto")) {
                    models.add(file);
                }
            } 
            // 2. PYTHON / FLASK / FASTAPI / DJANGO
            else if (file.getLanguage().equals("Python")) {
                if (content.contains("@app.route") || content.contains("@router.") || content.contains("APIRouter") || path.contains("controller") || path.contains("views")) {
                    controllers.add(file);
                } else if (path.contains("service") || path.contains("logic") || content.contains("class ") && path.contains("service")) {
                    services.add(file);
                } else if (path.contains("repository") || path.contains("db") || path.contains("dao")) {
                    repos.add(file);
                } else if (path.contains("model") || content.contains("BaseModel") || path.contains("entity")) {
                    models.add(file);
                }
            } 
            // 3. JAVASCRIPT / TYPESCRIPT / EXPRESS / REACT
            else if (file.getLanguage().contains("JavaScript") || file.getLanguage().contains("TypeScript")) {
                if (path.contains("page") || path.contains("component") || path.contains("controller") || content.contains("express.Router") || content.contains("app.get") || content.contains("app.post")) {
                    controllers.add(file);
                } else if (path.contains("service") || path.contains("hook") || path.contains("action") || content.contains("useContext")) {
                    services.add(file);
                } else if (path.contains("repository") || path.contains("api") || path.contains("queries") || path.contains("db")) {
                    repos.add(file);
                } else if (path.contains("model") || path.contains("type") || path.contains("dto") || content.contains("mongoose.model")) {
                    models.add(file);
                }
            }
        }

        // Create React Flow node points for architectural components
        for (ProjectFile c : controllers) {
            GraphNode n = new GraphNode("ctrl-" + c.getFileName(), c.getFileName(), "controller", c.getFilePath());
            graph.nodes.add(n);
        }
        for (ProjectFile s : services) {
            GraphNode n = new GraphNode("svc-" + s.getFileName(), s.getFileName(), "service", s.getFilePath());
            graph.nodes.add(n);
        }
        for (ProjectFile r : repos) {
            GraphNode n = new GraphNode("rep-" + r.getFileName(), r.getFileName(), "repository", r.getFilePath());
            graph.nodes.add(n);
        }
        for (ProjectFile m : models) {
            GraphNode n = new GraphNode("mod-" + m.getFileName(), m.getFileName(), "model", m.getFilePath());
            graph.nodes.add(n);
        }

        // Draw edges based on lexical reference (case-insensitive or camelCase checks)
        for (ProjectFile c : controllers) {
            for (ProjectFile s : services) {
                String serviceName = s.getFileName().replace(".java", "").replace(".py", "").replace(".tsx", "").replace(".jsx", "").replace(".ts", "").replace(".js", "");
                if (c.getContent().contains(serviceName) || c.getContent().toLowerCase().contains(serviceName.toLowerCase())) {
                    graph.edges.add(new GraphEdge("ctrl-" + c.getFileName(), "svc-" + s.getFileName(), "uses", true));
                }
            }
        }

        for (ProjectFile s : services) {
            for (ProjectFile r : repos) {
                String repoName = r.getFileName().replace(".java", "").replace(".py", "").replace(".tsx", "").replace(".jsx", "").replace(".ts", "").replace(".js", "");
                if (s.getContent().contains(repoName) || s.getContent().toLowerCase().contains(repoName.toLowerCase())) {
                    graph.edges.add(new GraphEdge("svc-" + s.getFileName(), "rep-" + r.getFileName(), "queries", true));
                }
            }
        }

        for (ProjectFile r : repos) {
            for (ProjectFile m : models) {
                String modelName = m.getFileName().replace(".java", "").replace(".py", "").replace(".tsx", "").replace(".jsx", "").replace(".ts", "").replace(".js", "");
                if (r.getContent().contains(modelName) || r.getContent().toLowerCase().contains(modelName.toLowerCase())) {
                    graph.edges.add(new GraphEdge("rep-" + r.getFileName(), "mod-" + m.getFileName(), "maps", false));
                }
            }
        }

        // Default nodes if graph is empty to show how it fits together
        if (graph.nodes.isEmpty()) {
            graph.nodes.add(new GraphNode("ctrl-DemoController", "DemoController.js", "controller", "DemoController.js"));
            graph.nodes.add(new GraphNode("svc-DemoService", "DemoService.js", "service", "DemoService.js"));
            graph.nodes.add(new GraphNode("rep-DemoRepository", "DemoRepository.js", "repository", "DemoRepository.js"));
            graph.nodes.add(new GraphNode("mod-DemoModel", "DemoModel.js", "model", "DemoModel.js"));
            graph.edges.add(new GraphEdge("ctrl-DemoController", "svc-DemoService", "invokes", true));
            graph.edges.add(new GraphEdge("svc-DemoService", "rep-DemoRepository", "queries", true));
            graph.edges.add(new GraphEdge("rep-DemoRepository", "mod-DemoModel", "maps", false));
        }

        return graph;
    }

    public GraphData buildDataFlowGraph(List<ProjectFile> files) {
        GraphData graph = new GraphData();
        List<String> endpoints = new ArrayList<>();
        Set<String> tables = new LinkedHashSet<>();
        
        for (ProjectFile file : files) {
            String content = file.getContent();
            if (content == null) continue;
            
            // Extract endpoints (Spring Boot / Express / Flask routes)
            Pattern routePattern = Pattern.compile("@(?:Get|Post|Put|Delete)Mapping\\(\"([^\"]+)\"\\)|router\\.(?:get|post|put|delete)\\('([^']+)'\\)|@app\\.route\\('([^']+)'\\)");
            Matcher routeMatcher = routePattern.matcher(content);
            while (routeMatcher.find()) {
                String path = routeMatcher.group(1) != null ? routeMatcher.group(1) : 
                              routeMatcher.group(2) != null ? routeMatcher.group(2) : routeMatcher.group(3);
                if (path != null && !path.isEmpty()) {
                    endpoints.add(path);
                }
            }
            
            // Extract tables (e.g. @Table(name = "..."), mongoose.model('...', ...))
            Pattern tablePattern = Pattern.compile("@Table\\(name\\s*=\\s*\"([^\"]+)\"\\)|mongoose\\.model\\('([^']+)'");
            Matcher tableMatcher = tablePattern.matcher(content);
            while (tableMatcher.find()) {
                String table = tableMatcher.group(1) != null ? tableMatcher.group(1) : tableMatcher.group(2);
                if (table != null && !table.isEmpty()) {
                    tables.add(table);
                }
            }
        }
        
        if (endpoints.isEmpty()) {
            endpoints.add("/api/auth/register");
            endpoints.add("/api/auth/login");
            endpoints.add("/api/projects");
        }
        if (tables.isEmpty()) {
            tables.add("users");
            tables.add("projects");
            tables.add("project_files");
        }
        
        // Layer 1: Client/Input
        graph.nodes.add(new GraphNode("input-user", "User Input / Client Request", "input", ""));
        
        // Layer 2: API Gateway / Endpoints
        int idx = 0;
        for (String endpoint : endpoints) {
            String id = "ep-" + endpoint;
            graph.nodes.add(new GraphNode(id, "Endpoint: " + endpoint, "controller", ""));
            graph.edges.add(new GraphEdge("input-user", id, "sends data", true));
            idx++;
            if (idx > 4) break; // Limit endpoints for visual clarity
        }
        
        // Layer 3: Database Tables
        for (String table : tables) {
            String id = "tbl-" + table;
            graph.nodes.add(new GraphNode(id, "Table: " + table, "repository", ""));
            
            // Connect endpoints to tables
            for (String endpoint : endpoints) {
                String epId = "ep-" + endpoint;
                if (endpoint.contains(table.substring(0, Math.min(4, table.length())).toLowerCase())) {
                    graph.edges.add(new GraphEdge(epId, id, "writes/reads", true));
                }
            }
        }
        
        // Ensure all tables are connected
        for (String table : tables) {
            String tblId = "tbl-" + table;
            boolean connected = false;
            for (GraphEdge edge : graph.edges) {
                if (edge.target.equals(tblId)) {
                    connected = true;
                    break;
                }
            }
            if (!connected && !endpoints.isEmpty()) {
                graph.edges.add(new GraphEdge("ep-" + endpoints.get(0), tblId, "updates", true));
            }
        }
        
        return graph;
    }

    public String generateMermaidClassDiagram(List<ProjectFile> files) {
        StringBuilder sb = new StringBuilder();
        sb.append("classDiagram\n");

        int classCount = 0;
        for (ProjectFile file : files) {
            if (!file.getLanguage().equals("Java") && !file.getLanguage().equals("TypeScript") && !file.getLanguage().equals("Python")) continue;
            
            String code = file.getContent();
            if (code == null) continue;

            // Simple parser for class name and public methods
            Pattern classPattern = Pattern.compile("class\\s+(\\w+)");
            Matcher classMatcher = classPattern.matcher(code);
            if (classMatcher.find()) {
                String className = classMatcher.group(1);
                sb.append("    class ").append(className).append(" {\n");
                
                // Add public methods
                Pattern methodPattern = Pattern.compile("public\\s+\\w+\\s+(\\w+)\\s*\\(");
                Matcher methodMatcher = methodPattern.matcher(code);
                int methodsFound = 0;
                while (methodMatcher.find() && methodsFound < 4) {
                    sb.append("        +").append(methodMatcher.group(1)).append("()\n");
                    methodsFound++;
                }
                sb.append("    }\n");
                classCount++;
            }
            if (classCount > 8) break; // Limit size of class diagram for readability
        }

        if (classCount == 0) {
            sb.append("    class User {\n        +Long id\n        +String username\n        +login()\n    }\n");
            sb.append("    class Project {\n        +Long id\n        +String name\n        +analyze()\n    }\n");
            sb.append("    User --> Project : owns\n");
        }

        return sb.toString();
    }

    public String generateMermaidSequenceDiagram(List<ProjectFile> files) {
        return """
        sequenceDiagram
            actor Developer as Client
            participant API as API Controller
            participant Auth as Auth Filter
            participant Service as Security Service
            participant DB as Database
            
            Developer->>API: GET /api/projects (Authorization Header)
            API->>Auth: Validate JWT Token
            Auth-->>API: Token Approved (ROLE_USER)
            API->>Service: fetchProjects(userId)
            Service->>DB: Query Projects Table
            DB-->>Service: Project List Results
            Service-->>API: Processed Projects DTO
            API-->>Developer: 200 OK (Projects JSON)
        """;
    }

    public static class TechDebtItem {
        public String filePath;
        public String fileName;
        public String language;
        public int linesOfCode;
        public int complexity;
        public int debtScore;
        public String debtLevel;
        public String riskCategory;
        public String recommendation;

        public TechDebtItem(String filePath, String fileName, String language, int loc, int complexity, int debtScore, String debtLevel, String riskCategory, String recommendation) {
            this.filePath = filePath;
            this.fileName = fileName;
            this.language = language;
            this.linesOfCode = loc;
            this.complexity = complexity;
            this.debtScore = debtScore;
            this.debtLevel = debtLevel;
            this.riskCategory = riskCategory;
            this.recommendation = recommendation;
        }
    }

    public List<TechDebtItem> calculateTechnicalDebtHeatmap(List<ProjectFile> files) {
        List<TechDebtItem> debtItems = new ArrayList<>();

        for (ProjectFile file : files) {
            String content = file.getContent() != null ? file.getContent() : "";
            int loc = content.isEmpty() ? 10 : content.split("\n").length;
            int complexity = file.getComplexity() > 0 ? file.getComplexity() : 1;

            int score = 0;
            score += Math.min(40, (loc / 25) * 5);
            score += Math.min(40, complexity * 6);

            if (content.contains("SELECT") && content.contains("+")) score += 25;
            if (content.toLowerCase().contains("password") || content.toLowerCase().contains("secret")) score += 20;
            if (content.contains("catch (Exception") || content.contains("catch (e)")) score += 10;

            score = Math.min(100, Math.max(10, score));

            String level = "LOW";
            String category = "Clean Code";
            String rec = "Logic paths are well-balanced.";

            if (score >= 75) {
                level = "CRITICAL";
                category = "Security & Refactoring Risk";
                rec = "High cyclomatic complexity and risk flags. Immediate refactoring recommended.";
            } else if (score >= 50) {
                level = "HIGH";
                category = "Maintainability Bottleneck";
                rec = "Decompose methods into smaller functions to improve testability.";
            } else if (score >= 30) {
                level = "MEDIUM";
                category = "Code Quality Smell";
                rec = "Consider adding inline docstrings and unit tests.";
            }

            debtItems.add(new TechDebtItem(file.getFilePath(), file.getFileName(), file.getLanguage(), loc, complexity, score, level, category, rec));
        }

        debtItems.sort((a, b) -> Integer.compare(b.debtScore, a.debtScore));
        return debtItems;
    }
}
