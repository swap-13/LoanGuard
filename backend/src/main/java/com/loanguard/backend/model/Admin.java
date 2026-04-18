package com.loanguard.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data    //using data from lombok it created the getters and setters automatically no need for manual creation 
@Entity
@Table(name = "admins")  //admins table which stores admin info 
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)  //autmatic id is created 
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
    
}
