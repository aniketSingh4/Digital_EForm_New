package com.florosense.api_gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
@RequestMapping("/fallback")
public class FallbackController 
{
    
    @GetMapping("/pm")
    public Mono<String> pmFallback() 
    {
        return Mono.just("PM Reports service is currently unavailable. Please try again later.");
    }
    
    @GetMapping("/auth")
    public Mono<String> authFallback() 
    {
        return Mono.just("Authentication service is currently unavailable. Please try again later.");
    }
    
    @GetMapping("/calibration")
    public Mono<String> calibrationFallback() 
    {
        return Mono.just("Calibration service is currently unavailable. Please try again later.");
    }
    
    @GetMapping("/previsit")
    public Mono<String> previsitFallback() 
    {
        return Mono.just("PreVisit service is currently unavailable. Please try again later.");
    }
    
    @GetMapping("/installation")
    public Mono<String> installationFallback() 
    {
        return Mono.just("Installation service is currently unavailable. Please try again later.");
    }
}
