package com.florosense.pm_service_reports.dto;


import java.time.LocalDate;
import java.util.List;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonFormat;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PMReportRequest {

    @NotBlank
    private String serviceReportNo;

    @NotBlank
    private String serviceVisitNo;

    @NotBlank
    private String clientName;

    @NotBlank
    private String siteName;

    @NotBlank
    private String sensorId;

    @NotNull(message = "PM Visit Date is required", groups = {ValidationGroups.Create.class})
    @JsonFormat(shape = JsonFormat.Shape.STRING, pattern = "yyyy-MM-dd")
    private LocalDate pmVisitDate;

    @NotBlank
    private String engineerName;

    private String observation;

    private String recommendation;

    @JsonAlias({ "pmStatus" })
    private String preventiveMaintenanceStatus;

    @JsonAlias({ "siteCondition" })
    private String siteConditionAfterPm;

    @Valid
    private PMSummaryDTO summary;

    @Valid
    //@NotEmpty
    private List<ChecklistItemDTO> checklists;

    @Valid
    private SignOffDTO signOff;

    public PMReportRequest() {
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

	public String getPreventiveMaintenanceStatus() {
		return preventiveMaintenanceStatus;
	}

	public void setPreventiveMaintenanceStatus(String preventiveMaintenanceStatus) {
		this.preventiveMaintenanceStatus = preventiveMaintenanceStatus;
	}

	public String getSiteConditionAfterPm() {
		return siteConditionAfterPm;
	}

	public void setSiteConditionAfterPm(String siteConditionAfterPm) {
		this.siteConditionAfterPm = siteConditionAfterPm;
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

    // Generate Getters and Setters
    
}
