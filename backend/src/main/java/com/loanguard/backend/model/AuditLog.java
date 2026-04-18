package com.loanguard.backend.model;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "audit_log")
public class AuditLog {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "application_id", nullable = false)
    private LoanApplication application;

    @Column(nullable = false)
    private String action;

    @Column(name = "performed_by")  //very action in the system — submitted, approved, rejected, manually overridden — gets recorded here with who did it and when
    private String performedBy;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(name = "performed_at")
    private LocalDateTime performedAt = LocalDateTime.now();
}
