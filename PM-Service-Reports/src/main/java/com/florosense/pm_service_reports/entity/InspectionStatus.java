package com.florosense.pm_service_reports.entity;


import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum InspectionStatus 
{
 YES("YES"),
 NO("NO");

 private final String value;

 InspectionStatus(String value) {
     this.value = value;
 }

 @JsonValue
 public String getValue() {
     return value;
 }

 @JsonCreator
 public static InspectionStatus fromValue(String value) {
     if (value == null) {
         return NO;
     }
     
     String upperValue = value.trim().toUpperCase();
     
     // Try direct match
     try {
         return InspectionStatus.valueOf(upperValue);
     } catch (IllegalArgumentException e) {
         // Try by value
         for (InspectionStatus status : InspectionStatus.values()) {
             if (status.value.equals(upperValue)) {
                 return status;
             }
         }
     }
     
     // Handle common variations
     if ("Y".equals(upperValue) || "TRUE".equals(upperValue) || "1".equals(upperValue) || 
         "OK".equals(upperValue) || "PASS".equals(upperValue) || "GOOD".equals(upperValue)) {
         return YES;
     }
     
     if ("N".equals(upperValue) || "FALSE".equals(upperValue) || "0".equals(upperValue) || 
         "FAIL".equals(upperValue) || "BAD".equals(upperValue)) {
         return NO;
     }
     
     return NO;
 }
}