package com.florosense.pre_visit_report.service;

import java.time.LocalDate;
import java.util.List;

import com.florosense.pre_visit_report.dto.PreVisitReportDTO;
import com.florosense.pre_visit_report.dto.SiteImageDTO;

public interface PreVisitReportService 
{
    
    PreVisitReportDTO createReport(PreVisitReportDTO reportDTO);
    PreVisitReportDTO updateReport(Long id, PreVisitReportDTO reportDTO);
    PreVisitReportDTO getReportById(Long id);
    List<PreVisitReportDTO> getAllReports();
    List<PreVisitReportDTO> getReportsByCompanyName(String companyName);
    List<PreVisitReportDTO> getReportsByDateRange(LocalDate startDate, LocalDate endDate);
    List<PreVisitReportDTO> searchReports(String keyword);
    void deleteReport(Long id);
    boolean existsByEmailId(String emailId);
    long getReportCount();

    // ========================================
    // IMAGE UPLOAD METHODS
    // ========================================
    List<SiteImageDTO> getImagesByReportId(Long reportId);
    List<SiteImageDTO> getFinalImagesByReportId(Long reportId);
    void deleteImage(Long imageId);
    void deleteAllImagesByReportId(Long reportId);
    SiteImageDTO updateImageDetails(Long imageId, String description, Boolean isFinal);
    long getImageCountByReportId(Long reportId);
    byte[] getImageData(Long imageId);
}