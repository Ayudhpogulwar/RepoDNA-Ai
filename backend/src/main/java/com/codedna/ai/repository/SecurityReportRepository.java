package com.codedna.ai.repository;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.SecurityReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SecurityReportRepository extends JpaRepository<SecurityReport, Long> {
    Optional<SecurityReport> findByProject(Project project);
}
