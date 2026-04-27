package com.loanguard.backend.service;

// ====================================================================
// FILE: backend/src/main/java/com/loanguard/backend/service/EmailService.java
// REPLACE your current EmailService.java with this entire file
//
// WHAT'S DIFFERENT FROM BEFORE:
// Added detailed System.out.println at every step so when you run
// Spring Boot you will see EXACTLY where it fails in the console.
// This will tell us which of the 3 reasons is causing the problem.
// ====================================================================

import java.math.BigDecimal;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String fromEmail;

    // ================================================================
    // This method runs automatically when Spring Boot starts.
    // It will print your email config to the console so you can
    // verify the environment variables are being read correctly.
    // ================================================================
    @jakarta.annotation.PostConstruct
    public void checkConfig() {
        System.out.println("====================================");
        System.out.println("EmailService loaded successfully");
        System.out.println("FROM email configured as: " + fromEmail);
        if (fromEmail == null || fromEmail.isBlank() || fromEmail.contains("LOANGUARD")) {
            System.out.println("❌ WARNING: Email not configured properly!");
            System.out.println("   The environment variable LOANGUARD_MAIL_USERNAME is not being read.");
            System.out.println("   See fix instructions below.");
        } else {
            System.out.println("✅ Email config looks correct.");
        }
        System.out.println("====================================");
    }

    public void sendResultEmail(
            String toEmail,
            String applicantName,
            Long applicationId,
            BigDecimal riskScore,
            String riskLevel,
            String decision,
            List<String> reasons,
            String submittedAt) {

        // Step 1 log - did we even reach this method?
        System.out.println("====================================");
        System.out.println("📧 sendResultEmail() called");
        System.out.println("   To: " + toEmail);
        System.out.println("   From: " + fromEmail);
        System.out.println("   Application ID: " + applicationId);

        // Step 2 - validate inputs before trying to send
        if (toEmail == null || toEmail.isBlank()) {
            System.out.println("❌ Email sending skipped: toEmail is empty");
            System.out.println("====================================");
            return;
        }
        if (fromEmail == null || fromEmail.isBlank() || fromEmail.contains("LOANGUARD")) {
            System.out.println("❌ Email sending skipped: fromEmail env variable not set");
            System.out.println("   Fix: Set LOANGUARD_MAIL_USERNAME in IntelliJ run config");
            System.out.println("====================================");
            return;
        }

        try {
            System.out.println("   Attempting to connect to Gmail SMTP...");

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("LoanGuard — Your Loan Application Result #" + applicationId);

            String htmlBody = buildEmailHtml(
                    applicantName, applicationId, riskScore,
                    riskLevel, decision, reasons, submittedAt);

            helper.setText(htmlBody, true);

            System.out.println("   Email built successfully. Sending now...");
            mailSender.send(message);
            System.out.println("✅ Email sent successfully to: " + toEmail);

        } catch (MessagingException e) {
            System.out.println("❌ MessagingException while sending email:");
            System.out.println("   Error: " + e.getMessage());
            System.out.println("   Cause: " + (e.getCause() != null ? e.getCause().getMessage() : "none"));
            System.out.println("   → Check your app password and Gmail SMTP settings");
        } catch (Exception e) {
            System.out.println("❌ Unexpected error while sending email:");
            System.out.println("   Type: " + e.getClass().getSimpleName());
            System.out.println("   Error: " + e.getMessage());
        }
        System.out.println("====================================");
    }

    private String buildEmailHtml(
            String applicantName,
            Long applicationId,
            BigDecimal riskScore,
            String riskLevel,
            String decision,
            List<String> reasons,
            String submittedAt) {

        String riskColor = getRiskColor(riskLevel);
        String decisionText = getDecisionText(decision);
        String decisionIcon = getDecisionIcon(decision);

        StringBuilder reasonsHtml = new StringBuilder();
        for (String reason : reasons) {
            reasonsHtml.append(
                "<li style='margin-bottom:8px; color:#cbd5e1;'>")
                .append("→ ").append(reason)
                .append("</li>");
        }

        return "<!DOCTYPE html>" +
            "<html><head><meta charset='UTF-8'>" +
            "<meta name='viewport' content='width=device-width, initial-scale=1.0'>" +
            "</head><body style='margin:0; padding:0; background-color:#0f172a; font-family: Arial, sans-serif;'>" +
            "<table width='100%' cellpadding='0' cellspacing='0' style='background-color:#0f172a; padding:40px 20px;'>" +
            "<tr><td align='center'>" +
            "<table width='600' cellpadding='0' cellspacing='0' style='background-color:#1e293b; border-radius:12px; overflow:hidden; border:1px solid #334155;'>" +
            "<tr><td style='background-color:#e94560; padding:24px 32px; text-align:center;'>" +
            "<h1 style='color:#ffffff; margin:0; font-size:24px; font-weight:800;'>🛡️ LoanGuard</h1>" +
            "<p style='color:#fecaca; margin:8px 0 0; font-size:14px;'>AI-Powered Fraud Detection System</p>" +
            "</td></tr>" +
            "<tr><td style='padding:32px 32px 0;'>" +
            "<h2 style='color:#e2e8f0; margin:0 0 8px; font-size:20px;'>Hello, " + applicantName + "</h2>" +
            "<p style='color:#94a3b8; margin:0; font-size:14px;'>Your loan application has been analyzed. Here are your results:</p>" +
            "</td></tr>" +
            "<tr><td style='padding:16px 32px 0;'>" +
            "<p style='color:#64748b; font-size:13px; margin:0;'>Application ID: <strong style='color:#94a3b8;'>#" + applicationId + "</strong>" +
            " &nbsp;|&nbsp; Submitted: <strong style='color:#94a3b8;'>" + submittedAt + "</strong></p>" +
            "</td></tr>" +
            "<tr><td style='padding:24px 32px 0;'>" +
            "<div style='background-color:#0f172a; border:1px solid #334155; border-radius:10px; padding:24px; text-align:center;'>" +
            "<p style='color:#94a3b8; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:0 0 12px;'>FRAUD RISK SCORE</p>" +
            "<div style='font-size:64px; font-weight:800; color:" + riskColor + "; line-height:1; margin-bottom:12px;'>" + riskScore + "%</div>" +
            "<span style='background-color:#1e293b; color:" + riskColor + "; padding:6px 20px; border-radius:20px; font-weight:700; font-size:14px;'>" +
            riskLevel + " RISK</span>" +
            "</div></td></tr>" +
            "<tr><td style='padding:16px 32px 0;'>" +
            "<div style='background-color:#0f172a; border:1px solid #334155; border-radius:10px; padding:20px;'>" +
            "<p style='color:#94a3b8; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:0 0 10px;'>FINAL DECISION</p>" +
            "<p style='color:#e2e8f0; font-size:20px; font-weight:700; margin:0;'>" + decisionIcon + " " + decisionText + "</p>" +
            "</div></td></tr>" +
            "<tr><td style='padding:16px 32px 0;'>" +
            "<div style='background-color:#0f172a; border:1px solid #334155; border-radius:10px; padding:20px;'>" +
            "<p style='color:#94a3b8; font-size:12px; letter-spacing:2px; text-transform:uppercase; margin:0 0 14px;'>🔍 WHY THIS RESULT?</p>" +
            "<ul style='margin:0; padding-left:16px;'>" + reasonsHtml + "</ul>" +
            "</div></td></tr>" +
            "<tr><td style='padding:24px 32px 32px;'>" +
            "<p style='color:#64748b; font-size:13px; margin:0; line-height:1.6;'>" +
            "This is an automated message from the LoanGuard system. " +
            "If you did not submit this application, please ignore this email." +
            "</p></td></tr>" +
            "<tr><td style='background-color:#0f172a; padding:16px 32px; text-align:center; border-top:1px solid #334155;'>" +
            "<p style='color:#475569; font-size:12px; margin:0;'>© 2026 LoanGuard · AI-Powered Fraud Detection</p>" +
            "</td></tr>" +
            "</table>" +
            "</td></tr></table>" +
            "</body></html>";
    }

    private String getRiskColor(String riskLevel) {
        return switch (riskLevel) {
            case "LOW"      -> "#6ee7b7";
            case "MEDIUM"   -> "#fcd34d";
            case "HIGH"     -> "#fb923c";
            case "CRITICAL" -> "#f87171";
            default         -> "#94a3b8";
        };
    }

    private String getDecisionText(String decision) {
        return switch (decision) {
            case "AUTO_APPROVED"  -> "Auto Approved";
            case "MANUAL_REVIEW"  -> "Under Manual Review";
            case "AUTO_REJECTED"  -> "Auto Rejected";
            default               -> decision;
        };
    }

    private String getDecisionIcon(String decision) {
        return switch (decision) {
            case "AUTO_APPROVED"  -> "✅";
            case "MANUAL_REVIEW"  -> "⏳";
            case "AUTO_REJECTED"  -> "❌";
            default               -> "📋";
        };
    }
}