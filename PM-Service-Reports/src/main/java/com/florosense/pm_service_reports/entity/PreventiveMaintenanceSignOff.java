package com.florosense.pm_service_reports.entity;


import java.time.LocalDate;

import jakarta.persistence.*;

@Entity
@Table(name = "pm_sign_off")
public class PreventiveMaintenanceSignOff {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "report_id")
    private PreventiveMaintenanceReport report;

    private String clientRepresentativeName;

    private String designation;

    private String clientSignature;

    private LocalDate clientDate;

    private String serviceEngineerName;

    private String serviceEngineerSignature;

    private LocalDate serviceEngineerDate;

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public PreventiveMaintenanceReport getReport() {
		return report;
	}

	public void setReport(PreventiveMaintenanceReport report) {
		this.report = report;
	}

	public String getClientRepresentativeName() {
		return clientRepresentativeName;
	}

	public void setClientRepresentativeName(String clientRepresentativeName) {
		this.clientRepresentativeName = clientRepresentativeName;
	}

	public String getDesignation() {
		return designation;
	}

	public void setDesignation(String designation) {
		this.designation = designation;
	}

	public String getClientSignature() {
		return clientSignature;
	}

	public void setClientSignature(String clientSignature) {
		this.clientSignature = clientSignature;
	}

	public LocalDate getClientDate() {
		return clientDate;
	}

	public void setClientDate(LocalDate clientDate) {
		this.clientDate = clientDate;
	}

	public String getServiceEngineerName() {
		return serviceEngineerName;
	}

	public void setServiceEngineerName(String serviceEngineerName) {
		this.serviceEngineerName = serviceEngineerName;
	}

	public String getServiceEngineerSignature() {
		return serviceEngineerSignature;
	}

	public void setServiceEngineerSignature(String serviceEngineerSignature) {
		this.serviceEngineerSignature = serviceEngineerSignature;
	}

	public LocalDate getServiceEngineerDate() {
		return serviceEngineerDate;
	}

	public void setServiceEngineerDate(LocalDate serviceEngineerDate) {
		this.serviceEngineerDate = serviceEngineerDate;
	}

    // Getters & Setters
    

}
