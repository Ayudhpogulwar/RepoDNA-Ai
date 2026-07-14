package com.codedna.ai.repository;

import com.codedna.ai.model.AnalysisRun;
import com.codedna.ai.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AnalysisRunRepository extends JpaRepository<AnalysisRun, Long> {
    List<AnalysisRun> findByProjectOrderByRunDateAsc(Project project);
}
