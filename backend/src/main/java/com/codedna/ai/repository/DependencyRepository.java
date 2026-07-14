package com.codedna.ai.repository;

import com.codedna.ai.model.Dependency;
import com.codedna.ai.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DependencyRepository extends JpaRepository<Dependency, Long> {
    List<Dependency> findByProject(Project project);
}
