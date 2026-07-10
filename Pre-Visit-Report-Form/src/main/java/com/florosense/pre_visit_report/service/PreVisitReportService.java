package com.florosense.pre_visit_report.service;


import java.time.LocalDate;
import java.util.List;

import com.florosense.pre_visit_report.dto.PreVisitReportDTO;

public interface PreVisitReportService {
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
}