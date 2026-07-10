package com.florosense.pm_service_reports.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import jakarta.validation.constraints.NotBlank;

@JsonIgnoreProperties(ignoreUnknown = true)
public class ChecklistItemDTO 
{
    @NotBlank(message = "Category is required")
    private String category;  // String instead of ChecklistCategory

    @NotBlank(message = "Item name is required")
    private String itemName;

    @NotBlank(message = "Status is required")
    private String status;  // String instead of InspectionStatus

    private String remark;

    public ChecklistItemDTO() {
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public String getItemName() {
        return itemName;
    }

    public void setItemName(String itemName) {
        this.itemName = itemName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }
}