package com.florosense.authentication_system.service;

import java.util.List;

import com.florosense.authentication_system.dto.NotificationRequest;
import com.florosense.authentication_system.dto.NotificationResponse;

public interface NotificationService {

    List<NotificationResponse> create(String actorEmail, NotificationRequest request);

    List<NotificationResponse> listForUser(String recipientEmail);

    NotificationResponse markRead(Long id, String recipientEmail);

    void markAllRead(String recipientEmail);

    void delete(Long id, String recipientEmail);

    void clearAll(String recipientEmail);
}
