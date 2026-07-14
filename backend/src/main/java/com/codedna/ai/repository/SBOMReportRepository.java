package com.codedna.ai.repository;

import com.codedna.ai.model.Project;
import com.codedna.ai.model.SBOMReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SBOMReportRepository extends JpaRepository<SBOMReport, Long> {
    Optional<SBOMReport> findByProject(Project project);
}
