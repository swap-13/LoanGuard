package com.loanguard.backend.repository;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.loanguard.backend.model.Admin;

@Repository
public interface AdminRepository extends JpaRepository<Admin, Long> {

    // Spring Boot auto-generates SQL for this method just by the name
    // SELECT * FROM admins WHERE email = ?
    Optional<Admin> findByEmail(String email);
}
