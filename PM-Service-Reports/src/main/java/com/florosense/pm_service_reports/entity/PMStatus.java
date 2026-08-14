package com.florosense.pm_service_reports.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum PMStatus {
 SATISFACTORY("SATISFACTORY"),
 FOLLOW_UP_VISIT_REQUIRED("FOLLOW_UP_VISIT_REQUIRED"),
 REQUIRES_ATTENTION("REQUIRES_ATTENTION");

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

     String upperValue = value.trim().toUpperCase().replace(' ', '_');

     try {
         return PMStatus.valueOf(upperValue);
     } catch (IllegalArgumentException e) {
         for (PMStatus status : PMStatus.values()) {
             if (status.value.equals(upperValue)) {
                 return status;
             }
         }
     }

     if ("SATISFACTORY".equals(upperValue)) {
         return SATISFACTORY;
     }
     if ("FOLLOW_UP_VISIT_REQUIRED".equals(upperValue) || "FOLLOW_UP".equals(upperValue)
             || "FOLLOWUP_VISIT_REQUIRED".equals(upperValue)) {
         return FOLLOW_UP_VISIT_REQUIRED;
     }
     if ("REQUIRES_ATTENTION".equals(upperValue) || "ATTENTION".equals(upperValue)) {
         return REQUIRES_ATTENTION;
     }

     return null;
 }
}
