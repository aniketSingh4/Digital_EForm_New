package com.florosense.installation_report.service;



import java.time.LocalDateTime;
import java.util.List;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;

public interface InstallationReportService 
{
    
    InstallationReportResponse createReport(InstallationReportRequest request);
    
    InstallationReportResponse updateReport(Long id, InstallationReportRequest request);
    
    InstallationReportResponse getReportById(Long id);
    
    InstallationReportResponse getReportByReportNo(String reportNo);
    
    List<InstallationReportResponse> getAllReports();
    
    List<InstallationReportResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    List<InstallationReportResponse> getReportsByInstalledBy(String installedBy);
    
    void deleteReport(Long id);
    
    String generateReportNumber();
}
