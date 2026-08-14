package com.florosense.pm_service_reports.entity;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PMStatus {
    SATISFACTORY("SATISFACTORY"),
    FOLLOW_UP_VISIT_REQUIRED("FOLLOW_UP_VISIT_REQUIRED"),
    REQUIRES_ATTENTION("REQUIRES_ATTENTION");

    private static final Map<String, PMStatus> BY_KEY = Map.of(
            "SATISFACTORY", SATISFACTORY,
            "0", SATISFACTORY,
            "FOLLOW_UP_VISIT_REQUIRED", FOLLOW_UP_VISIT_REQUIRED,
            "FOLLOWUP_VISIT_REQUIRED", FOLLOW_UP_VISIT_REQUIRED,
            "1", FOLLOW_UP_VISIT_REQUIRED,
            "REQUIRES_ATTENTION", REQUIRES_ATTENTION,
            "2", REQUIRES_ATTENTION
    );

    private final String value;

    PMStatus(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static PMStatus fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String key = value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return BY_KEY.get(key);
    }
}
