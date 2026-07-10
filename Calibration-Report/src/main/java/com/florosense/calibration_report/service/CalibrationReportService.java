package com.florosense.calibration_report.service;

import java.util.List;

import com.florosense.calibration_report.dto.CalibrationReportDTO;
import com.florosense.calibration_report.dto.CreateCalibrationReportRequest;

public interface CalibrationReportService {
    
    
    CalibrationReportDTO createReport(CreateCalibrationReportRequest request);
    CalibrationReportDTO getReportById(String id);
    CalibrationReportDTO getReportByReportNo(String reportNo);
    List<CalibrationReportDTO> getAllReports();
    CalibrationReportDTO updateReport(String id, CreateCalibrationReportRequest request);
    void deleteReport(String id);
    long getReportCount();
    List<CalibrationReportDTO> getReportsByClientName(String clientName);
    List<CalibrationReportDTO> getReportsByDateRange(String startDate, String endDate);
}