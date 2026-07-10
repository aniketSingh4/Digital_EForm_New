package com.florosense.pm_service_reports.serviceImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.florosense.pm_service_reports.dto.ChecklistItemDTO;
import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;
import com.florosense.pm_service_reports.entity.ChecklistCategory;
import com.florosense.pm_service_reports.entity.InspectionStatus;
import com.florosense.pm_service_reports.entity.PMStatus;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceChecklist;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceReport;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceSignOff;
import com.florosense.pm_service_reports.entity.SiteCondition;
import com.florosense.pm_service_reports.exception.DuplicateResourceException;
import com.florosense.pm_service_reports.exception.ResourceNotFoundException;
import com.florosense.pm_service_reports.mapper.PMMapper;
import com.florosense.pm_service_reports.repository.PreventiveMaintenanceReportRepository;
import com.florosense.pm_service_reports.service.PreventiveMaintenanceService;

@Service
@Transactional
public class PreventiveMaintenanceServiceImpl implements PreventiveMaintenanceService {

    private final PreventiveMaintenanceReportRepository repository;
    private final PMMapper mapper;

    public PreventiveMaintenanceServiceImpl(
            PreventiveMaintenanceReportRepository repository,
            PMMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }
    
    @Override
    public List<PMReportSummaryResponse> getAllReports() {
        List<PreventiveMaintenanceReport> reports = repository.findAll();
        return reports.stream()
            .map(mapper::toSummaryDTO)
            .collect(Collectors.toList());
    }

    // Helper method to convert String to ChecklistCategory enum
    private ChecklistCategory convertToChecklistCategory(String category) {
        if (category == null) return ChecklistCategory.PHYSICAL_INSPECTION;
        try {
            String upper = category.toUpperCase().trim();
            // Try direct match first
            for (ChecklistCategory c : ChecklistCategory.values()) {
                if (c.name().equals(upper)) {
                    return c;
                }
            }
            // Handle common variations
            if (upper.contains("PHYSICAL")) return ChecklistCategory.PHYSICAL_INSPECTION;
            if (upper.contains("POWER")) return ChecklistCategory.POWER_SUPPLY;
            if (upper.contains("SENSOR")) return ChecklistCategory.SENSOR_HEALTH;
            if (upper.contains("COMMUNICATION")) return ChecklistCategory.COMMUNICATION;
            if (upper.contains("CALIBRATION")) return ChecklistCategory.CALIBRATION_PERFORMANCE_VERIFICATION;
            if (upper.contains("CLEANING")) return ChecklistCategory.CLEANING_ACTIVITY;
            return ChecklistCategory.valueOf(upper);
        } catch (IllegalArgumentException e) {
            System.out.println("⚠️ Invalid category: " + category + ", defaulting to PHYSICAL_INSPECTION");
            return ChecklistCategory.PHYSICAL_INSPECTION;
        }
    }

    // Helper method to convert String to InspectionStatus enum
    private InspectionStatus convertToInspectionStatus(String status) {
        if (status == null) return InspectionStatus.NO;
        try {
            String upper = status.toUpperCase().trim();
            // Try direct match first
            for (InspectionStatus s : InspectionStatus.values()) {
                if (s.name().equals(upper)) {
                    return s;
                }
            }
            // Handle common variations
            if ("Y".equals(upper) || "TRUE".equals(upper) || "1".equals(upper) || 
                "OK".equals(upper) || "PASS".equals(upper) || "GOOD".equals(upper)) {
                return InspectionStatus.YES;
            }
            if ("N".equals(upper) || "FALSE".equals(upper) || "0".equals(upper) || 
                "FAIL".equals(upper) || "BAD".equals(upper)) {
                return InspectionStatus.NO;
            }
            return InspectionStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            System.out.println("⚠️ Invalid status: " + status + ", defaulting to NO");
            return InspectionStatus.NO;
        }
    }

    // Helper method to convert String to PMStatus enum
    private PMStatus convertToPMStatus(String status) {
        if (status == null) return PMStatus.FOLLOW_UP_VISIT_REQUIRED;
        try {
            String upper = status.toUpperCase().trim();
            // Handle common variations
            if (upper.contains("SATISFACTORY")) return PMStatus.SATISFACTORY;
            if (upper.contains("FOLLOW_UP") || upper.contains("FOLLOWUP")) return PMStatus.FOLLOW_UP_VISIT_REQUIRED;
            if (upper.contains("REQUIRES") || upper.contains("ATTENTION")) return PMStatus.REQUIRES_ATTENTION;
            //if (upper.contains("COMPLETED")) return PMStatus.COMPLETED;
            //if (upper.contains("IN_PROGRESS")) return PMStatus.IN_PROGRESS;
            return PMStatus.valueOf(upper);
        } catch (IllegalArgumentException e) {
            System.out.println("⚠️ Invalid PM Status: " + status + ", defaulting to PENDING");
            return PMStatus.FOLLOW_UP_VISIT_REQUIRED;
        }
    }

    // Helper method to convert String to SiteCondition enum
    private SiteCondition convertToSiteCondition(String condition) {
        if (condition == null) return SiteCondition.SYSTEM_OPERATIONAL;
        try {
            String upper = condition.toUpperCase().trim().replace(" ", "_");
            // Handle common variations
            if (upper.contains("SYSTEM_OPERATIONAL") || upper.contains("OPERATIONAL") && !upper.contains("NOT")) {
                return SiteCondition.SYSTEM_OPERATIONAL;
            }
            if (upper.contains("SYSTEM_NOT_OPERATIONAL") || upper.contains("NOT_OPERATIONAL")) {
                return SiteCondition.SYSTEM_NOT_OPERATIONAL;
            }
            if (upper.contains("WITH_ISSUES") || upper.contains("OBSERVATION")) {
                return SiteCondition.SYSTEM_OPERATIONAL_WITH_OBSERVATION;
            }
            return SiteCondition.valueOf(upper);
        } catch (IllegalArgumentException e) {
            System.out.println("⚠️ Invalid Site Condition: " + condition + ", defaulting to SYSTEM_OPERATIONAL");
            return SiteCondition.SYSTEM_OPERATIONAL;
        }
    }


    @Override
    public PMReportResponse saveReport(PMReportRequest request) {
        System.out.println("========================================");
        System.out.println("📝 Saving report: " + request.getServiceReportNo());
        System.out.println("📊 Checklists received: " + (request.getChecklists() != null ? request.getChecklists().size() : 0));
        System.out.println("📋 Summary received: " + (request.getSummary() != null ? "Yes" : "No"));

        // Debug: Print summary details
        if (request.getSummary() != null) {
            System.out.println("  📊 PM Status: " + request.getSummary().getPreventiveMaintenanceStatus());
            System.out.println("  📊 Site Condition: " + request.getSummary().getSiteConditionAfterPm());
        }

        // Debug: Print checklists details
        if (request.getChecklists() != null && !request.getChecklists().isEmpty()) {
            for (ChecklistItemDTO cl : request.getChecklists()) {
                System.out.println("  📋 Checklist: " + cl.getItemName() + 
                                 " | Category: " + cl.getCategory() + 
                                 " | Status: " + cl.getStatus() + 
                                 " | Remark: " + cl.getRemark());
            }
        } else {
            System.out.println("⚠️ No checklists in request!");
        }

        if (request.getPmVisitDate() == null) {
            throw new IllegalArgumentException("PM Visit Date is required");
        }

        if (repository.existsByServiceReportNo(request.getServiceReportNo())) {
            throw new DuplicateResourceException("Service Report Number already exists: " + request.getServiceReportNo());
        }

        // Create entity manually for better control
        PreventiveMaintenanceReport report = new PreventiveMaintenanceReport();
        
        // Set basic fields
        report.setServiceReportNo(request.getServiceReportNo());
        report.setServiceVisitNo(request.getServiceVisitNo());
        report.setClientName(request.getClientName());
        report.setSiteName(request.getSiteName());
        report.setSensorId(request.getSensorId());
        report.setPmVisitDate(request.getPmVisitDate());
        report.setEngineerName(request.getEngineerName());
        report.setObservation(request.getObservation());
        report.setRecommendation(request.getRecommendation());

        // ========================================
        // ✅ SET PM STATUS AND SITE CONDITION FROM SUMMARY
        // ========================================
        if (request.getSummary() != null) {
            // Convert String to PMStatus enum
            if (request.getSummary().getPreventiveMaintenanceStatus() != null) {
                try {
                    String statusStr = request.getSummary().getPreventiveMaintenanceStatus().toUpperCase().trim();
                    // Handle common variations
                    if (statusStr.contains("SATISFACTORY")) {
                        report.setPreventiveMaintenanceStatus(PMStatus.SATISFACTORY);
                    } else if (statusStr.contains("FOLLOW_UP") || statusStr.contains("FOLLOWUP")) {
                        report.setPreventiveMaintenanceStatus(PMStatus.FOLLOW_UP_VISIT_REQUIRED);
                    } else if (statusStr.contains("REQUIRES") || statusStr.contains("ATTENTION")) {
                        report.setPreventiveMaintenanceStatus(PMStatus.REQUIRES_ATTENTION);
                    } else if (statusStr.contains("COMPLETED")) {
                        report.setPreventiveMaintenanceStatus(PMStatus.SATISFACTORY);
                    } else if (statusStr.contains("IN_PROGRESS")) {
                        report.setPreventiveMaintenanceStatus(PMStatus.REQUIRES_ATTENTION);
                    } else {
                        report.setPreventiveMaintenanceStatus(PMStatus.valueOf(statusStr));
                    }
                    System.out.println("  ✅ Set PM Status: " + report.getPreventiveMaintenanceStatus());
                } catch (IllegalArgumentException e) {
                    System.out.println("  ⚠️ Invalid PM Status: " + request.getSummary().getPreventiveMaintenanceStatus() + ", defaulting to PENDING");
                    report.setPreventiveMaintenanceStatus(PMStatus.FOLLOW_UP_VISIT_REQUIRED);
                }
            } else {
                report.setPreventiveMaintenanceStatus(PMStatus.FOLLOW_UP_VISIT_REQUIRED);
                System.out.println("  ⚠️ No PM Status provided, defaulting to PENDING");
            }

            // Convert String to SiteCondition enum
            if (request.getSummary().getSiteConditionAfterPm() != null) {
                try {
                    String conditionStr = request.getSummary().getSiteConditionAfterPm().toUpperCase().trim().replace(" ", "_");
                    // Handle common variations
                    if (conditionStr.contains("SYSTEM_OPERATIONAL") || conditionStr.contains("OPERATIONAL")) {
                        report.setSiteConditionAfterPm(SiteCondition.SYSTEM_OPERATIONAL);
                    } else if (conditionStr.contains("SYSTEM_NOT_OPERATIONAL") || conditionStr.contains("NOT_OPERATIONAL")) {
                        report.setSiteConditionAfterPm(SiteCondition.SYSTEM_NOT_OPERATIONAL);
                    } else if (conditionStr.contains("WITH_ISSUES") || conditionStr.contains("OBSERVATION")) {
                        report.setSiteConditionAfterPm(SiteCondition.SYSTEM_OPERATIONAL_WITH_OBSERVATION);
                    } else {
                        report.setSiteConditionAfterPm(SiteCondition.valueOf(conditionStr));
                    }
                    System.out.println("  ✅ Set Site Condition: " + report.getSiteConditionAfterPm());
                } catch (IllegalArgumentException e) {
                    System.out.println("  ⚠️ Invalid Site Condition: " + request.getSummary().getSiteConditionAfterPm() + ", defaulting to SYSTEM_OPERATIONAL");
                    report.setSiteConditionAfterPm(SiteCondition.SYSTEM_OPERATIONAL);
                }
            } else {
                report.setSiteConditionAfterPm(SiteCondition.SYSTEM_OPERATIONAL);
                System.out.println("  ⚠️ No Site Condition provided, defaulting to SYSTEM_OPERATIONAL");
            }
        } else {
            System.out.println("⚠️ No summary object in request, setting default values");
            report.setPreventiveMaintenanceStatus(PMStatus.FOLLOW_UP_VISIT_REQUIRED);
            report.setSiteConditionAfterPm(SiteCondition.SYSTEM_OPERATIONAL);
        }

        // ========================================
        // CONVERT CHECKLISTS
        // ========================================
        List<PreventiveMaintenanceChecklist> checklistList = new ArrayList<>();
        
        if (request.getChecklists() != null && !request.getChecklists().isEmpty()) {
            for (ChecklistItemDTO dto : request.getChecklists()) {
                // Skip if item name is empty
                if (dto.getItemName() == null || dto.getItemName().trim().isEmpty()) {
                    System.out.println("⚠️ Skipping checklist item with empty name");
                    continue;
                }
                
                PreventiveMaintenanceChecklist entity = new PreventiveMaintenanceChecklist();
                
                // Convert String to ChecklistCategory enum
                ChecklistCategory category = convertToChecklistCategory(dto.getCategory());
                entity.setCategory(category);
                
                entity.setItemName(dto.getItemName());
                
                // Convert String to InspectionStatus enum
                InspectionStatus status = convertToInspectionStatus(dto.getStatus());
                entity.setStatus(status);
                
                entity.setRemark(dto.getRemark());
                entity.setReport(report); // Set the relationship
                
                checklistList.add(entity);
            }
            
            report.setChecklists(checklistList);
            System.out.println("✅ Added " + checklistList.size() + " checklists to report");
        } else {
            System.out.println("⚠️ No checklists to add");
            report.setChecklists(new ArrayList<>());
        }

        // ========================================
        // SET SIGN OFF
        // ========================================
        if (request.getSignOff() != null) {
            PreventiveMaintenanceSignOff signOff = new PreventiveMaintenanceSignOff();
            signOff.setServiceEngineerName(request.getSignOff().getServiceEngineerName());
            signOff.setServiceEngineerSignature(request.getSignOff().getServiceEngineerSignature());
            signOff.setServiceEngineerDate(request.getSignOff().getServiceEngineerDate());
            signOff.setClientRepresentativeName(request.getSignOff().getClientRepresentativeName());
            signOff.setDesignation(request.getSignOff().getDesignation());
            signOff.setClientSignature(request.getSignOff().getClientSignature());
            signOff.setClientDate(request.getSignOff().getClientDate());
            signOff.setReport(report);
            report.setSignOff(signOff);
            System.out.println("✅ Added sign-off for: " + request.getSignOff().getClientRepresentativeName());
        }

        System.out.println("💾 Saving report with " + report.getChecklists().size() + " checklists...");
        System.out.println("📊 Final PM Status: " + report.getPreventiveMaintenanceStatus());
        System.out.println("📊 Final Site Condition: " + report.getSiteConditionAfterPm());
        
        PreventiveMaintenanceReport savedReport = repository.save(report);
        
        System.out.println("✅ Report saved with ID: " + savedReport.getId());
        System.out.println("📊 Checklists saved: " + (savedReport.getChecklists() != null ? savedReport.getChecklists().size() : 0));
        System.out.println("📊 PM Status saved: " + savedReport.getPreventiveMaintenanceStatus());
        System.out.println("📊 Site Condition saved: " + savedReport.getSiteConditionAfterPm());
        System.out.println("========================================");

        return mapper.toDTO(savedReport);
    }

    @Override
    public PMReportResponse getReport(Long id) {
        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));
        return mapper.toDTO(report);
    }

    @Override
    @Transactional
    public PMReportResponse updateReport(
            Long id,
            PMReportRequest request) 
    {
        System.out.println("📝 Updating report ID: " + id);
        System.out.println("📊 Checklists received: " + (request.getChecklists() != null ? request.getChecklists().size() : 0));

        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));

        // Update basic fields
        report.setClientName(request.getClientName());
        report.setSiteName(request.getSiteName());
        report.setSensorId(request.getSensorId());
        report.setEngineerName(request.getEngineerName());
        report.setObservation(request.getObservation());
        report.setRecommendation(request.getRecommendation());
        report.setPmVisitDate(request.getPmVisitDate());
        
        // Update Status Enums
        if (request.getSummary() != null) {
            report.setPreventiveMaintenanceStatus(
                convertToPMStatus(request.getSummary().getPreventiveMaintenanceStatus())
            );
            report.setSiteConditionAfterPm(
                convertToSiteCondition(request.getSummary().getSiteConditionAfterPm())
            );
        }

        // Update checklists - Manually convert
        if (request.getChecklists() != null) {
            report.getChecklists().clear();
            
            List<PreventiveMaintenanceChecklist> checklistList = new ArrayList<>();
            
            for (ChecklistItemDTO dto : request.getChecklists()) {
                if (dto.getItemName() == null || dto.getItemName().trim().isEmpty()) {
                    continue;
                }
                
                PreventiveMaintenanceChecklist entity = new PreventiveMaintenanceChecklist();
                
                entity.setCategory(convertToChecklistCategory(dto.getCategory()));
                entity.setItemName(dto.getItemName());
                entity.setStatus(convertToInspectionStatus(dto.getStatus()));
                entity.setRemark(dto.getRemark());
                entity.setReport(report);
                
                checklistList.add(entity);
            }
            
            report.getChecklists().addAll(checklistList);
            System.out.println("✅ Updated " + checklistList.size() + " checklists");
        }

        // Update sign off
        if (request.getSignOff() != null) {
            PreventiveMaintenanceSignOff signOff = new PreventiveMaintenanceSignOff();
            signOff.setServiceEngineerName(request.getSignOff().getServiceEngineerName());
            signOff.setServiceEngineerSignature(request.getSignOff().getServiceEngineerSignature());
            signOff.setServiceEngineerDate(request.getSignOff().getServiceEngineerDate());
            signOff.setClientRepresentativeName(request.getSignOff().getClientRepresentativeName());
            signOff.setDesignation(request.getSignOff().getDesignation());
            signOff.setClientSignature(request.getSignOff().getClientSignature());
            signOff.setClientDate(request.getSignOff().getClientDate());
            signOff.setReport(report);
            report.setSignOff(signOff);
        }

        PreventiveMaintenanceReport updatedReport = repository.save(report);
        System.out.println("✅ Report updated with ID: " + updatedReport.getId());
        
        return mapper.toDTO(updatedReport);
    }

    @Override
    public void deleteReport(Long id) {
        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));
        repository.delete(report);
        System.out.println("🗑️ Report deleted with ID: " + id);
    }
}