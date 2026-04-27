package com.loanguard.backend.dto;

import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;

// LoanApplicationRequest now has validation rules on every field
// @NotBlank → field cannot be empty or just spaces
// @NotNull  → field cannot be null/missing
// @Min      → minimum allowed value
// @Max      → maximum allowed value
// @DecimalMin → minimum for decimal numbers
@Data
public class LoanApplicationRequest {

    // Name cannot be empty and must be between 2 and 100 characters
    @NotBlank(message = "Applicant name is required")
    @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
    private String applicantName;

    // ✅ NEW FIELD - added for email notification feature
    // @Email checks format like "someone@domain.com"
    // @NotBlank means the field cannot be empty
    @NotBlank(message = "Email address is required")
    @Email(message = "Please enter a valid email address")
    private String applicantEmail;

    // Age must be between 21 and 65
    // Below 21 or above 65 is outside eligible range
    @NotNull(message = "Age is required")
    @Min(value = 21, message = "Minimum age is 21 years")
    @Max(value = 65, message = "Maximum age is 65 years")
    private Integer age;

    // Gender is optional but if provided must be valid value
    private String gender;

    // Annual income must be at least 100000 (1 lakh)
    // Cannot be negative or zero
    @NotNull(message = "Annual income is required")
    @DecimalMin(value = "100000", message = "Minimum annual income is ₹1,00,000")
    private BigDecimal annualIncome;

    // Loan amount must be at least 10000 (10 thousand)
    // Cannot be negative or zero
    @NotNull(message = "Loan amount is required")
    @DecimalMin(value = "10000", message = "Minimum loan amount is ₹10,000")
    @DecimalMax(value = "50000000", message = "Maximum loan amount is ₹5,00,00,000")
    private BigDecimal loanAmount;

    // Tenure must be between 6 months and 360 months (30 years)
    @NotNull(message = "Loan tenure is required")
    @Min(value = 6, message = "Minimum tenure is 6 months")
    @Max(value = 360, message = "Maximum tenure is 360 months (30 years)")
    private Integer loanTenureMonths;

    // Credit score range is 300 to 900
    // This is the standard CIBIL score range in India
    @NotNull(message = "Credit score is required")
    @Min(value = 300, message = "Minimum credit score is 300")
    @Max(value = 900, message = "Maximum credit score is 900")
    private Integer creditScore;

    // Existing debt cannot be negative
    // Zero is allowed (no existing debt)
    @DecimalMin(value = "0", message = "Existing debt cannot be negative")
    private BigDecimal existingDebt;

    // Employment type is required
    @NotBlank(message = "Employment type is required")
    private String employmentType;

    // Loan purpose is required
    @NotBlank(message = "Loan purpose is required")
    private String loanPurpose;
}