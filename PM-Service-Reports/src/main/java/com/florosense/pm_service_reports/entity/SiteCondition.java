package com.florosense.pm_service_reports.entity;

import java.util.Map;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Site condition after PM. Mapping is exact-key only.
 * Do not use contains("OPERATIONAL") — that string is inside every option.
 */
public enum SiteCondition {
    SYSTEM_OPERATIONAL("SYSTEM_OPERATIONAL"),
    SYSTEM_NOT_OPERATIONAL("SYSTEM_NOT_OPERATIONAL"),
    SYSTEM_OPERATIONAL_WITH_OBSERVATION("SYSTEM_OPERATIONAL_WITH_OBSERVATION");

    private static final Map<String, SiteCondition> BY_KEY = Map.of(
            "SYSTEM_OPERATIONAL", SYSTEM_OPERATIONAL,
            "SYSTEM_NOT_OPERATIONAL", SYSTEM_NOT_OPERATIONAL,
            "NOT_OPERATIONAL", SYSTEM_NOT_OPERATIONAL,
            "NON_OPERATIONAL", SYSTEM_NOT_OPERATIONAL,
            "SYSTEM_NON_OPERATIONAL", SYSTEM_NOT_OPERATIONAL,
            "SYSTEM_OPERATIONAL_WITH_OBSERVATION", SYSTEM_OPERATIONAL_WITH_OBSERVATION,
            "SYSTEM_OPERATIONAL_WITH_ISSUES", SYSTEM_OPERATIONAL_WITH_OBSERVATION,
            "OPERATIONAL_WITH_OBSERVATION", SYSTEM_OPERATIONAL_WITH_OBSERVATION
    );

    private final String value;

    SiteCondition(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    @JsonCreator
    public static SiteCondition fromValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String key = value.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        return BY_KEY.get(key);
    }
}
