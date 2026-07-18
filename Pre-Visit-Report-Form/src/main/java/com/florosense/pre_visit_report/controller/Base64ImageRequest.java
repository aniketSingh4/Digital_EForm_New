package com.florosense.pre_visit_report.controller;

import lombok.Data;

@Data
public class Base64ImageRequest 
{
    private String imageData;
    private String imageName;
    private Boolean isFinal;
    private String description;
}