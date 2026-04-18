package com.loanguard.backend.model;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "fraud_analysis")
public class FraudAnalysis {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne     //here we are joining loan table with fraud to match the application id and do fraud analysis easily 
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @Column(name = "risk_score", nullable = false)
    private BigDecimal riskScore;

    @Column(name = "risk_level", nullable = false)
    private String riskLevel;

    @Column(nullable = false)
    private String decision;

    @Column(columnDefinition = "TEXT")
    private String reasons;

    @Column(name = "analyzed_at")
    private LocalDateTime analyzedAt = LocalDateTime.now();
}
