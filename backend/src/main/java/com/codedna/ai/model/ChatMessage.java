package com.codedna.ai.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages")
public class ChatMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String sender; // USER or AI

    @Lob
    @Column(name = "message_text", columnDefinition = "LONGTEXT", nullable = false)
    private String messageText;

    @Lob
    @Column(name = "relevant_files", columnDefinition = "LONGTEXT")
    private String relevantFiles; // JSON array of file paths references

    @Column(name = "timestamp")
    private LocalDateTime timestamp;

    public ChatMessage() {}

    public ChatMessage(Long id, Project project, User user, String sender, String messageText, String relevantFiles) {
        this.id = id;
        this.project = project;
        this.user = user;
        this.sender = sender;
        this.messageText = messageText;
        this.relevantFiles = relevantFiles;
        this.timestamp = LocalDateTime.now();
    }

    public static ChatMessageBuilder builder() {
        return new ChatMessageBuilder();
    }

    @PrePersist
    protected void onCreate() {
        timestamp = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Project getProject() { return project; }
    public void setProject(Project project) { this.project = project; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getRelevantFiles() { return relevantFiles; }
    public void setRelevantFiles(String relevantFiles) { this.relevantFiles = relevantFiles; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    // Builder
    public static class ChatMessageBuilder {
        private Long id;
        private Project project;
        private User user;
        private String sender;
        private String messageText;
        private String relevantFiles;

        public ChatMessageBuilder id(Long id) { this.id = id; return this; }
        public ChatMessageBuilder project(Project project) { this.project = project; return this; }
        public ChatMessageBuilder user(User user) { this.user = user; return this; }
        public ChatMessageBuilder sender(String sender) { this.sender = sender; return this; }
        public ChatMessageBuilder messageText(String messageText) { this.messageText = messageText; return this; }
        public ChatMessageBuilder relevantFiles(String relevantFiles) { this.relevantFiles = relevantFiles; return this; }

        public ChatMessage build() {
            return new ChatMessage(id, project, user, sender, messageText, relevantFiles);
        }
    }
}
