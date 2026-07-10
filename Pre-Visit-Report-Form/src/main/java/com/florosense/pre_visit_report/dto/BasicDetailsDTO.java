package com.florosense.pre_visit_report.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.time.LocalDate;


public class BasicDetailsDTO 
{

    @NotNull(message = "Report date is required")
    private LocalDate reportDate;

    @NotBlank(message = "Company name is required")
    private String companyName;

    @NotBlank(message = "Site address is required")
    private String siteAddress;

    @NotBlank(message = "Site person name is required")
    private String sitePersonName;

    @NotBlank(message = "Contact number is required")
    @Pattern(regexp = "^[0-9]{10,15}$", message = "Invalid contact number")
    private String contactNo;

    @NotBlank(message = "Email ID is required")
    @Email(message = "Invalid email format")
    private String emailId;

    @NotBlank(message = "Inspected by is required")
    private String inspectedBy;

	public LocalDate getReportDate() {
		return reportDate;
	}

	public void setReportDate(LocalDate reportDate) {
		this.reportDate = reportDate;
	}

	public String getCompanyName() {
		return companyName;
	}

	public void setCompanyName(String companyName) {
		this.companyName = companyName;
	}

	public String getSiteAddress() {
		return siteAddress;
	}

	public void setSiteAddress(String siteAddress) {
		this.siteAddress = siteAddress;
	}

	public String getSitePersonName() {
		return sitePersonName;
	}

	public void setSitePersonName(String sitePersonName) {
		this.sitePersonName = sitePersonName;
	}

	public String getContactNo() {
		return contactNo;
	}

	public void setContactNo(String contactNo) {
		this.contactNo = contactNo;
	}

	public String getEmailId() {
		return emailId;
	}

	public void setEmailId(String emailId) {
		this.emailId = emailId;
	}

	public String getInspectedBy() {
		return inspectedBy;
	}

	public void setInspectedBy(String inspectedBy) {
		this.inspectedBy = inspectedBy;
	}

	public BasicDetailsDTO(@NotNull(message = "Report date is required") LocalDate reportDate,
			@NotBlank(message = "Company name is required") String companyName,
			@NotBlank(message = "Site address is required") String siteAddress,
			@NotBlank(message = "Site person name is required") String sitePersonName,
			@NotBlank(message = "Contact number is required") @Pattern(regexp = "^[0-9]{10,15}$", message = "Invalid contact number") String contactNo,
			@NotBlank(message = "Email ID is required") @Email(message = "Invalid email format") String emailId,
			@NotBlank(message = "Inspected by is required") String inspectedBy) {
		super();
		this.reportDate = reportDate;
		this.companyName = companyName;
		this.siteAddress = siteAddress;
		this.sitePersonName = sitePersonName;
		this.contactNo = contactNo;
		this.emailId = emailId;
		this.inspectedBy = inspectedBy;
	}

	public BasicDetailsDTO() {
		super();
		// TODO Auto-generated constructor stub
	}   
}
