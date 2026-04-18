package com.loanguard.backend.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.loanguard.backend.dto.AuthRequest;
import com.loanguard.backend.dto.AuthResponse;
import com.loanguard.backend.model.Admin;
import com.loanguard.backend.repository.AdminRepository;
import com.loanguard.backend.security.JwtService;

// AuthService handles admin authentication
// Now uses BCrypt to verify passwords instead of plain text comparison
@Service
public class AuthService {

    @Autowired
    private AdminRepository adminRepository;

    @Autowired
    private JwtService jwtService;

    // Inject the BCryptPasswordEncoder Bean we created in SecurityConfig
    // Why: We need it here to verify the entered password
    // against the BCrypt hash stored in database
    @Autowired
    private PasswordEncoder passwordEncoder;

    // Called when admin submits login form
    public AuthResponse login(AuthRequest request) {

        // Step 1: Find admin by email in database
        Optional<Admin> adminOpt = adminRepository
                .findByEmail(request.getEmail());

        // Step 2: If email not found → return error
        if (adminOpt.isEmpty()) {
            return new AuthResponse(
                null, null, null, "Invalid email or password"
            );
        }

        Admin admin = adminOpt.get();

        // Step 3: BCrypt verification
        // passwordEncoder.matches() does this internally:
        // Takes entered password "admin123"
        // Takes stored hash "$2a$10$xK8Rq7..."
        // Recalculates hash of entered password
        // Compares both → returns true or false
        // We NEVER store or see the original password again
        boolean passwordMatches = passwordEncoder.matches(
            request.getPassword(),  // what admin typed
            admin.getPassword()     // BCrypt hash stored in DB
        );

        // Step 4: If password wrong → return error
        if (!passwordMatches) {
            return new AuthResponse(
                null, null, null, "Invalid email or password"
            );
        }

        // Step 5: Password correct → generate JWT token
        String token = jwtService.generateToken(admin.getEmail());

        return new AuthResponse(
            token,
            admin.getName(),
            admin.getEmail(),
            "Login successful"
        );
    }
}