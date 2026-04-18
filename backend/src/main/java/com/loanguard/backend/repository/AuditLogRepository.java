package com.loanguard.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loanguard.backend.model.AuditLog;
import com.loanguard.backend.model.LoanApplication;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long>{
    // Get all audit logs for a specific application
    // Used to show history of actions taken on an application
    List<AuditLog> findByApplicationOrderByPerformedAtDesc(LoanApplication application);
}
