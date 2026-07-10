package com.florosense.pre_visit_report.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;


public class SignatureDTO {

    @NotBlank(message = "Customer name is required")
    private String customerName;

    @NotBlank(message = "Customer signature is required")
    private String customerSignature;

    @NotBlank(message = "Technician name is required")
    private String technicianName;

    @NotBlank(message = "Technician signature is required")
    private String technicianSignature;

    private LocalDate signatureDate;

	public String getCustomerName() {
		return customerName;
	}

	public void setCustomerName(String customerName) {
		this.customerName = customerName;
	}

	public String getCustomerSignature() {
		return customerSignature;
	}

	public void setCustomerSignature(String customerSignature) {
		this.customerSignature = customerSignature;
	}

	public String getTechnicianName() {
		return technicianName;
	}

	public void setTechnicianName(String technicianName) {
		this.technicianName = technicianName;
	}

	public String getTechnicianSignature() {
		return technicianSignature;
	}

	public void setTechnicianSignature(String technicianSignature) {
		this.technicianSignature = technicianSignature;
	}

	public LocalDate getSignatureDate() {
		return signatureDate;
	}

	public void setSignatureDate(LocalDate signatureDate) {
		this.signatureDate = signatureDate;
	}

	public SignatureDTO(@NotBlank(message = "Customer name is required") String customerName,
			@NotBlank(message = "Customer signature is required") String customerSignature,
			@NotBlank(message = "Technician name is required") String technicianName,
			@NotBlank(message = "Technician signature is required") String technicianSignature,
			LocalDate signatureDate) {
		super();
		this.customerName = customerName;
		this.customerSignature = customerSignature;
		this.technicianName = technicianName;
		this.technicianSignature = technicianSignature;
		this.signatureDate = signatureDate;
	}

	public SignatureDTO() {
		super();
		// TODO Auto-generated constructor stub
	}
    
    
    
}