package com.florosense.pre_visit_report.controller;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ImageUpdateRequest 
{
	@Size(max = 500, message = "Description cannot exceed 500 characters")
    private String description;
    private Boolean isFinal;
}