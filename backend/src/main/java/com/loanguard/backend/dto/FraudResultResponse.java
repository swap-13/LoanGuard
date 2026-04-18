package com.loanguard.backend.dto;

import java.math.BigDecimal;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// This DTO is what we send BACK to frontend after fraud analysis
// Contains risk score, decision, and reasons why it was flagged
@Data
@AllArgsConstructor
@NoArgsConstructor
public class FraudResultResponse {
    private Long applicationId;
    private String applicantName;
    private BigDecimal riskScore;      // e.g. 78.5
    private String riskLevel;          // LOW / MEDIUM / HIGH / CRITICAL
    private String decision;           // AUTO_APPROVED / MANUAL_REVIEW / AUTO_REJECTED
    private List<String> reasons;      // ["Low income", "High loan amount"]
    private String submittedAt;
}
