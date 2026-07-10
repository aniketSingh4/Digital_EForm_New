package com.florosense.authentication_system.service;

import org.springframework.beans.factory.annotation.Autowired;
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

        Users user = new Users();

        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPhone(request.getPhone());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        user.setEnabled(true);

        userRepository.save(user);

        return new ApiResponse(true, "Registration Successful");
    }
    
	@Override
	public LoginResponse login(LoginRequest request) {

	    try {

	        Authentication authentication = authenticationManager.authenticate(
	                new UsernamePasswordAuthenticationToken(
	                        request.getEmail(),
	                        request.getPassword()));

	        CustomUserDetails userDetails =
	                (CustomUserDetails) authentication.getPrincipal();

	        String token = jwtService.generateToken(userDetails.getUsername());

	        return new LoginResponse(token);

	    } catch (Exception e) {
	        e.printStackTrace();   // <-- IMPORTANT
	        throw e;
	    }
	}
}
