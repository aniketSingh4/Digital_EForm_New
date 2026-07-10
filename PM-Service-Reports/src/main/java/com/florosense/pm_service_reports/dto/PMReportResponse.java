package com.florosense.pm_service_reports.dto;


import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class PMReportResponse {

    private Long id;

    private String serviceReportNo;

    private String serviceVisitNo;

    private String clientName;

    private String siteName;

    private String sensorId;

    private LocalDate pmVisitDate;

    private String engineerName;

    private String observation;

    private String recommendation;

    private PMSummaryDTO summary;

    private List<ChecklistItemDTO> checklists;

    private SignOffDTO signOff;

    private LocalDateTime createdAt;

    public PMReportResponse() {
    }

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

	public PMSummaryDTO getSummary() {
		return summary;
	}

	public void setSummary(PMSummaryDTO summary) {
		this.summary = summary;
	}

	public List<ChecklistItemDTO> getChecklists() {
		return checklists;
	}

	public void setChecklists(List<ChecklistItemDTO> checklists) {
		this.checklists = checklists;
	}

	public SignOffDTO getSignOff() {
		return signOff;
	}

	public void setSignOff(SignOffDTO signOff) {
		this.signOff = signOff;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

    // Generate Getters and Setters
    
}
