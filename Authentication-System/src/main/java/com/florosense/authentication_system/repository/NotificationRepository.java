package com.florosense.authentication_system.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.florosense.authentication_system.entity.AppNotification;

public interface NotificationRepository extends JpaRepository<AppNotification, Long> {

    List<AppNotification> findByRecipientEmailOrderByCreatedAtDesc(String recipientEmail);

    long countByRecipientEmailAndReadFlagFalse(String recipientEmail);

    Optional<AppNotification> findByIdAndRecipientEmail(Long id, String recipientEmail);

    void deleteByIdAndRecipientEmail(Long id, String recipientEmail);

    void deleteByRecipientEmail(String recipientEmail);
}
