package com.florosense.pre_visit_report.dto;

public class StatusDetailsDTO 
{
    private String fieldName;
    private Boolean status;
    private String remark;
    private String displayName;
	public String getFieldName() {
		return fieldName;
	}
	public void setFieldName(String fieldName) {
		this.fieldName = fieldName;
	}
	public Boolean getStatus() {
		return status;
	}
	public void setStatus(Boolean status) {
		this.status = status;
	}
	public String getRemark() {
		return remark;
	}
	public void setRemark(String remark) {
		this.remark = remark;
	}
	public String getDisplayName() {
		return displayName;
	}
	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}
	public StatusDetailsDTO(String fieldName, Boolean status, String remark, String displayName) {
		super();
		this.fieldName = fieldName;
		this.status = status;
		this.remark = remark;
		this.displayName = displayName;
	}
	public StatusDetailsDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
    
    
}
