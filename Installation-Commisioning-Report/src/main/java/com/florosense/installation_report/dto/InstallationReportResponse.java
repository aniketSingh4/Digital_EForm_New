package com.florosense.installation_report.dto;

import com.florosense.installation_report.entity.EquipmentDetail;
import com.florosense.installation_report.entity.InstallationSiteImage;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationReportResponse 
{
    private Long id;
    private String reportNo;
    private LocalDateTime date;
    private String installedBy;
    
    // Company and Customer Details
    private String companyName;
    private String siteAddress;
    private String customerName;
    private String contactNo;
    private String emailId;
    
    // Equipment Details
    private List<EquipmentDetail> equipmentDetails;
    
    // Work Activity
    private Boolean machineUnboxing;
    private Boolean sensorControllerInstalled;
    private Boolean ledInstalled;
    private Boolean wiringInternalConnectionDone;
    private Boolean basicFunctionalityCheck;
    private Boolean stablePowerSupply;
    private Boolean stableInternetConnection;
    private Boolean safetyMaintenanceExplained;
    
    // Remark
    private String remark;
    
    // Work Confirmation
    private Boolean workConfirmation;
    
 
    private String workActivityOthers;

 
    private List<InstallationSiteImage> siteImages;
    
    // Customer & Technician Confirmation
    private String customerConfirmationName;
    private String customerSignature;
    private String technicianConfirmationName;
    private String technicianSignature;
    
    // Audit Fields
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}