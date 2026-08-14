package com.florosense.pm_service_reports.entity;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter(autoApply = false)
public class SiteConditionConverter implements AttributeConverter<SiteCondition, String> {

    @Override
    public String convertToDatabaseColumn(SiteCondition attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public SiteCondition convertToEntityAttribute(String dbData) {
        return SiteCondition.fromValue(dbData);
    }
}
