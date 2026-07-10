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
        if (value == null) {
            return SYSTEM_OPERATIONAL;
        }
        
        String upperValue = value.trim().toUpperCase();
        
        // Try direct match
        try {
            return SiteCondition.valueOf(upperValue);
        } catch (IllegalArgumentException e) {
            // Try by value
            for (SiteCondition condition : SiteCondition.values()) {
                if (condition.value.equals(upperValue)) {
                    return condition;
                }
            }
        }
        
        // Handle variations
        if ("SYSTEM_OPERATIONAL".equals(upperValue) || "OPERATIONAL".equals(upperValue)) {
            return SYSTEM_OPERATIONAL;
        }
        if ("SYSTEM_NOT_OPERATIONAL".equals(upperValue) || "NOT_OPERATIONAL".equals(upperValue)) {
            return SYSTEM_NOT_OPERATIONAL;
        }
        if ("SYSTEM_OPERATIONAL_WITH_ISSUES".equals(upperValue) || "WITH_ISSUES".equals(upperValue)) {
            return SYSTEM_OPERATIONAL_WITH_OBSERVATION;
        }
        
        return SYSTEM_OPERATIONAL;
    }
}
