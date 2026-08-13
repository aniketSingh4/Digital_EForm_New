package com.florosense.authentication_system.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.florosense.authentication_system.dto.ApiResponse;
import com.florosense.authentication_system.dto.NotificationRequest;
import com.florosense.authentication_system.dto.NotificationResponse;
import com.florosense.authentication_system.service.NotificationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @PostMapping
    public ResponseEntity<List<NotificationResponse>> create(
            Authentication authentication,
            @Valid @RequestBody NotificationRequest request) {
        return ResponseEntity.ok(notificationService.create(currentEmail(authentication), request));
    }

    @GetMapping
    public ResponseEntity<List<NotificationResponse>> list(Authentication authentication) {
        return ResponseEntity.ok(notificationService.listForUser(currentEmail(authentication)));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markRead(
            Authentication authentication,
            @PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markRead(id, currentEmail(authentication)));
    }

    @PostMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllRead(Authentication authentication) {
        notificationService.markAllRead(currentEmail(authentication));
        return ResponseEntity.ok(new ApiResponse(true, "All notifications marked as read"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> delete(
            Authentication authentication,
            @PathVariable Long id) {
        notificationService.delete(id, currentEmail(authentication));
        return ResponseEntity.ok(new ApiResponse(true, "Notification deleted"));
    }

    @DeleteMapping
    public ResponseEntity<ApiResponse> clearAll(Authentication authentication) {
        notificationService.clearAll(currentEmail(authentication));
        return ResponseEntity.ok(new ApiResponse(true, "All notifications cleared"));
    }

    private String currentEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new RuntimeException("Unauthorized");
        }
        return authentication.getName();
    }
}
