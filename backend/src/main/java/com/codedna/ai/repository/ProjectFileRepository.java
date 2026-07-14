package com.codedna.ai.repository;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByProject(Project project);
    Optional<ProjectFile> findByProjectAndFilePath(Project project, String filePath);
    List<ProjectFile> findByProjectAndLanguage(Project project, String language);
}
