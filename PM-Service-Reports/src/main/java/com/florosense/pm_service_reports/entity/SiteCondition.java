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

    private static final Map<String, SiteCondition> BY_KEY = Map.ofEntries(
            Map.entry("SYSTEM_OPERATIONAL", SYSTEM_OPERATIONAL),
            Map.entry("OPERATIONAL", SYSTEM_OPERATIONAL),
            Map.entry("0", SYSTEM_OPERATIONAL),
            Map.entry("SYSTEM_NOT_OPERATIONAL", SYSTEM_NOT_OPERATIONAL),
            Map.entry("NOT_OPERATIONAL", SYSTEM_NOT_OPERATIONAL),
            Map.entry("NON_OPERATIONAL", SYSTEM_NOT_OPERATIONAL),
            Map.entry("SYSTEM_NON_OPERATIONAL", SYSTEM_NOT_OPERATIONAL),
            Map.entry("1", SYSTEM_NOT_OPERATIONAL),
            Map.entry("SYSTEM_OPERATIONAL_WITH_OBSERVATION", SYSTEM_OPERATIONAL_WITH_OBSERVATION),
            Map.entry("SYSTEM_OPERATIONAL_WITH_ISSUES", SYSTEM_OPERATIONAL_WITH_OBSERVATION),
            Map.entry("OPERATIONAL_WITH_OBSERVATION", SYSTEM_OPERATIONAL_WITH_OBSERVATION),
            Map.entry("2", SYSTEM_OPERATIONAL_WITH_OBSERVATION)
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
        SiteCondition exact = BY_KEY.get(key);
        if (exact != null) {
            return exact;
        }
        if (key.contains("WITH_OBS") || key.contains("WITH_ISSUE")) {
            return SYSTEM_OPERATIONAL_WITH_OBSERVATION;
        }
        if (key.contains("NOT_OPER") || key.contains("NON_OPER")) {
            return SYSTEM_NOT_OPERATIONAL;
        }
        if ("SYSTEM_OPERATIONAL".equals(key) || "OPERATIONAL".equals(key)) {
            return SYSTEM_OPERATIONAL;
        }
        return null;
    }
}
