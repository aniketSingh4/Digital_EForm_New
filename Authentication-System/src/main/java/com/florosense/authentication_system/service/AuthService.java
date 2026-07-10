package com.florosense.authentication_system.service;

import com.florosense.authentication_system.dto.*;

public interface AuthService 
{

    ApiResponse register(RegisterRequest request);
    LoginResponse login(LoginRequest request);

}
