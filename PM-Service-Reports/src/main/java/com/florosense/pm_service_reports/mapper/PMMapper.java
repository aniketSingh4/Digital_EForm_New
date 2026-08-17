package com.florosense.pm_service_reports.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;
import com.florosense.pm_service_reports.dto.SignOffDTO;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceReport;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceSignOff;

@Mapper(componentModel = "spring")
public interface PMMapper 
{

    PMMapper INSTANCE = Mappers.getMapper(PMMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "preventiveMaintenanceStatus", source = "summary.preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "summary.siteConditionAfterPm")
    @Mapping(target = "siteConditionKey", source = "siteConditionKey")
    @Mapping(target = "checklists", source = "checklists") //- We handle checklists manually in ServiceImpl
    @Mapping(target = "signOff", source = "signOff")
    PreventiveMaintenanceReport toEntity(PMReportRequest dto);

    @Mapping(target = "summary", expression = "java(createSummaryDTO(entity))")
    @Mapping(target = "checklists", ignore = true)
    @Mapping(target = "signOff", source = "signOff")
    @Mapping(target = "preventiveMaintenanceStatus", source = "preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "siteConditionAfterPm")
    PMReportResponse toDTO(PreventiveMaintenanceReport entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "report", ignore = true)
    PreventiveMaintenanceSignOff toSignOffEntity(SignOffDTO dto);

    SignOffDTO toSignOffDTO(PreventiveMaintenanceSignOff entity);

    @Mapping(target = "sensorId", source = "sensorId")
    @Mapping(target = "preventiveMaintenanceStatus", source = "preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "siteConditionAfterPm")
    PMReportSummaryResponse toSummaryDTO(PreventiveMaintenanceReport entity);

    @Named("createSummaryDTO")
    default com.florosense.pm_service_reports.dto.PMSummaryDTO createSummaryDTO(PreventiveMaintenanceReport entity) {
        if (entity == null) {
            return null;
        }
        com.florosense.pm_service_reports.dto.PMSummaryDTO summary = new com.florosense.pm_service_reports.dto.PMSummaryDTO();
        summary.setPreventiveMaintenanceStatus(entity.getPreventiveMaintenanceStatus());
        summary.setSiteConditionAfterPm(entity.getSiteConditionAfterPm());
        summary.setSiteConditionKey(entity.getSiteConditionKey());
        return summary;
    }
}
