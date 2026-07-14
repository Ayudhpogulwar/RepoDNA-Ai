package com.codedna.ai.repository;

import com.codedna.ai.model.ChatMessage;
import com.codedna.ai.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    List<ChatMessage> findByProjectOrderByTimestampAsc(Project project);
}
