package com.florosense.pm_service_reports.serviceImpl;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
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
    @Cacheable(value = "pmReportList", key = "'all'")
    public List<PMReportSummaryResponse> getAllReports() {
        List<PreventiveMaintenanceReport> reports = repository.findAll();
        return reports.stream()
            .map(mapper::toSummaryDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = "pmReportCount", key = "'count'")
    public long getReportCount() {
        return repository.count();
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
        if (status == null || status.isBlank()) {
            return null;
        }
        return PMStatus.fromValue(status);
    }

    // Helper method to convert String to SiteCondition enum
    private SiteCondition convertToSiteCondition(String condition) {
        if (condition == null || condition.isBlank()) {
            return null;
        }
        return SiteCondition.fromValue(condition);
    }


    @Override
    @CacheEvict(value = {"pmReportList", "pmReportCount", "pmReportById"}, allEntries = true)
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
            if (request.getSummary().getPreventiveMaintenanceStatus() != null
                    && !request.getSummary().getPreventiveMaintenanceStatus().isBlank()) {
                PMStatus status = convertToPMStatus(request.getSummary().getPreventiveMaintenanceStatus());
                if (status != null) {
                    report.setPreventiveMaintenanceStatus(status);
                    System.out.println("  ✅ Set PM Status: " + report.getPreventiveMaintenanceStatus());
                }
            }
            if (request.getSummary().getSiteConditionAfterPm() != null
                    && !request.getSummary().getSiteConditionAfterPm().isBlank()) {
                SiteCondition condition = convertToSiteCondition(request.getSummary().getSiteConditionAfterPm());
                if (condition != null) {
                    report.setSiteConditionAfterPm(condition);
                    System.out.println("  ✅ Set Site Condition: " + report.getSiteConditionAfterPm());
                }
            }
        } else {
            System.out.println("⚠️ No summary object in request");
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

        try {
            return toResponse(savedReport);
        } catch (Exception mappingError) {
            System.err.println("Report saved but response mapping failed: " + mappingError.getMessage());
            return toMinimalResponse(savedReport);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "pmReportById", key = "#id")
    public PMReportResponse getReport(Long id) {
        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));
        return toResponse(report);
    }

    @Override
    @Transactional(readOnly = true)
    public PMReportResponse getReportByServiceReportNo(String serviceReportNo) {
        PreventiveMaintenanceReport report = repository.findByServiceReportNo(serviceReportNo)
                .orElseThrow(() -> new ResourceNotFoundException("PM Report not found."));
        try {
            return toResponse(report);
        } catch (Exception mappingError) {
            return toMinimalResponse(report);
        }
    }

    private PMReportResponse toResponse(PreventiveMaintenanceReport report) {
        PMReportResponse response = mapper.toDTO(report);
        response.setChecklists(toChecklistDtos(report.getChecklists()));
        if (response.getSummary() == null) {
            response.setSummary(mapper.createSummaryDTO(report));
        }
        if (response.getPreventiveMaintenanceStatus() == null && report.getPreventiveMaintenanceStatus() != null) {
            response.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus().name());
        }
        if (response.getSiteConditionAfterPm() == null && report.getSiteConditionAfterPm() != null) {
            response.setSiteConditionAfterPm(report.getSiteConditionAfterPm().name());
        }
        return response;
    }

    private List<ChecklistItemDTO> toChecklistDtos(List<PreventiveMaintenanceChecklist> checklists) {
        if (checklists == null || checklists.isEmpty()) {
            return new ArrayList<>();
        }
        List<ChecklistItemDTO> items = new ArrayList<>();
        for (PreventiveMaintenanceChecklist item : checklists) {
            ChecklistItemDTO dto = new ChecklistItemDTO();
            dto.setCategory(item.getCategory() != null ? item.getCategory().name() : null);
            dto.setItemName(item.getItemName());
            dto.setStatus(item.getStatus() != null ? item.getStatus().name() : null);
            dto.setRemark(item.getRemark());
            items.add(dto);
        }
        return items;
    }

    private PMReportResponse toMinimalResponse(PreventiveMaintenanceReport report) {
        PMReportResponse response = new PMReportResponse();
        response.setId(report.getId());
        response.setServiceReportNo(report.getServiceReportNo());
        response.setServiceVisitNo(report.getServiceVisitNo());
        response.setClientName(report.getClientName());
        response.setSiteName(report.getSiteName());
        response.setSensorId(report.getSensorId());
        response.setPmVisitDate(report.getPmVisitDate());
        response.setEngineerName(report.getEngineerName());
        response.setObservation(report.getObservation());
        response.setRecommendation(report.getRecommendation());
        response.setCreatedAt(report.getCreatedAt());
        if (report.getPreventiveMaintenanceStatus() != null) {
            response.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus().name());
        }
        if (report.getSiteConditionAfterPm() != null) {
            response.setSiteConditionAfterPm(report.getSiteConditionAfterPm().name());
        }
        response.setSummary(mapper.createSummaryDTO(report));
        response.setChecklists(toChecklistDtos(report.getChecklists()));
        return response;
    }

 // In your Controller or Service, update the update method to skip validation for immutable fields

    @Override
    @Transactional
    @CacheEvict(value = {"pmReportList", "pmReportCount", "pmReportById"}, allEntries = true)
    public PMReportResponse updateReport(
            Long id,
            PMReportRequest request) 
    {
        System.out.println("📝 Updating report ID: " + id);
        
        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));

        // 🔒 Store original immutable values
        String originalServiceReportNo = report.getServiceReportNo();
        String originalServiceVisitNo = report.getServiceVisitNo();
        String originalSensorId = report.getSensorId();
        
        System.out.println("🔒 Immutable fields preserved:");
        System.out.println("   - ServiceReportNo: " + originalServiceReportNo);
        System.out.println("   - ServiceVisitNo: " + originalServiceVisitNo);
        System.out.println("   - SensorId: " + originalSensorId);

        // ✅ Update ONLY editable fields
        // ❌ DO NOT update: serviceReportNo, serviceVisitNo, sensorId
        if (request.getClientName() != null) {
            report.setClientName(request.getClientName());
        }
        if (request.getSiteName() != null) {
            report.setSiteName(request.getSiteName());
        }
        if (request.getEngineerName() != null) {
            report.setEngineerName(request.getEngineerName());
        }
        if (request.getObservation() != null) {
            report.setObservation(request.getObservation());
        }
        if (request.getRecommendation() != null) {
            report.setRecommendation(request.getRecommendation());
        }
        if (request.getPmVisitDate() != null) {
            report.setPmVisitDate(request.getPmVisitDate());
        }
        
        // Update Status Enums if present
        if (request.getSummary() != null) {
            if (request.getSummary().getPreventiveMaintenanceStatus() != null
                    && !request.getSummary().getPreventiveMaintenanceStatus().isBlank()) {
                PMStatus status = convertToPMStatus(request.getSummary().getPreventiveMaintenanceStatus());
                if (status != null) {
                    report.setPreventiveMaintenanceStatus(status);
                }
            }
            if (request.getSummary().getSiteConditionAfterPm() != null
                    && !request.getSummary().getSiteConditionAfterPm().isBlank()) {
                SiteCondition condition = convertToSiteCondition(request.getSummary().getSiteConditionAfterPm());
                if (condition != null) {
                    report.setSiteConditionAfterPm(condition);
                }
            }
        }

        // Update checklists
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
        }

        // Update sign off
        if (request.getSignOff() != null) {
            PreventiveMaintenanceSignOff signOff = report.getSignOff();
            if (signOff == null) {
                signOff = new PreventiveMaintenanceSignOff();
                signOff.setReport(report);
            }
            signOff.setServiceEngineerName(request.getSignOff().getServiceEngineerName());
            signOff.setServiceEngineerSignature(request.getSignOff().getServiceEngineerSignature());
            signOff.setServiceEngineerDate(request.getSignOff().getServiceEngineerDate());
            signOff.setClientRepresentativeName(request.getSignOff().getClientRepresentativeName());
            signOff.setDesignation(request.getSignOff().getDesignation());
            signOff.setClientSignature(request.getSignOff().getClientSignature());
            signOff.setClientDate(request.getSignOff().getClientDate());
            report.setSignOff(signOff);
        }

        PreventiveMaintenanceReport updatedReport = repository.save(report);
        
        // Verify immutable fields were not changed
        System.out.println("✅ Update successful:");
        System.out.println("   - ID: " + updatedReport.getId());
        System.out.println("   - ServiceReportNo: " + updatedReport.getServiceReportNo() + " (unchanged)");
        System.out.println("   - ServiceVisitNo: " + updatedReport.getServiceVisitNo() + " (unchanged)");
        System.out.println("   - SensorId: " + updatedReport.getSensorId() + " (unchanged)");
        
        return toResponse(updatedReport);
    }

    @Override
    @CacheEvict(value = {"pmReportList", "pmReportCount", "pmReportById"}, allEntries = true)
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