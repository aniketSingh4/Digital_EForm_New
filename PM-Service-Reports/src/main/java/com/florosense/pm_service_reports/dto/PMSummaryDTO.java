package com.florosense.pm_service_reports.dto;



import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PMSummaryDTO {

    @NotNull
    @JsonProperty("preventiveMaintenanceStatus")
    @JsonAlias({ "pmStatus" })
    private String preventiveMaintenanceStatus;

    @NotNull
    @JsonProperty("siteConditionAfterPm")
    @JsonAlias({ "siteCondition", "siteConditionAfterPM" })
    private String siteConditionAfterPm;

    @JsonProperty("siteConditionCode")
    private String siteConditionCode;

    @JsonProperty("siteConditionKey")
    private String siteConditionKey;

    public PMSummaryDTO() {
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

    public String getSiteConditionCode() {
        return siteConditionCode;
    }

    public void setSiteConditionCode(String siteConditionCode) {
        this.siteConditionCode = siteConditionCode;
    }

    public String getSiteConditionKey() {
        return siteConditionKey;
    }

    public void setSiteConditionKey(String siteConditionKey) {
        this.siteConditionKey = siteConditionKey;
    }
}
