package com.florosense.pm_service_reports.entity;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum ChecklistCategory 
{
 PHYSICAL_INSPECTION("PHYSICAL_INSPECTION"),
 POWER_SUPPLY("POWER_SUPPLY"),
 SENSOR_HEALTH("SENSOR_HEALTH"),
 COMMUNICATION("COMMUNICATION"),
 CALIBRATION_PERFORMANCE_VERIFICATION("CALIBRATION_PERFORMANCE_VERIFICATION"),
 CLEANING_ACTIVITY("CLEANING_ACTIVITY");

 private final String value;

 ChecklistCategory(String value) {
     this.value = value;
 }

 @JsonValue
 public String getValue() {
     return value;
 }

 @JsonCreator
 public static ChecklistCategory fromValue(String value) {
     if (value == null) {
         return PHYSICAL_INSPECTION;
     }
     
     String upperValue = value.trim().toUpperCase();
     
     // Try direct match
     try {
         return ChecklistCategory.valueOf(upperValue);
     } catch (IllegalArgumentException e) {
         // Try by value
         for (ChecklistCategory category : ChecklistCategory.values()) {
             if (category.value.equals(upperValue)) {
                 return category;
             }
         }
     }
     
     // Handle variations
     if ("PHYSICAL_INSPECTION".equals(upperValue) || "PHYSICAL".equals(upperValue)) {
         return PHYSICAL_INSPECTION;
     }
     if ("POWER_SUPPLY".equals(upperValue) || "POWER".equals(upperValue)) {
         return POWER_SUPPLY;
     }
     if ("SENSOR_HEALTH".equals(upperValue) || "SENSOR".equals(upperValue)) {
         return SENSOR_HEALTH;
     }
     if ("CALIBRATION_PERFORMANCE_VERIFICATION".equals(upperValue) || "CALIBRATION".equals(upperValue)) {
         return CALIBRATION_PERFORMANCE_VERIFICATION;
     }
     if ("CLEANING_ACTIVITY".equals(upperValue) || "CLEANING".equals(upperValue)) {
         return CLEANING_ACTIVITY;
     }
     
     return PHYSICAL_INSPECTION;
 }
}
