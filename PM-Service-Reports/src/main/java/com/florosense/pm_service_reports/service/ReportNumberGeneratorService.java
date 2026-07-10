package com.florosense.pm_service_reports.service;

import com.florosense.pm_service_reports.repository.PreventiveMaintenanceReportRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
public class ReportNumberGeneratorService 
{

    @Autowired
    private PreventiveMaintenanceReportRepository repository;

    /**
     * Generate Service Report No
     * Format: PM-YYYY-XXXX
     */
    public String generateServiceReportNo() {
        String year = String.valueOf(LocalDate.now().getYear());
        
        // Count reports for current year
        long count = repository.countByYear(year);
        String paddedCount = String.format("%04d", count + 1);
        
        return "PM-" + year + "-" + paddedCount;
    }

    /**
     * Generate Service Visit No
     * Format: SVG_MONTH_ENG_CODE_XXX
     */
    public String generateServiceVisitNo(String engineerName) {
        String month = LocalDate.now().getMonth().name();
        String engineerCode = engineerName != null && engineerName.length() >= 3 
                ? engineerName.substring(0, 3).toUpperCase() 
                : "ENG";
        
        // Count reports for current month
        String monthYear = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy-MM"));
        long count = repository.countByMonthYear(monthYear);
        String paddedCount = String.format("%03d", count + 1);
        
        return "SVG_" + month + "_" + engineerCode + "_" + paddedCount;
    }
}