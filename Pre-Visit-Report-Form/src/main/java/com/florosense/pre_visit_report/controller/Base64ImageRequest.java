package com.florosense.pre_visit_report.controller;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class Base64ImageRequest 
{
    @NotBlank(message = "Image data is required")
    private String imageData;
    
    @NotBlank(message = "Image name is required")
    private String imageName;
    
    private Boolean isFinal = false;
    
    private String description;
    
    //Helper method to check if image data is valid
    public boolean hasValidImageData() {
        return imageData != null && !imageData.isEmpty() && 
               imageData.startsWith("data:image/");
    }
    
    //Helper to extract base64 data without prefix
    public String getBase64Data() {
        if (imageData != null && imageData.contains(",")) {
            return imageData.substring(imageData.indexOf(",") + 1);
        }
        return imageData;
    }
    
    //Helper to get content type from base64 prefix
    public String getContentType() {
        if (imageData != null && imageData.startsWith("data:image/")) {
            String[] parts = imageData.split(";");
            if (parts.length > 0) {
                return parts[0].replace("data:", "");
            }
        }
        return "image/jpeg"; // Default
    }
}