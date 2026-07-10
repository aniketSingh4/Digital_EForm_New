package com.florosense.pre_visit_report.util;

import com.florosense.pre_visit_report.dto.BasicDetailsDTO;
import com.florosense.pre_visit_report.dto.SignatureDTO;

public class ValidationUtil {

    public static void validateBasicDetails(BasicDetailsDTO basic) 
    {
        if (basic == null) {
            throw new IllegalArgumentException("Basic details are required");
        }
        // Additional custom validation if needed
    }

    public static void validateSignature(SignatureDTO signature) 
    {
        if (signature == null) {
            throw new IllegalArgumentException("Signature details are required");
        }
        if (signature.getCustomerSignature() == null || signature.getCustomerSignature().isEmpty()) {
            throw new IllegalArgumentException("Customer signature is required");
        }
        if (signature.getTechnicianSignature() == null || signature.getTechnicianSignature().isEmpty()) {
            throw new IllegalArgumentException("Technician signature is required");
        }
    }
}