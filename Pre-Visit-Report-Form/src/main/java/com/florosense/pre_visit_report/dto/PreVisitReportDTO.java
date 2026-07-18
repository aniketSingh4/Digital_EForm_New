package com.florosense.pre_visit_report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PreVisitReportDTO {
    private Long id;
    
    @JsonProperty("visitDate")
    private LocalDate visitDate;
    
    @JsonProperty("companyName")
    private String companyName;
    
    @JsonProperty("siteAddress")
    private String siteAddress;
    
    @JsonProperty("sitePersonName")
    private String sitePersonName;
    
    @JsonProperty("contactNo")
    private String contactNo;
    
    @JsonProperty("emailId")  // Changed from email to emailId
    private String emailId;
    
    @JsonProperty("inspectedBy")
    private String inspectedBy;
    
    @JsonProperty("notedIfAny")
    private String notedIfAny;
    
    @JsonProperty("customerName")
    private String customerName;
    
    @JsonProperty("customerSignature")
    private String customerSignature;
    
    @JsonProperty("technicianName")
    private String technicianName;
    
    @JsonProperty("technicianSignature")
    private String technicianSignature;
    
    @JsonProperty("checklist")
    private List<ChecklistItemDTO> checklist;
    
    // ✅ NEW: Site images
    @JsonProperty("siteImages")
    private List<SiteImageDTO> siteImages;
    
    private LocalDate createdAt;
    private LocalDate updatedAt;
}