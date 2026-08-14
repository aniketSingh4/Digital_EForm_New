package com.florosense.pm_service_reports.dto;

import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonProperty;

public class PMReportSummaryResponse 
{

    private Long id;

    private String serviceReportNo;

    private String clientName;

    private String siteName;

    private String engineerName;

    private LocalDate pmVisitDate;
    
    private String sensorId;


	@JsonProperty("preventiveMaintenanceStatus")
	@JsonAlias({ "pmStatus" })
	private String preventiveMaintenanceStatus;

	@JsonProperty("siteConditionAfterPm")
	@JsonAlias({ "siteCondition", "siteConditionAfterPM" })
	private String siteConditionAfterPm;
	
	public String getSensorId() {
		return sensorId;
	}

	public void setSensorId(String sensorId) {
		this.sensorId = sensorId;
	}

    public PMReportSummaryResponse() {
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

    public String getEngineerName() {
        return engineerName;
    }

    public void setEngineerName(String engineerName) {
        this.engineerName = engineerName;
    }

    public LocalDate getPmVisitDate() {
        return pmVisitDate;
    }

    public void setPmVisitDate(LocalDate pmVisitDate) {
        this.pmVisitDate = pmVisitDate;
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

}