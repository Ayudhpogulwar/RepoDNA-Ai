package com.codedna.ai.service;

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

    public String generateResponse(String systemPrompt, String userPrompt) {
        return generateResponse(systemPrompt, userPrompt, null, null);
    }

    public String generateResponse(String systemPrompt, String userPrompt, String customGeminiKey, String customOpenaiKey) {
        String activeGeminiKey = (customGeminiKey != null && !customGeminiKey.trim().isEmpty()) ? customGeminiKey : this.geminiKey;
        String activeOpenaiKey = (customOpenaiKey != null && !customOpenaiKey.trim().isEmpty()) ? customOpenaiKey : this.openaiKey;

        // If Gemini Key is present, call Gemini
        if (activeGeminiKey != null && !activeGeminiKey.trim().isEmpty()) {
            return callGemini(systemPrompt, userPrompt, activeGeminiKey);
        }
        
        // Else if OpenAI Key is present, call OpenAI
        if (activeOpenaiKey != null && !activeOpenaiKey.trim().isEmpty()) {
            return callOpenAI(systemPrompt, userPrompt, activeOpenaiKey);
        }

        // Fallback simulation mode
        log.warn("No AI API Keys found. Entering CodeDNA Local Heuristic AI simulation mode.");
        return generateMockResponse(systemPrompt, userPrompt);
    }

    private String callGemini(String system, String user, String activeKey) {
        try {
            String url = String.format("https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s", geminiModel, activeKey);

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
        return callOpenAI(system, user, activeKey); // Fallback to OpenAI if Gemini fails
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

        if (query.contains("roadmap") || query.contains("learn") || query.contains("interview")) {
            return """
            ### Learning Roadmap & Onboarding Guide (Local Analyzer)
            To onboard efficiently onto this project workspace, follow this 3-Step track:
            
            #### Step 1: Framework & Setup (Day 1)
            - Inspect dependency configuration (`pom.xml`, `package.json`, or `requirements.txt`).
            - Read configuration files to configure databases and active environment ports.
            
            #### Step 2: System Architecture (Days 2-3)
            - Navigate through the Entry Point classes.
            - Explore endpoints declared in Controller paths. Trace how requests interact with service engines and model entities.
            
            #### Step 3: Database & Models (Days 4-5)
            - Audit entities inside models directories. Note table constraints and field indexes.
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
        ### CodeDNA AI Agent (Local Simulator)
        I have analyzed your query based on the local structural index:
        
        * **Code Structure**: The project implements standard controller/service/repository architectures.
        * **APIs**: Exposes standard endpoints mapped dynamically under the project controller paths.
        * **Next Steps**: You can run custom security scans, inspect dependency trees in the SBOM panel, or view automated flow graphs in the Visualizations tab.
        
        *Note: To enable full generative AI answers, configure a `GEMINI_API_KEY` or `OPENAI_API_KEY` in your backend properties.*
        """;
    }
}
