package com.loanguard.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*The admin dashboard shows cards like "Total Applications: 245", "Fraud Rate: 23%", "Approved: 60%". This DTO packages 
all those numbers in one response so 
React gets everything in a single API call. */
// This DTO carries all numbers shown on the admin dashboard
// Total applications, how many approved, rejected, flagged etc.
@Data
@AllArgsConstructor
@NoArgsConstructor
public class DashboardStats {
     private long totalApplications;
    private long autoApproved;
    private long manualReview;
    private long autoRejected;
    private long lowRisk;
    private long mediumRisk;
    private long highRisk;
    private long criticalRisk;
    private double fraudPercentage;
    private double approvalRate;
}
