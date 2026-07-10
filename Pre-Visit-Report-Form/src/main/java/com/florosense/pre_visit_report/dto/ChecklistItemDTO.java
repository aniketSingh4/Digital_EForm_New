package com.florosense.pre_visit_report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChecklistItemDTO {
    @JsonProperty("fieldName")
    private String fieldName;
    
    @JsonProperty("status")
    private Boolean status;
    
    @JsonProperty("remark")
    private String remark;
    
    @JsonProperty("displayName")
    private String displayName;
}