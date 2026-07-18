package com.florosense.pre_visit_report.controller;

import lombok.Data;

@Data
public class ImageUpdateRequest 
{
    private String description;
    private Boolean isFinal;
}