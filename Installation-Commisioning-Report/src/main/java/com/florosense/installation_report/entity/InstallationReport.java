package com.florosense.installation_report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "installation_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationReport {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "report_no", unique = true, nullable = false, length = 50)
    private String reportNo;
    
    @Column(name = "report_date", nullable = false)
    private LocalDateTime date;
    
    @Column(name = "installed_by", nullable = false, length = 100)
    private String installedBy;
    
    // Company and Customer Details
    @Column(name = "company_name", length = 200)
    private String companyName;
    
    @Column(name = "site_address", length = 500)
    private String siteAddress;
    
    @Column(name = "customer_name", length = 100)
    private String customerName;
    
    @Column(name = "contact_no", length = 20)
    private String contactNo;
    
    @Column(name = "email_id", length = 100)
    private String emailId;
    
    // Equipment Details - Stored as JSON or separate table
    @ElementCollection
    @CollectionTable(name = "report_equipment_details", 
                     joinColumns = @JoinColumn(name = "report_id"))
    private List<EquipmentDetail> equipmentDetails = new ArrayList<>();
    
    // Work Activity Checkboxes
    @Column(name = "machine_unboxing")
    private Boolean machineUnboxing = false;
    
    @Column(name = "sensor_controller_installed")
    private Boolean sensorControllerInstalled = false;
    
    @Column(name = "led_installed")
    private Boolean ledInstalled = false;
    
    @Column(name = "wiring_internal_connection_done")
    private Boolean wiringInternalConnectionDone = false;
    
    @Column(name = "basic_functionality_check")
    private Boolean basicFunctionalityCheck = false;
    
    @Column(name = "stable_power_supply")
    private Boolean stablePowerSupply = false;
    
    @Column(name = "stable_internet_connection")
    private Boolean stableInternetConnection = false;
    
    @Column(name = "safety_maintenance_explained")
    private Boolean safetyMaintenanceExplained = false;
    
    // Remark
    @Column(name = "remark", length = 1000)
    private String remark;
    
    // Work Confirmation
    @Column(name = "work_confirmation", nullable = false)
    private Boolean workConfirmation = false;
    
    // Customer & Technician Confirmation
    @Column(name = "customer_confirmation_name", length = 100)
    private String customerConfirmationName;
    
    @Column(name = "customer_signature", length = 255)
    private String customerSignature;
    
    @Column(name = "technician_confirmation_name", length = 100)
    private String technicianConfirmationName;
    
    @Column(name = "technician_signature", length = 255)
    private String technicianSignature;
    
    // Audit Fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}