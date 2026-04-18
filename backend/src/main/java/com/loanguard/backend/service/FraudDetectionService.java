package com.loanguard.backend.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import com.loanguard.backend.dto.FraudResultResponse;
import com.loanguard.backend.dto.LoanApplicationRequest;
import com.loanguard.backend.model.AuditLog;
import com.loanguard.backend.model.FraudAnalysis;
import com.loanguard.backend.model.LoanApplication;
import com.loanguard.backend.repository.AuditLogRepository;
import com.loanguard.backend.repository.FraudAnalysisRepository;
import com.loanguard.backend.repository.LoanApplicationRepository;

@Service
public class FraudDetectionService {
    @Autowired
    private LoanApplicationRepository loanApplicationRepository;

    @Autowired
    private FraudAnalysisRepository fraudAnalysisRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${ml.service.url}")
    private String mlServiceUrl;

    // ================================================================
    // MAIN METHOD - Called when new loan application is submitted
    // This orchestrates the entire fraud detection workflow
    // ================================================================
    public FraudResultResponse analyzeApplication(LoanApplicationRequest request) {

        // STEP 1: Save the application to database first
        LoanApplication application = saveApplication(request);

        // STEP 2: Run Rule Engine - catches obvious fraud instantly
        List<String> ruleViolations = runRuleEngine(request);

        BigDecimal riskScore;
        List<String> reasons = new ArrayList<>(ruleViolations);

        // STEP 3: If rule engine catches critical violations,
        // no need to call ML - instant high risk
        if (ruleViolations.size() >= 3) {
            riskScore = BigDecimal.valueOf(95.0);
            reasons.add("Multiple rule violations detected");
        } else {
            // STEP 4: Call Python ML model for risk score
            BigDecimal mlScore = callMlService(request);

            // Combine rule violations weight with ML score
            // Each rule violation adds 10% to the ML score
            double boost = ruleViolations.size() * 10.0;
            riskScore = mlScore.add(BigDecimal.valueOf(boost))
                    .min(BigDecimal.valueOf(100.0))
                    .setScale(2, RoundingMode.HALF_UP);
        }

        // STEP 5: Determine risk level from score
        String riskLevel = getRiskLevel(riskScore);

        // STEP 6: Make final decision based on risk level
        String decision = getDecision(riskLevel);

        // STEP 7: Add explainability reasons based on score
        reasons.addAll(getExplainabilityReasons(request, riskScore));

        // STEP 8: Save fraud analysis result to database
        FraudAnalysis analysis = new FraudAnalysis();
        analysis.setApplication(application);
        analysis.setRiskScore(riskScore);
        analysis.setRiskLevel(riskLevel);
        analysis.setDecision(decision);
        analysis.setReasons(String.join("|", reasons));
        fraudAnalysisRepository.save(analysis);

        // STEP 9: Save to audit log
        saveAuditLog(application, "APPLICATION_ANALYZED", "SYSTEM",
                "Risk Score: " + riskScore + "% - Decision: " + decision);

        // STEP 10: Return result to controller
        return new FraudResultResponse(
                application.getId(),
                application.getApplicantName(),
                riskScore,
                riskLevel,
                decision,
                reasons,
                application.getSubmittedAt().format(
                        DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm"))
        );
    }

    // ================================================================
    // RULE ENGINE - Pure Java logic, no ML needed
    // Catches obvious fraud before even calling the ML model
    // ================================================================
    private List<String> runRuleEngine(LoanApplicationRequest req) {
        List<String> violations = new ArrayList<>();

        // Rule 1: Age check
        if (req.getAge() < 21 || req.getAge() > 65) {
            violations.add("Applicant age is outside eligible range (21-65)");
        }

        // Rule 2: Loan to income ratio check
        // If loan amount is more than 10x annual income - suspicious
        if (req.getLoanAmount() != null && req.getAnnualIncome() != null) {
            BigDecimal ratio = req.getLoanAmount()
                    .divide(req.getAnnualIncome(), 2, RoundingMode.HALF_UP);
            if (ratio.compareTo(BigDecimal.valueOf(10)) > 0) {
                violations.add("Loan amount exceeds 10x annual income");
            }
        }

        // Rule 3: Credit score check
        if (req.getCreditScore() < 500) {
            violations.add("Credit score is critically low (below 500)");
        }

        // Rule 4: Existing debt check
        // If existing debt is more than 60% of annual income
        if (req.getExistingDebt() != null && req.getAnnualIncome() != null) {
            BigDecimal debtRatio = req.getExistingDebt()
                    .divide(req.getAnnualIncome(), 2, RoundingMode.HALF_UP);
            if (debtRatio.compareTo(BigDecimal.valueOf(0.6)) > 0) {
                violations.add("Existing debt exceeds 60% of annual income");
            }
        }

        // Rule 5: Minimum income check
        if (req.getAnnualIncome() != null &&
                req.getAnnualIncome().compareTo(BigDecimal.valueOf(100000)) < 0) {
            violations.add("Annual income is below minimum threshold");
        }

        return violations;
    }

    // ================================================================
    // ML SERVICE CALL - Sends data to Python Flask and gets risk score
    // ================================================================
    @SuppressWarnings("unchecked")
    private BigDecimal callMlService(LoanApplicationRequest req) {
        try {
            // Build the request payload to send to Python
            Map<String, Object> payload = new HashMap<>();
            payload.put("age", req.getAge());
            payload.put("annual_income", req.getAnnualIncome());
            payload.put("loan_amount", req.getLoanAmount());
            payload.put("loan_tenure_months", req.getLoanTenureMonths());
            payload.put("credit_score", req.getCreditScore());
            payload.put("existing_debt", req.getExistingDebt());
            payload.put("employment_type", req.getEmploymentType());
            payload.put("loan_purpose", req.getLoanPurpose());

            // Call Python Flask API
            Map<String, Object> response = restTemplate.postForObject(
                    mlServiceUrl + "/predict",
                    payload,
                    Map.class
            );

            if (response != null && response.containsKey("risk_score")) {
                double score = ((Number) response.get("risk_score")).doubleValue();
                return BigDecimal.valueOf(score).setScale(2, RoundingMode.HALF_UP);
            }
        } catch (Exception e) {
            // If Python service is down, use rule-based scoring only
            System.out.println("ML service unavailable: " + e.getMessage());
        }

        // Fallback score if ML service fails
        return BigDecimal.valueOf(50.0);
    }

    // ================================================================
    // RISK LEVEL - Converts numeric score to category
    // ================================================================
    private String getRiskLevel(BigDecimal score) {
        double s = score.doubleValue();
        if (s <= 30) return "LOW";
        else if (s <= 60) return "MEDIUM";
        else if (s <= 80) return "HIGH";
        else return "CRITICAL";
    }

    // ================================================================
    // DECISION - Makes final decision based on risk level
    // ================================================================
    private String getDecision(String riskLevel) {
        return switch (riskLevel) {
            case "LOW" -> "AUTO_APPROVED";
            case "MEDIUM" -> "MANUAL_REVIEW";
            case "HIGH" -> "MANUAL_REVIEW";
            case "CRITICAL" -> "AUTO_REJECTED";
            default -> "MANUAL_REVIEW";
        };
    }

    // ================================================================
    // EXPLAINABILITY - Generates human-readable reasons
    // This is what makes the project industry-level
    // ================================================================
    private List<String> getExplainabilityReasons(
            LoanApplicationRequest req, BigDecimal riskScore) {
        List<String> reasons = new ArrayList<>();
        double score = riskScore.doubleValue();

        if (req.getCreditScore() < 650) {
            reasons.add("Low credit score (" + req.getCreditScore() + ") increases risk");
        }
        if (req.getCreditScore() >= 750) {
            reasons.add("Good credit score (" + req.getCreditScore() + ") reduces risk");
        }
        if (req.getAnnualIncome() != null && req.getLoanAmount() != null) {
            BigDecimal ratio = req.getLoanAmount()
                    .divide(req.getAnnualIncome(), 2, RoundingMode.HALF_UP);
            if (ratio.compareTo(BigDecimal.valueOf(5)) > 0) {
                reasons.add("High loan-to-income ratio of " + ratio + "x");
            }
        }
        if ("UNEMPLOYED".equalsIgnoreCase(req.getEmploymentType())) {
            reasons.add("Applicant is currently unemployed");
        }
        if (score <= 30) {
            reasons.add("Strong financial profile detected");
        }

        return reasons;
    }

    // ================================================================
    // ADMIN OVERRIDE - Admin manually changes a decision
    // ================================================================
    public String overrideDecision(Long applicationId,
            String newDecision, String adminEmail, String reason) {

        // Find the application
        LoanApplication application = loanApplicationRepository
                .findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        // Find its fraud analysis
        FraudAnalysis analysis = fraudAnalysisRepository
                .findByApplication(application)
                .orElseThrow(() -> new RuntimeException("Analysis not found"));

        // Update the decision
        String oldDecision = analysis.getDecision();
        analysis.setDecision(newDecision);
        fraudAnalysisRepository.save(analysis);

        // Record in audit log - very important for compliance
        saveAuditLog(application, "ADMIN_OVERRIDE", adminEmail,
                "Changed from " + oldDecision + " to "
                        + newDecision + ". Reason: " + reason);

        return "Decision updated successfully";
    }

    // ================================================================
    // DASHBOARD STATS - Numbers for the admin dashboard
    // ================================================================
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new HashMap<>();

        
        long total = loanApplicationRepository.count();
        long approved = fraudAnalysisRepository.countByDecision("AUTO_APPROVED");
        long rejected = fraudAnalysisRepository.countByDecision("AUTO_REJECTED");
        long review = fraudAnalysisRepository.countByDecision("MANUAL_REVIEW");
        long lowRisk = fraudAnalysisRepository.countByRiskLevelIgnoreCase("LOW");
        long mediumRisk = fraudAnalysisRepository.countByRiskLevelIgnoreCase("MEDIUM");
        long highRisk = fraudAnalysisRepository.countByRiskLevelIgnoreCase("HIGH");
        long critical = fraudAnalysisRepository.countByRiskLevelIgnoreCase("CRITICAL");

        stats.put("totalApplications", total);
        stats.put("autoApproved", approved);
        stats.put("autoRejected", rejected);
        stats.put("manualReview", review);
        stats.put("lowRisk", lowRisk);
        stats.put("mediumRisk", mediumRisk);
        stats.put("highRisk", highRisk);
        stats.put("criticalRisk", critical);
        stats.put("fraudPercentage",
                 total > 0 ? Math.round((rejected * 100.0) / total) : 0);
        stats.put("approvalRate",
                 total > 0 ? Math.round((approved * 100.0) / total) : 0);

        return stats;
    }

    // ================================================================
    // HELPER - Save application to database
    // ================================================================
    private LoanApplication saveApplication(LoanApplicationRequest req) {
        LoanApplication app = new LoanApplication();
        app.setApplicantName(req.getApplicantName());
        app.setAge(req.getAge());
        app.setGender(req.getGender());
        app.setAnnualIncome(req.getAnnualIncome());
        app.setLoanAmount(req.getLoanAmount());
        app.setLoanTenureMonths(req.getLoanTenureMonths());
        app.setCreditScore(req.getCreditScore());
        app.setExistingDebt(req.getExistingDebt());
        app.setEmploymentType(req.getEmploymentType());
        app.setLoanPurpose(req.getLoanPurpose());
        return loanApplicationRepository.save(app);
    }

    // ================================================================
    // HELPER - Save to audit log
    // ================================================================
    private void saveAuditLog(LoanApplication application,
            String action, String performedBy, String reason) {
        AuditLog log = new AuditLog();
        log.setApplication(application);
        log.setAction(action);
        log.setPerformedBy(performedBy);
        log.setReason(reason);
        auditLogRepository.save(log);
    }

    // Get all applications with their analysis for admin table
    public List<Map<String, Object>> getAllApplications() {
        List<LoanApplication> applications =
                loanApplicationRepository.findAllByOrderBySubmittedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();

        for (LoanApplication app : applications) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", app.getId());
            item.put("applicantName", app.getApplicantName());
            item.put("loanAmount", app.getLoanAmount());
            item.put("annualIncome", app.getAnnualIncome());
            item.put("submittedAt", app.getSubmittedAt()
                    .format(DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm")));

            // Get fraud analysis for this application
            fraudAnalysisRepository.findByApplication(app).ifPresent(analysis -> {
                item.put("riskScore", analysis.getRiskScore());
                item.put("riskLevel", analysis.getRiskLevel());
                item.put("decision", analysis.getDecision());
                item.put("reasons",
                        List.of(analysis.getReasons().split("\\|")));
            });

            result.add(item);
        }
        return result;
    }


    // ================================================================
// DELETE APPLICATION
// Must delete in correct order due to foreign key constraints:
// First audit_log → then fraud_analysis → then loan_application
// Why this order: audit_log and fraud_analysis reference loan_applications
// If we delete loan_application first, foreign key error occurs
// ================================================================
public String deleteApplication(Long applicationId) {
    LoanApplication application = loanApplicationRepository
            .findById(applicationId)
            .orElseThrow(() -> 
                new RuntimeException("Application not found"));

    // Step 1: Delete audit logs for this application first
    List<AuditLog> auditLogs = auditLogRepository
            .findByApplicationOrderByPerformedAtDesc(application);
    auditLogRepository.deleteAll(auditLogs);

    // Step 2: Delete fraud analysis for this application
    fraudAnalysisRepository.findByApplication(application)
            .ifPresent(fraudAnalysisRepository::delete);

    // Step 3: Now safe to delete the main application
    loanApplicationRepository.delete(application);

    return "Application deleted successfully";
}

// ================================================================
// RE-ANALYZE APPLICATION
// Updates application fields with new values
// Then runs the complete fraud detection again
// Saves new risk score and decision
// Records in audit log that re-analysis was done
// ================================================================
public FraudResultResponse reAnalyzeApplication(
        Long applicationId,
        LoanApplicationRequest request,
        String adminEmail) {

    // Find existing application
    LoanApplication application = loanApplicationRepository
            .findById(applicationId)
            .orElseThrow(() -> 
                new RuntimeException("Application not found"));

    // Update all fields with new values
    application.setApplicantName(request.getApplicantName());
    application.setAge(request.getAge());
    application.setGender(request.getGender());
    application.setAnnualIncome(request.getAnnualIncome());
    application.setLoanAmount(request.getLoanAmount());
    application.setLoanTenureMonths(request.getLoanTenureMonths());
    application.setCreditScore(request.getCreditScore());
    application.setExistingDebt(request.getExistingDebt());
    application.setEmploymentType(request.getEmploymentType());
    application.setLoanPurpose(request.getLoanPurpose());
    loanApplicationRepository.save(application);

    // Delete old fraud analysis so we can create fresh one
    fraudAnalysisRepository.findByApplication(application)
            .ifPresent(fraudAnalysisRepository::delete);

    // Run rule engine again with new values
    List<String> ruleViolations = runRuleEngine(request);
    List<String> reasons = new ArrayList<>(ruleViolations);

    BigDecimal riskScore;
    if (ruleViolations.size() >= 3) {
        riskScore = BigDecimal.valueOf(95.0);
        reasons.add("Multiple rule violations detected");
    } else {
        BigDecimal mlScore = callMlService(request);
        double boost = ruleViolations.size() * 10.0;
        riskScore = mlScore.add(BigDecimal.valueOf(boost))
                .min(BigDecimal.valueOf(100.0))
                .setScale(2, RoundingMode.HALF_UP);
    }

    String riskLevel = getRiskLevel(riskScore);
    String decision = getDecision(riskLevel);
    reasons.addAll(getExplainabilityReasons(request, riskScore));

    // Save new fraud analysis
    FraudAnalysis analysis = new FraudAnalysis();
    analysis.setApplication(application);
    analysis.setRiskScore(riskScore);
    analysis.setRiskLevel(riskLevel);
    analysis.setDecision(decision);
    analysis.setReasons(String.join("|", reasons));
    fraudAnalysisRepository.save(analysis);

    // Record in audit log that admin edited and re-analyzed
    saveAuditLog(application, "ADMIN_EDIT_REANALYZED",
            adminEmail,
            "Application edited and re-analyzed. " +
            "New Risk Score: " + riskScore + "%" +
            " Decision: " + decision);

    return new FraudResultResponse(
            application.getId(),
            application.getApplicantName(),
            riskScore,
            riskLevel,
            decision,
            reasons,
            application.getSubmittedAt()
                    .format(DateTimeFormatter
                            .ofPattern("dd-MM-yyyy HH:mm"))
    );

   }
}
