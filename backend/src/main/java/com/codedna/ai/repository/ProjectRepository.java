package com.codedna.ai.repository;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserOrderByCreatedAtDesc(User user);
}
