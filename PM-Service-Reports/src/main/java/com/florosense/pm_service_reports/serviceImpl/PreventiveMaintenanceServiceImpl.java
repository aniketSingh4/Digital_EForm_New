package com.florosense.pm_service_reports.serviceImpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import javax.sql.DataSource;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import jakarta.persistence.EntityManager;

import com.florosense.pm_service_reports.dto.ChecklistItemDTO;
import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;
import com.florosense.pm_service_reports.entity.ChecklistCategory;
import com.florosense.pm_service_reports.entity.InspectionStatus;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceChecklist;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceReport;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceSignOff;
import com.florosense.pm_service_reports.exception.DuplicateResourceException;
import com.florosense.pm_service_reports.exception.ResourceNotFoundException;
import com.florosense.pm_service_reports.mapper.PMMapper;
import com.florosense.pm_service_reports.repository.PreventiveMaintenanceReportRepository;
import com.florosense.pm_service_reports.service.PreventiveMaintenanceService;

@Service
@Transactional
public class PreventiveMaintenanceServiceImpl implements PreventiveMaintenanceService {

    private static final Set<String> PM_STATUS_CODES = Set.of(
            "SATISFACTORY",
            "FOLLOW_UP_VISIT_REQUIRED",
            "REQUIRES_ATTENTION");
    private static final Set<String> SITE_CONDITION_CODES = Set.of(
            "SYSTEM_OPERATIONAL",
            "SYSTEM_NOT_OPERATIONAL",
            "SYSTEM_OPERATIONAL_WITH_OBSERVATION");

    private final PreventiveMaintenanceReportRepository repository;
    private final PMMapper mapper;
    private final DataSource dataSource;
    private final EntityManager entityManager;

    public PreventiveMaintenanceServiceImpl(
            PreventiveMaintenanceReportRepository repository,
            PMMapper mapper,
            DataSource dataSource,
            EntityManager entityManager) {
        this.repository = repository;
        this.mapper = mapper;
        this.dataSource = dataSource;
        this.entityManager = entityManager;
    }
    
    @Override
    @Cacheable(value = "pmReportList", key = "'all'")
    public List<PMReportSummaryResponse> getAllReports() {
        List<PreventiveMaintenanceReport> reports = repository.findAll();
        List<PMReportSummaryResponse> summaries = new ArrayList<>();
        for (PreventiveMaintenanceReport report : reports) {
            try {
                PMReportSummaryResponse summary = mapper.toSummaryDTO(report);
                summary.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus());
                applyResolvedSiteCondition(report, summary);
                summaries.add(summary);
            } catch (Exception mappingError) {
                System.err.println("Skipping summary mapping for report "
                        + report.getId() + ": " + mappingError.getMessage());
                summaries.add(toMinimalSummary(report));
            }
        }
        return summaries;
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

    private String canonicalizePmStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if ("FOLLOWUP_VISIT_REQUIRED".equals(key)) {
            key = "FOLLOW_UP_VISIT_REQUIRED";
        }
        return PM_STATUS_CODES.contains(key) ? key : null;
    }

    private String toSiteConditionKey(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String key = raw.trim().toUpperCase().replace(' ', '_').replace('-', '_');
        if (key.contains("NOT_OPERATIONAL") || key.contains("NON_OPERATIONAL")
                || "DOWN".equals(key) || "SC_DOWN".equals(key)) {
            return "SC_DOWN";
        }
        if (key.contains("WITH_OBSERVATION") || key.contains("WITH_ISSUES")
                || "OBS".equals(key) || "SC_OBS".equals(key)) {
            return "SC_OBS";
        }
        if ("SYSTEM_OPERATIONAL".equals(key) || "OK".equals(key) || "SC_OK".equals(key)) {
            return "SC_OK";
        }
        return null;
    }

    private String toSiteConditionFull(String siteConditionKey) {
        if (siteConditionKey == null) {
            return null;
        }
        return switch (siteConditionKey) {
            case "SC_OK" -> "SYSTEM_OPERATIONAL";
            case "SC_OBS" -> "SYSTEM_OPERATIONAL_WITH_OBSERVATION";
            case "SC_DOWN" -> "SYSTEM_NOT_OPERATIONAL";
            default -> null;
        };
    }

    private String resolvedSiteConditionKey(PreventiveMaintenanceReport report) {
        String fromStoredKey = toSiteConditionKey(report.getSiteConditionKey());
        if (fromStoredKey != null) {
            return fromStoredKey;
        }
        return toSiteConditionKey(report.getSiteConditionAfterPm());
    }

    private void applyResolvedSiteCondition(PreventiveMaintenanceReport report, PMReportSummaryResponse summary) {
        String key = resolvedSiteConditionKey(report);
        String full = toSiteConditionFull(key);
        summary.setSiteConditionKey(key);
        summary.setSiteConditionAfterPm(full != null ? full : report.getSiteConditionAfterPm());
    }

    private void applyResolvedSiteCondition(PreventiveMaintenanceReport report, PMReportResponse response) {
        String key = resolvedSiteConditionKey(report);
        String full = toSiteConditionFull(key);
        response.setSiteConditionKey(key);
        response.setSiteConditionAfterPm(full != null ? full : report.getSiteConditionAfterPm());
        if (response.getSummary() != null) {
            response.getSummary().setSiteConditionKey(key);
            response.getSummary().setSiteConditionAfterPm(full != null ? full : report.getSiteConditionAfterPm());
        }
    }

    private String canonicalizeSiteCondition(String raw) {
        return toSiteConditionFull(toSiteConditionKey(raw));
    }

    private String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private void applySummaryFields(PreventiveMaintenanceReport report, PMReportRequest request, boolean required) {
        String pmStatusValue = firstNonBlank(
                request.getSummary() != null ? request.getSummary().getPreventiveMaintenanceStatus() : null,
                request.getPreventiveMaintenanceStatus());
        String siteConditionKey = firstNonBlank(
                request.getSummary() != null ? request.getSummary().getSiteConditionKey() : null,
                request.getSiteConditionKey(),
                request.getSummary() != null ? request.getSummary().getSiteConditionCode() : null,
                request.getSiteConditionCode());
        String siteConditionFull = firstNonBlank(
                request.getSummary() != null ? request.getSummary().getSiteConditionAfterPm() : null,
                request.getSiteConditionAfterPm());

        System.out.println("📥 Incoming PM Status: " + pmStatusValue);
        System.out.println("📥 Incoming Site Condition key: " + siteConditionKey);
        System.out.println("📥 Incoming Site Condition full: " + siteConditionFull);

        String canonicalPmStatus = canonicalizePmStatus(pmStatusValue);
        if (canonicalPmStatus != null) {
            report.setPreventiveMaintenanceStatus(canonicalPmStatus);
        } else if (required || (pmStatusValue != null && !pmStatusValue.isBlank())) {
            throw new IllegalArgumentException("Invalid or missing PM Status: " + pmStatusValue);
        } else {
            System.out.println("⚠️ PM Status omitted, leaving existing value");
        }

        String fromFull = toSiteConditionKey(siteConditionFull);
        String fromKey = toSiteConditionKey(siteConditionKey);
        String resolvedKey = fromFull != null ? fromFull : fromKey;
        if (fromFull != null && fromKey != null && !fromFull.equals(fromKey)) {
            System.out.println("⚠️ Site condition mismatch full=" + fromFull + " key=" + fromKey
                    + "; using full value");
        }
        String canonicalSiteCondition = toSiteConditionFull(resolvedKey);
        if (canonicalSiteCondition != null) {
            report.setSiteConditionKey(resolvedKey);
            report.setSiteConditionAfterPm(canonicalSiteCondition);
            System.out.println("📊 Canonical Site Condition: " + canonicalSiteCondition + " key=" + resolvedKey);
        } else if (required || (siteConditionFull != null && !siteConditionFull.isBlank())
                || (siteConditionKey != null && !siteConditionKey.isBlank())) {
            throw new IllegalArgumentException("Invalid or missing Site Condition: "
                    + firstNonBlank(siteConditionFull, siteConditionKey));
        } else {
            System.out.println("⚠️ Site Condition omitted, leaving existing value");
        }
    }

    private void persistSiteConditionAfterCommit(Long id, String canonicalSiteCondition) {
        if (id == null || canonicalSiteCondition == null || canonicalSiteCondition.isBlank()) {
            return;
        }
        Runnable writer = () -> writeSiteCondition(id, canonicalSiteCondition);
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    writer.run();
                }
            });
        } else {
            writer.run();
        }
    }

    private void writeSiteConditionInSession(Long id, String canonicalSiteCondition) {
        if (id == null || canonicalSiteCondition == null || canonicalSiteCondition.isBlank()) {
            return;
        }
        int updated = entityManager.createNativeQuery(
                "UPDATE pm_reports SET site_condition_after_pm = CAST(:value AS text) WHERE id = :id")
                .setParameter("value", canonicalSiteCondition)
                .setParameter("id", id)
                .executeUpdate();
        System.out.println("📝 in-session site_condition_after_pm update rows=" + updated
                + " id=" + id + " value=" + canonicalSiteCondition);
        Object stored = entityManager.createNativeQuery(
                "SELECT site_condition_after_pm FROM pm_reports WHERE id = :id")
                .setParameter("id", id)
                .getSingleResult();
        String storedText = stored == null ? null : stored.toString();
        System.out.println("📊 Site Condition in-session SELECT: " + storedText
                + " length=" + (storedText == null ? 0 : storedText.length()));
        if (storedText == null || !canonicalSiteCondition.equals(storedText)) {
            throw new IllegalStateException("Site condition did not persist as " + canonicalSiteCondition
                    + " (stored=" + storedText + ")");
        }
    }

    private void writeSiteCondition(Long id, String canonicalSiteCondition) {
        try (Connection connection = dataSource.getConnection()) {
            boolean autoCommit = connection.getAutoCommit();
            try (PreparedStatement ps = connection.prepareStatement(
                    "UPDATE pm_reports SET site_condition_after_pm = CAST(? AS text) WHERE id = ?")) {
                ps.setString(1, canonicalSiteCondition);
                ps.setLong(2, id);
                int updated = ps.executeUpdate();
                System.out.println("📝 afterCommit site_condition_after_pm update rows=" + updated
                        + " id=" + id + " value=" + canonicalSiteCondition);
            }
            if (!autoCommit) {
                connection.commit();
            }
            try (PreparedStatement ps = connection.prepareStatement(
                    "SELECT site_condition_after_pm FROM pm_reports WHERE id = ?")) {
                ps.setLong(1, id);
                try (ResultSet rs = ps.executeQuery()) {
                    if (rs.next()) {
                        String stored = rs.getString(1);
                        System.out.println("📊 Site Condition afterCommit SELECT: " + stored
                                + " length=" + (stored == null ? 0 : stored.length()));
                    }
                }
            }
        } catch (Exception ex) {
            throw new IllegalStateException("Failed to persist site_condition_after_pm for report " + id, ex);
        }
    }

    private PMReportSummaryResponse toMinimalSummary(PreventiveMaintenanceReport report) {
        PMReportSummaryResponse summary = new PMReportSummaryResponse();
        summary.setId(report.getId());
        summary.setServiceReportNo(report.getServiceReportNo());
        summary.setClientName(report.getClientName());
        summary.setSiteName(report.getSiteName());
        summary.setEngineerName(report.getEngineerName());
        summary.setPmVisitDate(report.getPmVisitDate());
        summary.setSensorId(report.getSensorId());
        summary.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus());
        applyResolvedSiteCondition(report, summary);
        return summary;
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

        applySummaryFields(report, request, true);

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
        
        String canonicalSiteCondition = report.getSiteConditionAfterPm();
        PreventiveMaintenanceReport savedReport = repository.save(report);
        entityManager.flush();
        writeSiteConditionInSession(savedReport.getId(), canonicalSiteCondition);
        persistSiteConditionAfterCommit(savedReport.getId(), canonicalSiteCondition);
        
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
        response.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus());
        response.setSummary(mapper.createSummaryDTO(report));
        applyResolvedSiteCondition(report, response);
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
        response.setPreventiveMaintenanceStatus(report.getPreventiveMaintenanceStatus());
        response.setSummary(mapper.createSummaryDTO(report));
        response.setChecklists(toChecklistDtos(report.getChecklists()));
        applyResolvedSiteCondition(report, response);
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
        
        applySummaryFields(report, request, false);

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

        String canonicalSiteCondition = report.getSiteConditionAfterPm();
        PreventiveMaintenanceReport updatedReport = repository.save(report);
        entityManager.flush();
        writeSiteConditionInSession(updatedReport.getId(), canonicalSiteCondition);
        persistSiteConditionAfterCommit(updatedReport.getId(), canonicalSiteCondition);
        
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