package com.florosense.calibration_report.dto;


import lombok.Data;
import java.time.LocalDate;

@Data
public class CalibrationReportDTO 
{
    private String id;
    private String reportNo;
    private LocalDate reportDate;
    private String clientName;
    private String siteName;
    private String siteAddress;
    private String sensorId;
    private String modelNo;
    private String serialNo;
    private LocalDate calibrationDate;
    private LocalDate calibrationDueDate;
    
    private MasterRefInstrumentDTO masterRefInstrument;
    private ReadingBeforeCalibrationDTO readingBeforeCalibration;
    private ReadingAfterCalibrationDTO readingAfterCalibration;
    private CalibrationSummaryDTO calibrationSummary;
    private String remarks;
    private String declaration;
    private EngineerDetailsDTO engineerDetails;
}
