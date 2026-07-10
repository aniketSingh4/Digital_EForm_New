package com.florosense.pm_service_reports.service;


import java.util.List;

import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;


public interface PreventiveMaintenanceService 
{

    PMReportResponse saveReport(PMReportRequest request);

    PMReportResponse getReport(Long id);
    
    //PMReportSummaryResponse get

    List<PMReportSummaryResponse> getAllReports();

    PMReportResponse updateReport(Long id, PMReportRequest request);

    void deleteReport(Long id);

}