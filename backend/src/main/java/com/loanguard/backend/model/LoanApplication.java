package com.loanguard.backend.model;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "loan_applications")
public class LoanApplication {
    
    //all the fields here are created according to data types 
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "applicant_name", nullable = false)
    private String applicantName;

    @Column(nullable = false)
    private Integer age;

    private String gender;

    @Column(name = "annual_income", nullable = false)
    private BigDecimal annualIncome;

    @Column(name = "loan_amount", nullable = false)
    private BigDecimal loanAmount;

    @Column(name = "loan_tenure_months", nullable = false)
    private Integer loanTenureMonths;

    @Column(name = "credit_score", nullable = false)
    private Integer creditScore;

    @Column(name = "existing_debt")
    private BigDecimal existingDebt = BigDecimal.ZERO;

    @Column(name = "employment_type")
    private String employmentType;

    @Column(name = "loan_purpose")
    private String loanPurpose;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt = LocalDateTime.now();
}
