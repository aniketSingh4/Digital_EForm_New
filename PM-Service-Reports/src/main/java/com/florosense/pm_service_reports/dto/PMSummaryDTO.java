package com.florosense.pm_service_reports.dto;



import com.fasterxml.jackson.annotation.JsonAlias;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotNull;

@JsonIgnoreProperties(ignoreUnknown = true)
public class PMSummaryDTO {

    @NotNull
    @JsonAlias({ "pmStatus", "preventiveMaintenanceStatus" })
    private String preventiveMaintenanceStatus;

    @NotNull
    @JsonAlias({ "siteCondition", "siteConditionAfterPm" })
    private String siteConditionAfterPm;

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
}
