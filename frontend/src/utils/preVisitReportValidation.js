// src/utils/preVisitReportValidation.js

export const validateEmail = (email) => {
  const emailRegex = /^[A-Za-z0-9+_.-]+@(.+)$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[0-9]{10,15}$/;
  return phoneRegex.test(phone);
};

export const validateRequired = (value) => {
  return value !== null && value !== undefined && value.trim() !== '';
};

export const validatePreVisitReport = (formData) => {
  const errors = {};

  // Basic Details Validation
  if (!validateRequired(formData.visitDate)) {
    errors.visitDate = 'Visit date is required';
  }

  if (!validateRequired(formData.companyName)) {
    errors.companyName = 'Company name is required';
  }

  if (!validateRequired(formData.siteAddress)) {
    errors.siteAddress = 'Site address is required';
  }

  if (!validateRequired(formData.sitePersonName)) {
    errors.sitePersonName = 'Site person name is required';
  }

  if (!validateRequired(formData.contactNo)) {
    errors.contactNo = 'Contact number is required';
  } else if (!validatePhone(formData.contactNo)) {
    errors.contactNo = 'Please enter a valid 10-15 digit phone number';
  }

  if (!validateRequired(formData.emailId)) {
    errors.emailId = 'Email ID is required';
  } else if (!validateEmail(formData.emailId)) {
    errors.emailId = 'Please enter a valid email address';
  }

  if (!validateRequired(formData.inspectedBy)) {
    errors.inspectedBy = 'Inspected by is required';
  }

  // Checklist Validation - Status required, remark optional
  if (formData.checklist && formData.checklist.length > 0) {
    formData.checklist.forEach((item, index) => {
      if (item.status === null || item.status === undefined) {
        errors[`checklist_${index}_status`] = `Status is required for "${item.fieldName}"`;
      }
    });
  }

  // Signature Validation - Now validates text signatures
  if (!validateRequired(formData.customerName)) {
    errors.customerName = 'Customer name is required';
  }

  if (!validateRequired(formData.customerSignature)) {
    errors.customerSignature = 'Customer signature is required';
  }

  if (!validateRequired(formData.technicianName)) {
    errors.technicianName = 'Technician name is required';
  }

  if (!validateRequired(formData.technicianSignature)) {
    errors.technicianSignature = 'Technician signature is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};