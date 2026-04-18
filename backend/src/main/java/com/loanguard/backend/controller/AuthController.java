package com.loanguard.backend.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loanguard.backend.dto.AuthRequest;
import com.loanguard.backend.dto.AuthResponse;
import com.loanguard.backend.service.AuthService;

// AuthController handles all authentication related API endpoints
// Only one endpoint here - admin login
// @RestController means this class handles HTTP requests and returns JSON
// @RequestMapping sets the base URL for all methods in this class
@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:3000")
public class AuthController {
    @Autowired
    private AuthService authService;

    @GetMapping("/generate-hash")
    public String generateHash() {
    BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
    return encoder.encode("admin123");
}

    // POST http://localhost:8080/api/auth/login
    // React sends { email, password } → we return JWT token
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        AuthResponse response = authService.login(request);

        // If token is null it means login failed
        if (response.getToken() == null) {
            return ResponseEntity.status(401).body(response);
        }

        return ResponseEntity.ok(response);
    }
}
