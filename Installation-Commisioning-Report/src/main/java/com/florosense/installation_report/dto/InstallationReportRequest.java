package com.florosense.installation_report.dto;

import com.florosense.installation_report.entity.EquipmentDetail;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationReportRequest 
{
    
    @NotNull(message = "Date is required")
    private LocalDateTime date;
    
    @NotBlank(message = "Installed By is required")
    private String installedBy;
    
    // Company and Customer Details
    @NotBlank(message = "Company Name is required")
    private String companyName;
    
    @NotBlank(message = "Site Address is required")
    private String siteAddress;
    
    @NotBlank(message = "Customer Name is required")
    private String customerName;
    
    @NotBlank(message = "Contact Number is required")
    private String contactNo;
    
    @NotBlank(message = "Email ID is required")
    private String emailId;
    
    // Equipment Details
    @Valid
    @NotNull(message = "Equipment details are required")
    private List<EquipmentDetail> equipmentDetails;
    
    // Work Activity
    private Boolean machineUnboxing = false;
    private Boolean sensorControllerInstalled = false;
    private Boolean ledInstalled = false;
    private Boolean wiringInternalConnectionDone = false;
    private Boolean basicFunctionalityCheck = false;
    private Boolean stablePowerSupply = false;
    private Boolean stableInternetConnection = false;
    private Boolean safetyMaintenanceExplained = false;
    
    // Remark
    private String remark;
    
    // Work Confirmation
    @NotNull(message = "Work confirmation is required")
    private Boolean workConfirmation = false;
    
    // Customer & Technician Confirmation
    @NotBlank(message = "Customer Confirmation Name is required")
    private String customerConfirmationName;
    
    private String customerSignature;
    
    @NotBlank(message = "Technician Confirmation Name is required")
    private String technicianConfirmationName;
    
    private String technicianSignature;
}