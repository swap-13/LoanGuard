package com.loanguard.backend.repository;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loanguard.backend.model.LoanApplication;

@Repository
public interface LoanApplicationRepository extends JpaRepository<LoanApplication, Long>{

    // Get all applications sorted by latest first
    List<LoanApplication> findAllByOrderBySubmittedAtDesc();
}
