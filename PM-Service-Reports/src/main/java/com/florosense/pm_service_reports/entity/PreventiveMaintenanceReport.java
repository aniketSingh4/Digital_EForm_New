package com.florosense.pm_service_reports.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.validator.constraints.Length;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "pm_reports")
public class PreventiveMaintenanceReport 
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    @NotBlank(message = "Service Report No is required")
    @Pattern(
        regexp = "^PM-\\d{4}-\\d{4}$",
        message = "Service Report No must be in format: PM-YYYY-XXXX"
    )
    private String serviceReportNo;

    @Column(nullable = true)
    @Pattern(
        regexp = "^FESPL_[A-Za-z0-9_]+_\\d{2}$",
        message = "Service Visit No must be in format: FESPL_{sensor_id}_{count} (e.g., FESPL_733_01)"
    )
    private String serviceVisitNo;

    @Column(nullable = false)
    @NotBlank(message = "Client Name is required")
    private String clientName;

    @Column(nullable = false)
    @NotBlank(message = "Site Name is required")
    private String siteName;

    @Column(nullable = false)
    @NotBlank(message = "Sensor ID is required")
    private String sensorId;

    @Column(nullable = true)
    private LocalDate pmVisitDate;

    @Column(nullable = true)
    private String engineerName;

    @Column(length = 5000)
    @Length(max = 5000, message = "Observation cannot exceed 5000 characters")
    private String observation;

    @Column(length = 5000)
    @Length(max = 5000, message = "Recommendation cannot exceed 5000 characters")
    private String recommendation;

    @Convert(converter = PMStatusConverter.class)
    @Column(name = "preventive_maintenance_status", length = 64, columnDefinition = "varchar(64)")
    private PMStatus preventiveMaintenanceStatus;

    @Convert(converter = SiteConditionConverter.class)
    @Column(name = "site_condition_after_pm", length = 64, columnDefinition = "varchar(64)")
    private SiteCondition siteConditionAfterPm;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    @OneToMany(
            mappedBy = "report",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private List<PreventiveMaintenanceChecklist> checklists = new ArrayList<>();

    @OneToOne(
            mappedBy = "report",
            cascade = CascadeType.ALL,
            orphanRemoval = true
    )
    private PreventiveMaintenanceSignOff signOff;

    // Getters & Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getServiceReportNo() {
        return serviceReportNo;
    }

    public void setServiceReportNo(String serviceReportNo) {
        this.serviceReportNo = serviceReportNo;
    }

    public String getServiceVisitNo() {
        return serviceVisitNo;
    }

    public void setServiceVisitNo(String serviceVisitNo) {
        this.serviceVisitNo = serviceVisitNo;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public String getSiteName() {
        return siteName;
    }

    public void setSiteName(String siteName) {
        this.siteName = siteName;
    }

    public String getSensorId() {
        return sensorId;
    }

    public void setSensorId(String sensorId) {
        this.sensorId = sensorId;
    }

    public LocalDate getPmVisitDate() {
        return pmVisitDate;
    }

    public void setPmVisitDate(LocalDate pmVisitDate) {
        this.pmVisitDate = pmVisitDate;
    }

    public String getEngineerName() {
        return engineerName;
    }

    public void setEngineerName(String engineerName) {
        this.engineerName = engineerName;
    }

    public String getObservation() {
        return observation;
    }

    public void setObservation(String observation) {
        this.observation = observation;
    }

    public String getRecommendation() {
        return recommendation;
    }

    public void setRecommendation(String recommendation) {
        this.recommendation = recommendation;
    }

    public PMStatus getPreventiveMaintenanceStatus() {
        return preventiveMaintenanceStatus;
    }

    public void setPreventiveMaintenanceStatus(PMStatus preventiveMaintenanceStatus) {
        this.preventiveMaintenanceStatus = preventiveMaintenanceStatus;
    }

    public SiteCondition getSiteConditionAfterPm() {
        return siteConditionAfterPm;
    }

    public void setSiteConditionAfterPm(SiteCondition siteConditionAfterPm) {
        this.siteConditionAfterPm = siteConditionAfterPm;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<PreventiveMaintenanceChecklist> getChecklists() {
        return checklists;
    }

    public void setChecklists(List<PreventiveMaintenanceChecklist> checklists) {
        this.checklists = checklists;
    }

    public PreventiveMaintenanceSignOff getSignOff() {
        return signOff;
    }

    public void setSignOff(PreventiveMaintenanceSignOff signOff) {
        this.signOff = signOff;
    }

    // Helper methods
    public void addChecklist(PreventiveMaintenanceChecklist checklist) {
        checklists.add(checklist);
        checklist.setReport(this);
    }

    public void removeChecklist(PreventiveMaintenanceChecklist checklist) {
        checklists.remove(checklist);
        checklist.setReport(null);
    }
}