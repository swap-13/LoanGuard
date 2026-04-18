package com.loanguard.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loanguard.backend.model.FraudAnalysis;
import com.loanguard.backend.model.LoanApplication;

@Repository
public interface FraudAnalysisRepository extends JpaRepository<FraudAnalysis, Long> {
    // Find fraud analysis result for a specific application
    Optional<FraudAnalysis> findByApplication(LoanApplication application);

    // Count how many applications have a specific decision
    // Used in dashboard stats (how many approved, rejected, flagged)
    long countByDecision(String decision);

    // Count high risk applications (risk score above a value)
    long countByRiskLevelIgnoreCase(String riskLevel);
}
