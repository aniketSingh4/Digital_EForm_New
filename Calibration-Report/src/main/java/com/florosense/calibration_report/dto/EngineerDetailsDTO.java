package com.florosense.calibration_report.dto;

import java.time.LocalDate;

import lombok.Data;

@Data
public class EngineerDetailsDTO 
{
    private String engineerName;
    private String signature;
    private LocalDate date;
}