package com.loanguard.backend.dto;
import lombok.Data;

// This DTO is used when admin tries to login
// Only needs email and password - nothing else
@Data
public class AuthRequest {
    
    private String email;
    private String password;
}
