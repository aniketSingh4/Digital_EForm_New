package com.florosense.calibration_report.dto;

import lombok.Data;

@Data
public class ReadingAfterCalibrationDTO {
    private Double pm25Value;
    private Double pm10Value;
    private Double temp;
    private Double humidity;
}
