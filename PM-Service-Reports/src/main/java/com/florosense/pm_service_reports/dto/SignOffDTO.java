package com.florosense.pm_service_reports.dto;


import java.time.LocalDate;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public class SignOffDTO {

    private String clientRepresentativeName;

    private String designation;

    private String clientSignature;

    private LocalDate clientDate;

    private String serviceEngineerName;

    private String serviceEngineerSignature;

    private LocalDate serviceEngineerDate;

    public SignOffDTO() {
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
}
