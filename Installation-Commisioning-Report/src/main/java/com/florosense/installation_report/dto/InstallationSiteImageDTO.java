package com.florosense.installation_report.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InstallationSiteImageDTO 
{
    private Long id;
    private String imageData;
    private String imageUrl;
    private String imageName;
    private String imageType;
    private Long imageSize;
    private Boolean isFinal;
    private String description;
    private String uploadedAt;
}