package com.florosense.installation_report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationReportSummaryResponse {
    private Long id;
    private String reportNo;
    private LocalDateTime date;
    private String installedBy;
    private String companyName;
    private String siteAddress;
    private String customerName;
    private Boolean workConfirmation;
}
