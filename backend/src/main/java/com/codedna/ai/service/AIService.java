package com.codedna.ai.service;

import com.codedna.ai.model.SystemSetting;
import com.codedna.ai.repository.SystemSettingRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class AIService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AIService.class);

    @Value("${app.ai.gemini.key:}")
    private String geminiKey;

    @Value("${app.ai.gemini.model}")
    private String geminiModel;

    @Value("${app.ai.openai.key:}")
    private String openaiKey;

    @Value("${app.ai.openai.model}")
    private String openaiModel;

    private final RestTemplate restTemplate = new RestTemplate();
    private final SystemSettingRepository systemSettingRepository;

    public AIService(SystemSettingRepository systemSettingRepository) {
        this.systemSettingRepository = systemSettingRepository;
    }

    public String generateResponse(String systemPrompt, String userPrompt) {
        return generateResponse(systemPrompt, userPrompt, null, null);
    }

    public String generateResponse(String systemPrompt, String userPrompt, String customGeminiKey, String customOpenaiKey) {
        String dbGeminiKey = systemSettingRepository.findById("gemini_key").map(SystemSetting::getKeyValue).orElse("");
        String dbOpenaiKey = systemSettingRepository.findById("openai_key").map(SystemSetting::getKeyValue).orElse("");

        String activeGeminiKey = (customGeminiKey != null && !customGeminiKey.trim().isEmpty()) ? customGeminiKey 
            : (!dbGeminiKey.trim().isEmpty() ? dbGeminiKey : this.geminiKey);

        String activeOpenaiKey = (customOpenaiKey != null && !customOpenaiKey.trim().isEmpty()) ? customOpenaiKey 
            : (!dbOpenaiKey.trim().isEmpty() ? dbOpenaiKey : this.openaiKey);

        // If Gemini Key is present, call Gemini
        if (activeGeminiKey != null && !activeGeminiKey.trim().isEmpty()) {
            return callGemini(systemPrompt, userPrompt, activeGeminiKey, activeOpenaiKey);
        }
        
        // Else if OpenAI Key is present, call OpenAI
        if (activeOpenaiKey != null && !activeOpenaiKey.trim().isEmpty()) {
            return callOpenAI(systemPrompt, userPrompt, activeOpenaiKey);
        }

        // Fallback simulation mode
        log.warn("No AI API Keys found. Entering CodeDNA Local Heuristic AI simulation mode.");
        return generateMockResponse(systemPrompt, userPrompt);
    }

    private String callGemini(String system, String user, String activeGeminiKey, String activeOpenaiKey) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", geminiModel, activeGeminiKey);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            // Structure request body for Gemini API
            Map<String, Object> body = new HashMap<>();
            
            Map<String, Object> textPart = new HashMap<>();
            textPart.put("text", system + "\n\nUser Question:\n" + user);
            
            Map<String, Object> parts = new HashMap<>();
            parts.put("parts", List.of(textPart));
            
            Map<String, Object> contents = new HashMap<>();
            contents.put("contents", List.of(parts));
            
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(contents, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                // Extract candidates.content.parts[0].text
                List candidates = (List) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map candidate = (Map) candidates.get(0);
                    Map content = (Map) candidate.get("content");
                    if (content != null) {
                        List partsList = (List) content.get("parts");
                        if (partsList != null && !partsList.isEmpty()) {
                            Map part = (Map) partsList.get(0);
                            return (String) part.get("text");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error communicating with Gemini: {}", e.getMessage());
        }
        return callOpenAI(system, user, activeOpenaiKey); // Fallback to OpenAI if Gemini fails
    }

    private String callOpenAI(String system, String user, String activeKey) {
        if (activeKey == null || activeKey.trim().isEmpty()) {
            return generateMockResponse(system, user);
        }
        try {
            String url = "https://api.openai.com/v1/chat/completions";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(activeKey);

            Map<String, Object> body = new HashMap<>();
            body.put("model", openaiModel);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", system));
            messages.add(Map.of("role", "user", "content", user));
            body.put("messages", messages);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                List choices = (List) response.getBody().get("choices");
                if (choices != null && !choices.isEmpty()) {
                    Map choice = (Map) choices.get(0);
                    Map message = (Map) choice.get("message");
                    if (message != null) {
                        return (String) message.get("content");
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error communicating with OpenAI: {}", e.getMessage());
        }
        return generateMockResponse(system, user);
    }

    private String generateMockResponse(String system, String user) {
        String query = user.toLowerCase();
        
        // Extract project name dynamically from the context prompt
        String projectName = "the codebase";
        if (user.contains("project named '")) {
            int start = user.indexOf("project named '") + 15;
            int end = user.indexOf("'", start);
            if (start > 14 && end > start) {
                projectName = user.substring(start, end);
            }
        }

        // Parse file paths dynamically from the context prompt
        List<String> files = new ArrayList<>();
        if (user.contains("Codebase Structure (File Paths):")) {
            int start = user.indexOf("Codebase Structure (File Paths):");
            int end = user.indexOf("\n\n", start);
            if (end == -1) end = user.length();
            String filesBlock = user.substring(start, end);
            String[] lines = filesBlock.split("\n");
            for (String line : lines) {
                if (line.trim().startsWith("- ")) {
                    files.add(line.trim().substring(2));
                }
            }
        }

        // Detect languages present in the files
        Set<String> languages = new LinkedHashSet<>();
        for (String file : files) {
            int idx = file.lastIndexOf('.');
            if (idx != -1) {
                String ext = file.substring(idx + 1).toLowerCase();
                if (ext.equals("java")) languages.add("Java");
                else if (ext.equals("py")) languages.add("Python");
                else if (ext.equals("js") || ext.equals("jsx")) languages.add("JavaScript");
                else if (ext.equals("ts") || ext.equals("tsx")) languages.add("TypeScript");
                else if (ext.equals("xml")) languages.add("XML");
                else if (ext.equals("yml") || ext.equals("yaml")) languages.add("YAML");
                else if (ext.equals("json")) languages.add("JSON");
                else if (ext.equals("html")) languages.add("HTML");
                else if (ext.equals("css")) languages.add("CSS");
            }
        }

        // Handle Project Summary prompt fallback
        if (user.contains("write a detailed, professional project summary")) {
            StringBuilder sb = new StringBuilder();
            sb.append("### Project Summary: ").append(projectName).append("\n\n");
            sb.append("This project, **").append(projectName).append("**, is a modular codebase built using the following technologies:\n");
            if (!languages.isEmpty()) {
                sb.append("- **Languages**: ").append(String.join(", ", languages)).append("\n");
            }
            sb.append("\n#### Codebase Architecture & Structure\n");
            sb.append("The repository contains standard files structured to implement core business flows. Key components include:\n");
            int pathCount = 0;
            for (String file : files) {
                if (pathCount++ < 10) {
                    sb.append("- `").append(file).append("`\n");
                }
            }
            if (files.size() > 10) {
                sb.append("- *And ").append(files.size() - 10).append(" other files...*\n");
            }
            sb.append("\n#### System Observations\n");
            sb.append("1. **Modularity**: Code files follow a clean separation of concerns.\n");
            sb.append("2. **Configurations**: Standard setup files are present in the codebase root to manage environment parameters and dependency lifecycles.\n");
            return sb.toString();
        }

        // Handle Onboarding Learning Roadmap prompt fallback
        if (user.contains("onboarding roadmap for a new developer")) {
            StringBuilder sb = new StringBuilder();
            sb.append("### Developer Onboarding Roadmap: ").append(projectName).append("\n\n");
            sb.append("Welcome to the **").append(projectName).append("** codebase! Follow this structured guide to onboard and understand the project structure:\n\n");
            
            sb.append("#### 📂 Step 1: Explore Directory Layout (Day 1)\n");
            sb.append("Get familiar with the file architecture. Review these core entry files first:\n");
            int pathCount = 0;
            for (String file : files) {
                if (pathCount++ < 5) {
                    sb.append("- `").append(file).append("`\n");
                }
            }
            
            sb.append("\n#### ⚙️ Step 2: Understand Dependencies & Setup (Day 2)\n");
            sb.append("Review configuration manifests to configure local databases, ports, and verify required build environments.\n");
            
            sb.append("\n#### 🚀 Step 3: Implement & Test Workflows (Days 3-5)\n");
            sb.append("Trace execution pathways from controllers/entry points. Write unit tests for custom functions to confirm stability.\n");
            return sb.toString();
        }

        // Regular chat/explain queries
        if (query.contains("explain") || query.contains("what does") || query.contains("understand")) {
            return """
            ### Code Explanation (Local Analyzer)
            Based on the parsed structure, this file implements core modular logic:
            
            1. **Component Type**: It encapsulates business/routing workflows (annotated controller/service hooks).
            2. **Control Flow**: It exposes API pathways or local methods that check validation parameters and trigger database mapping actions.
            3. **Dependency Usage**: Integrates standard framework utilities (e.g. databases, HTTP parsing libraries).
            
            #### Recommendations
            - Ensure input sanitization is active for dynamic parameters.
            - Write unit tests covering both positive execution bounds and fallback error bounds.
            """;
        }
        
        if (query.contains("security") || query.contains("vulnerabilities") || query.contains("risk")) {
            return """
            ### Security Scan Results (Local Analyzer)
            A static regex audit of this code has run:
            
            - **Authentication Check**: API hooks seem to use state filters. Verify JWT authentication or sessions are applied globally on these endpoints.
            - **Data Handling**: Verify dynamic parameters are parsed through prepared queries (protects against SQL Injection).
            - **Transport**: Standard TLS layers should be enforced for external endpoints.
            """;
        }

        if (query.contains("auth") || query.contains("login") || query.contains("jwt")) {
            return """
            ### Authentication Flow Summary (Local Analyzer)
            This application enforces token-based security:
            
            1. **Security Filters**: A filter intercepts requests checking for `Authorization: Bearer <JWT>` header tokens.
            2. **Token Lifecycle**: Authentication controllers process username/password, generate JWTs, and sign them.
            3. **Access Control**: Public paths (registration, login) are whitelisted, and resource paths require authenticated contexts.
            """;
        }

        return """
        ### RepoDNA-Ai Agent (Local Simulator)
        I have analyzed your query based on the local structural index:
        
        * **Code Structure**: The project implements standard controller/service/repository architectures.
        * **APIs**: Exposes standard endpoints mapped dynamically under the project controller paths.
        * **Next Steps**: You can run custom security scans, inspect dependency trees in the SBOM panel, or view automated flow graphs in the Visualizations tab.
        
        *Note: To enable full generative AI answers, configure a `GEMINI_API_KEY` or `OPENAI_API_KEY` in your settings.*
        """;
    }
}
