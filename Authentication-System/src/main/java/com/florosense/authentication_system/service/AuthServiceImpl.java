package com.florosense.authentication_system.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.florosense.authentication_system.dto.*;
import com.florosense.authentication_system.entity.Users;
import com.florosense.authentication_system.repository.UserRepository;
import com.florosense.authentication_system.security.CustomUserDetails;
import com.florosense.authentication_system.security.JwtService;


@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    private final AuthenticationManager authenticationManager;

    private final JwtService jwtService;

    

    public AuthServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder,
			AuthenticationManager authenticationManager, JwtService jwtService) {
		super();
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
	}

	@Override
    public ApiResponse register(RegisterRequest request) {

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered.");
        }

        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new RuntimeException("Phone number already registered.");
        }

        Users user = new Users();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(normalizeRole(request.getRole()));
        user.setEnabled(true);

        userRepository.save(user);

        return new ApiResponse(true, "Registration Successful");
    }
    
	@Override
	public LoginResponse login(LoginRequest request) {

	    try {

	        Authentication authentication = authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(
	                        request.getEmail() != null ? request.getEmail().trim() : "",
	                        request.getPassword()));

	        CustomUserDetails userDetails =
	                (CustomUserDetails) authentication.getPrincipal();

	        Users user = userDetails.getUser();
	        String role = user.getRole() != null ? user.getRole() : "USER";
	        String token = jwtService.generateToken(
	                user.getEmail(),
	                role,
	                user.getName());

	        return new LoginResponse(token, role, user.getName(), user.getEmail());

	    } catch (Exception e) {
	        log.warn("Login failed for email {}: {}", request.getEmail(), e.getMessage());
	        throw e;
	    }
	}

    private String normalizeRole(String role) {
        if (role == null || role.isBlank()) {
            return "USER";
        }
        String normalized = role.trim().toUpperCase();
        if ("ADMIN".equals(normalized) || "USER".equals(normalized)) {
            return normalized;
        }
        return "USER";
    }
}
