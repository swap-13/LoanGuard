package com.loanguard.backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.loanguard.backend.dto.FraudResultResponse;
import com.loanguard.backend.dto.LoanApplicationRequest;
import com.loanguard.backend.security.JwtService;
import com.loanguard.backend.service.FraudDetectionService;

import jakarta.validation.Valid;

// LoanController now validates incoming requests before processing
// @Valid triggers all the validation annotations in LoanApplicationRequest
@RestController
@RequestMapping("/api")
@CrossOrigin(origins = "http://localhost:3000")
public class LoanController {

    @Autowired
    private FraudDetectionService fraudDetectionService;

    @Autowired
    private JwtService jwtService;

    // -------------------------------------------------------
    // PUBLIC ENDPOINT - Submit loan application
    // @Valid here is the KEY addition
    // It tells Spring Boot: "Before calling this method,
    // check all validation rules in LoanApplicationRequest"
    // If any rule fails → automatically goes to handleValidationException
    // -------------------------------------------------------
    @PostMapping("/applications/submit")
    public ResponseEntity<?> submitApplication(
            @Valid @RequestBody LoanApplicationRequest request) {
        try {
            FraudResultResponse result =
                    fraudDetectionService.analyzeApplication(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(500)
                    .body(Map.of("error",
                            "Failed to process application: " + e.getMessage()));
        }
    }

    // -------------------------------------------------------
    // VALIDATION ERROR HANDLER
    // This method is automatically called by Spring Boot
    // whenever @Valid finds a validation error
    // It collects ALL errors and returns them as a clean JSON
    // -------------------------------------------------------
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidationException(
            MethodArgumentNotValidException ex) {

        // Collect all field errors into a map
        // Key = field name, Value = error message
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }

        // Build response with all errors
        Map<String, Object> response = new HashMap<>();
        response.put("error", "Validation failed");
        response.put("fields", fieldErrors);

        // Return 400 Bad Request with error details
        return ResponseEntity.badRequest().body(response);
    }

    // -------------------------------------------------------
    // PROTECTED - Get all applications (admin only)
    // -------------------------------------------------------
    @GetMapping("/applications/all")
    public ResponseEntity<?> getAllApplications(
            @RequestHeader("Authorization") String authHeader) {

        if (!isValidToken(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized access"));
        }

        List<Map<String, Object>> applications =
                fraudDetectionService.getAllApplications();
        return ResponseEntity.ok(applications);
    }

    // -------------------------------------------------------
    // PROTECTED - Get dashboard stats (admin only)
    // -------------------------------------------------------
    @GetMapping("/dashboard/stats")
    public ResponseEntity<?> getDashboardStats(
            @RequestHeader("Authorization") String authHeader) {

        if (!isValidToken(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized access"));
        }

        Map<String, Object> stats = fraudDetectionService.getDashboardStats();
        return ResponseEntity.ok(stats);
    }

    // -------------------------------------------------------
    // PROTECTED - Override decision (admin only)
    // -------------------------------------------------------
    @PutMapping("/applications/{id}/override")
    public ResponseEntity<?> overrideDecision(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @RequestHeader("Authorization") String authHeader) {

        if (!isValidToken(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized access"));
        }

        String token = authHeader.replace("Bearer ", "");
        String adminEmail = jwtService.extractEmail(token);
        String newDecision = body.get("decision");
        String reason = body.get("reason");

        String result = fraudDetectionService.overrideDecision(
                id, newDecision, adminEmail, reason);

        return ResponseEntity.ok(Map.of("message", result));
    }

    // -------------------------------------------------------
    // HELPER - Validates JWT token
    // -------------------------------------------------------
    private boolean isValidToken(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return false;
        }
        String token = authHeader.replace("Bearer ", "");
        return jwtService.isTokenValid(token);
    }


    // -------------------------------------------------------
// PROTECTED - Delete application (admin only)
// DELETE http://localhost:8080/api/applications/{id}
// -------------------------------------------------------
@DeleteMapping("/applications/{id}")
public ResponseEntity<?> deleteApplication(
        @PathVariable Long id,
        @RequestHeader(value = "Authorization",
                required = false) String authHeader) {
    try {
        if (!isValidToken(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized"));
        }
        String result = fraudDetectionService.deleteApplication(id);
        return ResponseEntity.ok(Map.of("message", result));
    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
    }
}

// -------------------------------------------------------
// PROTECTED - Edit and re-analyze application (admin only)
// PUT http://localhost:8080/api/applications/{id}/reanalyze
// -------------------------------------------------------
@PutMapping("/applications/{id}/reanalyze")
public ResponseEntity<?> reAnalyzeApplication(
        @PathVariable Long id,
        @Valid @RequestBody LoanApplicationRequest request,
        @RequestHeader(value = "Authorization",
                required = false) String authHeader) {
    try {
        if (!isValidToken(authHeader)) {
            return ResponseEntity.status(401)
                    .body(Map.of("error", "Unauthorized"));
        }
        String token = authHeader.replace("Bearer ", "");
        String adminEmail = jwtService.extractEmail(token);
        FraudResultResponse result = fraudDetectionService
                .reAnalyzeApplication(id, request, adminEmail);
        return ResponseEntity.ok(result);
    } catch (Exception e) {
        return ResponseEntity.status(500)
                .body(Map.of("error", e.getMessage()));
    }
}
}