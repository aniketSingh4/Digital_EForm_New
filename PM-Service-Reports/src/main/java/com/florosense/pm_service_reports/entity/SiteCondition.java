package com.florosense.pm_service_reports.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum SiteCondition {
    SYSTEM_OPERATIONAL("SYSTEM_OPERATIONAL"),
    SYSTEM_NOT_OPERATIONAL("SYSTEM_NOT_OPERATIONAL"),
    SYSTEM_OPERATIONAL_WITH_OBSERVATION("SYSTEM_OPERATIONAL_WITH_OBSERVATION");

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

        String upperValue = value.trim().toUpperCase().replace(' ', '_').replace('-', '_');

        // Longer / more specific values first. "OPERATIONAL" is a substring of every option.
        if (upperValue.contains("WITH_OBSERVATION") || upperValue.contains("WITH_ISSUES")) {
            return SYSTEM_OPERATIONAL_WITH_OBSERVATION;
        }
        if (upperValue.contains("NOT_OPERATIONAL") || upperValue.contains("NON_OPERATIONAL")) {
            return SYSTEM_NOT_OPERATIONAL;
        }

        try {
            return SiteCondition.valueOf(upperValue);
        } catch (IllegalArgumentException e) {
            for (SiteCondition condition : SiteCondition.values()) {
                if (condition.value.equals(upperValue)) {
                    return condition;
                }
            }
        }

        if ("SYSTEM_OPERATIONAL".equals(upperValue) || "OPERATIONAL".equals(upperValue)) {
            return SYSTEM_OPERATIONAL;
        }

        return null;
    }
}
