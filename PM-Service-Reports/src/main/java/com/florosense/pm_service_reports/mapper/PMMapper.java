package com.florosense.pm_service_reports.mapper;


import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.Named;
import org.mapstruct.factory.Mappers;

import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;
import com.florosense.pm_service_reports.dto.SignOffDTO;
import com.florosense.pm_service_reports.entity.PMStatus;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceReport;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceSignOff;
import com.florosense.pm_service_reports.entity.SiteCondition;

@Mapper(componentModel = "spring")
public interface PMMapper 
{

    PMMapper INSTANCE = Mappers.getMapper(PMMapper.class);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "preventiveMaintenanceStatus", source = "summary.preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "summary.siteConditionAfterPm")
    @Mapping(target = "checklists", source = "checklists") //- We handle checklists manually in ServiceImpl
    @Mapping(target = "signOff", source = "signOff")
    PreventiveMaintenanceReport toEntity(PMReportRequest dto);

    @Mapping(target = "summary", expression = "java(createSummaryDTO(entity))")
    @Mapping(target = "checklists", ignore = true)
    @Mapping(target = "signOff", source = "signOff")
    @Mapping(target = "preventiveMaintenanceStatus", source = "preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "siteConditionAfterPm")
    PMReportResponse toDTO(PreventiveMaintenanceReport entity);

    // REMOVED: @Mapping(target = "id", ignore = true)
    // REMOVED: @Mapping(target = "report", ignore = true)
    // REMOVED: PreventiveMaintenanceChecklist toChecklistEntity(ChecklistItemDTO dto);

    // REMOVED: ChecklistItemDTO toChecklistDTO(PreventiveMaintenanceChecklist entity);

    // REMOVED: List<ChecklistItemDTO> toChecklistDTOList(List<PreventiveMaintenanceChecklist> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "report", ignore = true)
    PreventiveMaintenanceSignOff toSignOffEntity(SignOffDTO dto);

    SignOffDTO toSignOffDTO(PreventiveMaintenanceSignOff entity);

    @Mapping(target = "sensorId", source = "sensorId")
    @Mapping(target = "preventiveMaintenanceStatus", source = "preventiveMaintenanceStatus")
    @Mapping(target = "siteConditionAfterPm", source = "siteConditionAfterPm")
    PMReportSummaryResponse toSummaryDTO(PreventiveMaintenanceReport entity);

    // Helper methods for custom mapping
    @Named("createSummaryDTO")
    default com.florosense.pm_service_reports.dto.PMSummaryDTO createSummaryDTO(PreventiveMaintenanceReport entity) {
        if (entity == null) {
            return null;
        }
        com.florosense.pm_service_reports.dto.PMSummaryDTO summary = new com.florosense.pm_service_reports.dto.PMSummaryDTO();
        summary.setPreventiveMaintenanceStatus(entity.getPreventiveMaintenanceStatus() != null ? 
            entity.getPreventiveMaintenanceStatus().name() : null);
        summary.setSiteConditionAfterPm(entity.getSiteConditionAfterPm() != null ? 
            entity.getSiteConditionAfterPm().name() : null);
        return summary;
    }

    default PMStatus mapPMStatus(String status) {
        return PMStatus.fromValue(status);
    }

    default SiteCondition mapSiteCondition(String condition) {
        return SiteCondition.fromValue(condition);
    }

    // Enum to String conversion helpers
    default String mapPMStatusToString(PMStatus status) {
        return status != null ? status.name() : null;
    }

    default String mapSiteConditionToString(SiteCondition condition) {
        return condition != null ? condition.name() : null;
    }
}