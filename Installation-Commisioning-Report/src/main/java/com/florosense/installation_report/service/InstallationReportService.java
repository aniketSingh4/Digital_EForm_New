package com.florosense.installation_report.service;

import java.time.LocalDateTime;
import java.util.List;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;
import com.florosense.installation_report.dto.InstallationReportSummaryResponse;
import com.florosense.installation_report.entity.InstallationSiteImage;

public interface InstallationReportService 
{
    // ========================================
    // REPORT CRUD OPERATIONS
    // ========================================
    
    InstallationReportResponse createReport(InstallationReportRequest request);
    
    InstallationReportResponse updateReport(Long id, InstallationReportRequest request);
    
    InstallationReportResponse getReportById(Long id);
    
    InstallationReportResponse getReportByReportNo(String reportNo);
    
    List<InstallationReportSummaryResponse> getAllReports();
    
    List<InstallationReportSummaryResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate);
    
    List<InstallationReportSummaryResponse> getReportsByInstalledBy(String installedBy);

    long getReportCount();
    
    void deleteReport(Long id);
    
    String generateReportNumber();
    
    // ========================================
    // IMAGE MANAGEMENT METHODS
    // ========================================
    List<InstallationSiteImage> getImagesByReportId(Long reportId);
    
    List<InstallationSiteImage> getFinalImagesByReportId(Long reportId);
    
    void deleteImage(Long imageId);
    
    void deleteAllImagesByReportId(Long reportId);
    
    InstallationSiteImage updateImageDetails(Long imageId, String description, Boolean isFinal);
    
    long getImageCountByReportId(Long reportId);
    
    byte[] getImageData(Long imageId);
}