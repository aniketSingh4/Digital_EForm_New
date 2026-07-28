package com.florosense.pre_visit_report.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteImageDTO {
    private Long id;
    
    @JsonProperty("imageUrl")
    private String imageUrl;
    
    @JsonProperty("imageName")
    private String imageName;
    
    @JsonProperty("imageType")
    private String imageType;
    
    @JsonProperty("imageSize")
    private Long imageSize;
    
    @JsonProperty("isFinal")
    private Boolean isFinal = false;
    
    @JsonProperty("description")
    private String description;
    
    @JsonProperty("uploadedAt")
    private String uploadedAt;
    
    @JsonProperty("imageData")
    private String imageData;
}