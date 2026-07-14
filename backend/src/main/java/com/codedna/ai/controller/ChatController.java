package com.codedna.ai.controller;

import com.codedna.ai.model.ChatMessage;
import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import com.codedna.ai.model.User;
import com.codedna.ai.repository.ChatMessageRepository;
import com.codedna.ai.repository.ProjectFileRepository;
import com.codedna.ai.repository.ProjectRepository;
import com.codedna.ai.repository.UserRepository;
import com.codedna.ai.service.AIService;
import com.codedna.ai.service.VectorStoreService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ChatController.class);

    private final ProjectRepository projectRepository;
    private final ProjectFileRepository projectFileRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository;
    private final VectorStoreService vectorStoreService;
    private final AIService aiService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ChatController(
            ProjectRepository projectRepository,
            ProjectFileRepository projectFileRepository,
            ChatMessageRepository chatMessageRepository,
            UserRepository userRepository,
            VectorStoreService vectorStoreService,
            AIService aiService
    ) {
        this.projectRepository = projectRepository;
        this.projectFileRepository = projectFileRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.userRepository = userRepository;
        this.vectorStoreService = vectorStoreService;
        this.aiService = aiService;
    }

    public static class ChatRequest {
        private String message;

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }

    public static class ChatResponse {
        private String response;
        private List<String> relevantFiles;

        public ChatResponse(String response, List<String> relevantFiles) {
            this.response = response;
            this.relevantFiles = relevantFiles;
        }

        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }

        public List<String> getRelevantFiles() { return relevantFiles; }
        public void setRelevantFiles(List<String> relevantFiles) { this.relevantFiles = relevantFiles; }
    }

    @GetMapping("/{projectId}/history")
    public ResponseEntity<List<ChatMessage>> getChatHistory(@PathVariable Long projectId, Principal principal) {
        Project project = projectRepository.findById(projectId).orElse(null);
        if (project == null) return ResponseEntity.notFound().build();
        User user = userRepository.findByUsername(principal.getName()).orElse(null);
        if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
        return ResponseEntity.ok(chatMessageRepository.findByProjectOrderByTimestampAsc(project));
    }

    @PostMapping("/{projectId}")
    public ResponseEntity<?> askQuestion(
            @PathVariable Long projectId, 
            @RequestBody ChatRequest request, 
            @RequestHeader(value = "X-Gemini-Key", required = false) String geminiKey,
            @RequestHeader(value = "X-OpenAI-Key", required = false) String openaiKey,
            Principal principal
    ) {
        try {
            Project project = projectRepository.findById(projectId).orElse(null);
            if (project == null) return ResponseEntity.notFound().build();
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            if (user == null || !com.codedna.ai.util.SecurityUtils.isAuthorized(project, user)) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }

            List<ProjectFile> allFiles = projectFileRepository.findByProject(project);
            
            // 1. RAG - Find top 3 relevant files
            List<ProjectFile> relevantFiles = vectorStoreService.queryRelevantFiles(projectId, request.getMessage(), allFiles, 3);
            List<String> relevantPaths = relevantFiles.stream().map(ProjectFile::getFilePath).collect(Collectors.toList());

            // 2. Build AI context prompt
            StringBuilder context = new StringBuilder();
            context.append("You are analyzing the project named: ").append(project.getName()).append("\n");
            context.append("Below are the most relevant files containing source code matching the query:\n\n");

            for (ProjectFile file : relevantFiles) {
                context.append("--- FILE PATH: ").append(file.getFilePath()).append(" ---\n");
                // Limit characters per file to avoid context window blowup in simulated calls
                String snippet = file.getContent();
                if (snippet == null) {
                    snippet = "[No source code contents available]";
                }
                if (snippet.length() > 2000) {
                    snippet = snippet.substring(0, 2000) + "\n... [truncated for token budget] ...";
                }
                context.append(snippet).append("\n\n");
            }

            String systemPrompt = String.format("""
                    You are a senior AI software assistant inside the CodeDNA Platform.
                    Your task is to help developers understand this codebase.
                    Answer the user's question precisely using the provided codebase context files.
                    Mention specific files and lines where appropriate.
                    If the codebase doesn't provide enough information, say so.
                    
                    IMPORTANT: Provide a detailed, structured, and thorough explanation of the codebase. Break down technical details into clear sections (e.g. Functional Overview, Key Metrics, Security Check, and Recommendations) so it is comprehensive yet easy to understand.
                    
                    Code Context:
                    %s
                    """, context.toString());

            // 3. Save User message
            ChatMessage userMsg = ChatMessage.builder()
                    .project(project)
                    .user(user)
                    .sender("USER")
                    .messageText(request.getMessage())
                    .build();
            chatMessageRepository.save(userMsg);

            // 4. Generate AI response
            String aiReply = aiService.generateResponse(systemPrompt, request.getMessage(), geminiKey, openaiKey);

            // 5. Save AI message
            String pathsJson = "[]";
            try {
                pathsJson = objectMapper.writeValueAsString(relevantPaths);
            } catch (Exception e2) {
                log.error("Failed serialization of relevant files: {}", e2.getMessage());
            }

            ChatMessage aiMsg = ChatMessage.builder()
                    .project(project)
                    .user(user)
                    .sender("AI")
                    .messageText(aiReply)
                    .relevantFiles(pathsJson)
                    .build();
            chatMessageRepository.save(aiMsg);

            return ResponseEntity.ok(new ChatResponse(aiReply, relevantPaths));
        } catch (Exception e) {
            log.error("ChatController askQuestion error: ", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(java.util.Map.of("response", "Error: " + e.getMessage() + ". Check your backend console logs for the full stack trace."));
        }
    }
}
