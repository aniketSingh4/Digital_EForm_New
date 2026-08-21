package com.florosense.authentication_system.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.florosense.authentication_system.dto.ApiResponse;
import com.florosense.authentication_system.dto.LoginRequest;
import com.florosense.authentication_system.dto.RegisterRequest;
import com.florosense.authentication_system.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final boolean registrationEnabled;

    public AuthController(
            AuthService authService,
            @Value("${auth.registration.enabled:true}") boolean registrationEnabled) {
        this.authService = authService;
        this.registrationEnabled = registrationEnabled;
    }

    @GetMapping("/ping")
    public ResponseEntity<ApiResponse> ping() {
        return ResponseEntity.ok(new ApiResponse(true, "auth-ok"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        if (!registrationEnabled) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ApiResponse(false, "Registration is disabled"));
        }
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (AuthenticationException ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Invalid email or password"));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ApiResponse(false,
                            ex.getMessage() != null ? ex.getMessage() : "Login failed"));
        }
    }
}
