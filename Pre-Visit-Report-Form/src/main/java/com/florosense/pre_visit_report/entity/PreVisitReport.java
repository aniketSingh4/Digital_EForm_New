package com.florosense.pre_visit_report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "pre_visit_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreVisitReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Basic Details - Using correct column names
    @Column(name = "visit_date", nullable = false)
    private LocalDate visitDate;

    @Column(name = "company_name", length = 200)
    private String companyName;

    @Column(name = "site_address", length = 500)
    private String siteAddress;

    @Column(name = "site_person_name", length = 100)
    private String sitePersonName;

    @Column(name = "contact_no", length = 20)
    private String contactNo;

    @Column(name = "email_id", length = 100)
    private String emailId;

    @Column(name = "inspected_by", length = 100)
    private String inspectedBy;

    // Status Details - Using correct column names
    @Column(name = "status_power_supply")
    private Boolean statusPowerSupply;
    
    @Column(name = "remark_power_supply", length = 500)
    private String remarkPowerSupply;

    @Column(name = "status_controller_mounting")
    private Boolean statusControllerMounting;
    
    @Column(name = "remark_controller_mounting", length = 500)
    private String remarkControllerMounting;

    @Column(name = "status_sensor_placement")
    private Boolean statusSensorPlacement;
    
    @Column(name = "remark_sensor_placement", length = 500)
    private String remarkSensorPlacement;

    @Column(name = "status_internet_connectivity")
    private Boolean statusInternetConnectivity;
    
    @Column(name = "remark_internet_connectivity", length = 500)
    private String remarkInternetConnectivity;

    @Column(name = "status_led_installation")
    private Boolean statusLedInstallation;
    
    @Column(name = "remark_led_installation", length = 500)
    private String remarkLedInstallation;

    @Column(name = "status_client_scope")
    private Boolean statusClientScope;
    
    @Column(name = "remark_client_scope", length = 500)
    private String remarkClientScope;

    // Description
    @Column(name = "noted_if_any", columnDefinition = "TEXT")
    private String notedIfAny;

    // Images
    @OneToMany(mappedBy = "report", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<SiteImage> siteImages = new ArrayList<>();

    // Signatures
    @Column(name = "customer_signature", columnDefinition = "TEXT")
    private String customerSignature;

    @Column(name = "customer_name", length = 100)
    private String customerName;

    @Column(name = "technician_signature", columnDefinition = "TEXT")
    private String technicianSignature;

    @Column(name = "technician_name", length = 100)
    private String technicianName;

    @Column(name = "signature_date")
    private LocalDate signatureDate;

    // Checklist Data as JSON
    @Column(name = "checklist_data", columnDefinition = "TEXT")
    private String checklistData;

    // Audit fields
    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    // Helper methods for images
    public void addSiteImage(SiteImage image) {
        siteImages.add(image);
        image.setReport(this);
    }

    public void removeSiteImage(SiteImage image) {
        siteImages.remove(image);
        image.setReport(null);
    }
}