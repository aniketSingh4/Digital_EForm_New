package com.florosense.pm_service_reports.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class PMStatusConverter implements AttributeConverter<PMStatus, String> {

    @Override
    public String convertToDatabaseColumn(PMStatus attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public PMStatus convertToEntityAttribute(String dbData) {
        return PMStatus.fromValue(dbData);
    }
}
