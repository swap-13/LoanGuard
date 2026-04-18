package com.loanguard.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/*After admin logs in successfully, we send back a JWT token. React stores this token and sends it with every future request
 to prove "I am a logged in admin." This is how authentication works in modern REST APIs. */

 
// This is what we send BACK after successful admin login
// Contains the JWT token which frontend stores and uses for all future requests
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
     private String token;
    private String name;
    private String email;
    private String message;
}
