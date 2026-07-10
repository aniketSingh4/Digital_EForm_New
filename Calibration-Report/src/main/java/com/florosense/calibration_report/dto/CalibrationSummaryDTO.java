package com.florosense.calibration_report.dto;

import lombok.Data;

@Data
public class CalibrationSummaryDTO 
{
    private Boolean calibrationSuccessful;
    private Boolean calibrationAdjustmentPerformed;
    private Boolean sensorWithinAcceptableLimits;
    private Boolean sensorRequiresReplacement;
}