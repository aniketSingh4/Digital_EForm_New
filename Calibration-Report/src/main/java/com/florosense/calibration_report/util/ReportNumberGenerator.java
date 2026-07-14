package com.florosense.calibration_report.util;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.florosense.calibration_report.repository.CalibrationReportRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class ReportNumberGenerator 
{
    
    private final CalibrationReportRepository reportRepository;
    
    private static final String REPORT_PREFIX = "FLO_CAL_";
    private static final String SERIAL_PREFIX = "FLO_SER_";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    
    public String generateReportNumber() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        long count = reportRepository.count() + 1;
        String sequence = String.format("%04d", count);
        return String.format("%s-%s-%s", REPORT_PREFIX, datePart, sequence);
    }
    
    
    public String generateSerialNumber() {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        long count = reportRepository.count() + 1;
        String sequence = String.format("%04d", count);
        return String.format("%s-%s-%s", SERIAL_PREFIX, datePart, sequence);
    }
}