package com.florosense.authentication_system.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.florosense.authentication_system.dto.NotificationRequest;
import com.florosense.authentication_system.dto.NotificationResponse;
import com.florosense.authentication_system.entity.AppNotification;
import com.florosense.authentication_system.entity.Users;
import com.florosense.authentication_system.repository.NotificationRepository;
import com.florosense.authentication_system.repository.UserRepository;

@Service
public class NotificationServiceImpl implements NotificationService {

    private static final String AUDIENCE_USER = "USER";
    private static final String AUDIENCE_ADMIN = "ADMIN";
    private static final String TYPE_REPORT_CREATED = "REPORT_CREATED";
    private static final Set<String> ADMIN_FANOUT_TYPES = Set.of(
            "REPORT_CREATED",
            "REPORT_UPDATED",
            "REPORT_DELETED",
            "REPORT_DOWNLOADED",
            "BULK_DELETED"
    );

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    public NotificationServiceImpl(NotificationRepository notificationRepository, UserRepository userRepository) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public List<NotificationResponse> create(String actorEmail, NotificationRequest request) {
        String normalizedActorEmail = normalizeEmail(actorEmail);
        Users actor = userRepository.findByEmailIgnoreCase(normalizedActorEmail)
                .or(() -> userRepository.findByEmail(actorEmail))
                .orElseThrow(() -> new RuntimeException("User not found"));

        String type = normalizeType(request.getType());
        String actorName = actor.getName();
        List<AppNotification> saved = new ArrayList<>();

        saved.add(notificationRepository.save(buildNotification(
                type,
                AUDIENCE_USER,
                normalizedActorEmail,
                actorName,
                normalizedActorEmail,
                request,
                buildSummary(type, actorName, request, true))));

        if (ADMIN_FANOUT_TYPES.contains(type)) {
            List<Users> admins = userRepository.findByRoleIgnoreCaseIn(List.of("ADMIN", "ROLE_ADMIN"));
            if (admins.isEmpty()) {
                admins = userRepository.findByRoleIgnoreCase(AUDIENCE_ADMIN);
            }
            for (Users admin : admins) {
                saved.add(notificationRepository.save(buildNotification(
                        type,
                        AUDIENCE_ADMIN,
                        normalizeEmail(admin.getEmail()),
                        actorName,
                        normalizedActorEmail,
                        request,
                        buildSummary(type, actorName, request, false))));
            }
        }

        return saved.stream()
                .filter(notification -> normalizedActorEmail.equalsIgnoreCase(notification.getRecipientEmail()))
                .map(NotificationResponse::from)
                .toList();
    }

    @Override
    public List<NotificationResponse> listForUser(String recipientEmail) {
        return notificationRepository
                .findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(recipientEmail)).stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Override
    @Transactional
    public NotificationResponse markRead(Long id, String recipientEmail) {
        AppNotification notification = notificationRepository
                .findByIdAndRecipientEmailIgnoreCase(id, normalizeEmail(recipientEmail))
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notification.setReadFlag(true);
        return NotificationResponse.from(notificationRepository.save(notification));
    }

    @Override
    @Transactional
    public void markAllRead(String recipientEmail) {
        List<AppNotification> notifications = notificationRepository
                .findByRecipientEmailIgnoreCaseOrderByCreatedAtDesc(normalizeEmail(recipientEmail));
        for (AppNotification notification : notifications) {
            notification.setReadFlag(true);
        }
        notificationRepository.saveAll(notifications);
    }

    @Override
    @Transactional
    public void delete(Long id, String recipientEmail) {
        AppNotification notification = notificationRepository
                .findByIdAndRecipientEmailIgnoreCase(id, normalizeEmail(recipientEmail))
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        notificationRepository.delete(notification);
    }

    @Override
    @Transactional
    public void clearAll(String recipientEmail) {
        notificationRepository.deleteByRecipientEmailIgnoreCase(normalizeEmail(recipientEmail));
    }

    private AppNotification buildNotification(
            String type,
            String audience,
            String recipientEmail,
            String actorName,
            String actorEmail,
            NotificationRequest request,
            String summary) {
        AppNotification notification = new AppNotification();
        notification.setType(type);
        notification.setAudience(audience);
        notification.setRecipientEmail(recipientEmail);
        notification.setActorName(actorName);
        notification.setActorEmail(actorEmail);
        notification.setReportType(blankToNull(request.getReportType()));
        notification.setReportTitle(blankToNull(request.getReportTitle()));
        notification.setReportId(blankToNull(request.getReportId()));
        notification.setSummary(summary);
        notification.setReadFlag(false);
        return notification;
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            return TYPE_REPORT_CREATED;
        }
        return type.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
    }

    private String buildSummary(String type, String actorName, NotificationRequest request, boolean forActor) {
        if (request.getSummary() != null && !request.getSummary().isBlank()) {
            return request.getSummary().trim();
        }

        String reportType = request.getReportType() != null && !request.getReportType().isBlank()
                ? request.getReportType().trim()
                : "Report";
        String title = firstNonBlank(request.getReportTitle(), request.getReportId());
        String titlePart = title != null ? " \"" + title + "\"" : "";
        String about = aboutClause(request);

        String who = forActor ? "You" : (actorName != null && !actorName.isBlank() ? actorName : "A user");

        if ("BULK_DELETED".equals(type)) {
            String count = firstNonBlank(request.getReportTitle(), request.getReportId(), "1");
            boolean plural = !"1".equals(count);
            return who + " deleted " + count + " " + reportType + (plural ? "s" : "") + ".";
        }

        String action = switch (type) {
            case "REPORT_UPDATED" -> "updated";
            case "REPORT_DELETED" -> "deleted";
            case "REPORT_DOWNLOADED" -> "downloaded";
            default -> "created";
        };

        return who + " " + action + " " + reportType + titlePart + about + ".";
    }

    private String aboutClause(NotificationRequest request) {
        String customer = blankToNull(request.getCustomerName());
        String location = blankToNull(request.getLocation());
        String equipment = blankToNull(request.getEquipment());

        if (customer != null && location != null) {
            return " for " + customer + ", " + location;
        }
        if (customer != null) {
            return " for " + customer;
        }
        if (location != null) {
            return " at " + location;
        }
        if (equipment != null) {
            return " for " + equipment;
        }
        return "";
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }
}
