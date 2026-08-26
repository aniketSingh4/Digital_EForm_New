package com.florosense.pm_service_reports.serviceImpl;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;

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

    private static final Logger log = LoggerFactory.getLogger(PreventiveMaintenanceServiceImpl.class);

    private static final Set<String> PM_STATUS_CODES = Set.of(
            "SATISFACTORY",
            "FOLLOW_UP_VISIT_REQUIRED",
            "REQUIRES_ATTENTION");
    private static final Set<String> SITE_CONDITION_CODES = Set.of(
            "SYSTEM_OPERATIONAL",
            "SYSTEM_NOT_OPERATIONAL",
            "SYSTEM_OPERATIONAL_WITH_OBSERVATION");

    private static final int MAX_REPORT_NUMBER_RETRIES = 5;
    private static final long REPORT_NUMBER_LOCK_NAMESPACE = 0x504D0000L;

    private final PreventiveMaintenanceReportRepository repository;
    private final PMMapper mapper;
    private final DataSource dataSource;
    private final EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;

    public PreventiveMaintenanceServiceImpl(
            PreventiveMaintenanceReportRepository repository,
            PMMapper mapper,
            DataSource dataSource,
            EntityManager entityManager,
            PlatformTransactionManager transactionManager) {
        this.repository = repository;
        this.mapper = mapper;
        this.dataSource = dataSource;
        this.entityManager = entityManager;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
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
                log.warn("Skipping summary mapping for report {}: {}",
                        report.getId(), mappingError.getMessage());
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

    @Override
    public String generateServiceReportNo() {
        return nextServiceReportNo(LocalDate.now().getYear());
    }

    private String allocateServiceReportNo() {
        int year = LocalDate.now().getYear();
        repository.acquirePmReportNumberLock(REPORT_NUMBER_LOCK_NAMESPACE + year);
        return nextServiceReportNo(year);
    }

    private String nextServiceReportNo(int year) {
        String prefix = "PM-" + year + "-";
        int sequence = 1;
        Optional<PreventiveMaintenanceReport> latest =
                repository.findFirstByServiceReportNoStartingWithOrderByServiceReportNoDesc(prefix);
        if (latest.isPresent()) {
            sequence = parseReportSequence(latest.get().getServiceReportNo()) + 1;
        }
        if (sequence < 1) {
            sequence = 1;
        }
        String reportNo = String.format("PM-%d-%04d", year, sequence);
        while (repository.existsByServiceReportNo(reportNo)) {
            sequence++;
            if (sequence > 9999) {
                throw new IllegalStateException("PM report number sequence exhausted for year " + year);
            }
            reportNo = String.format("PM-%d-%04d", year, sequence);
        }
        return reportNo;
    }

    private int parseReportSequence(String serviceReportNo) {
        if (serviceReportNo == null) {
            return 0;
        }
        int dash = serviceReportNo.lastIndexOf('-');
        if (dash < 0 || dash == serviceReportNo.length() - 1) {
            return 0;
        }
        try {
            return Integer.parseInt(serviceReportNo.substring(dash + 1));
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private boolean isServiceReportNoConflict(Throwable error) {
        while (error != null) {
            String message = error.getMessage();
            if (message != null) {
                String lower = message.toLowerCase();
                if (lower.contains("service_report_no") || lower.contains("servicereportno")) {
                    return true;
                }
            }
            error = error.getCause();
        }
        return false;
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
            log.warn("Invalid category: {}, defaulting to PHYSICAL_INSPECTION", category);
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
            log.warn("Invalid status: {}, defaulting to NO", status);
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

        String canonicalPmStatus = canonicalizePmStatus(pmStatusValue);
        if (canonicalPmStatus != null) {
            report.setPreventiveMaintenanceStatus(canonicalPmStatus);
        } else if (required || (pmStatusValue != null && !pmStatusValue.isBlank())) {
            throw new IllegalArgumentException("Invalid or missing PM Status: " + pmStatusValue);
        }

        String fromFull = toSiteConditionKey(siteConditionFull);
        String fromKey = toSiteConditionKey(siteConditionKey);
        String resolvedKey = fromFull != null ? fromFull : fromKey;
        String canonicalSiteCondition = toSiteConditionFull(resolvedKey);
        if (canonicalSiteCondition != null) {
            report.setSiteConditionKey(resolvedKey);
            report.setSiteConditionAfterPm(canonicalSiteCondition);
        } else if (required || (siteConditionFull != null && !siteConditionFull.isBlank())
                || (siteConditionKey != null && !siteConditionKey.isBlank())) {
            throw new IllegalArgumentException("Invalid or missing Site Condition: "
                    + firstNonBlank(siteConditionFull, siteConditionKey));
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
        entityManager.createNativeQuery(
                "UPDATE pm_reports SET site_condition_after_pm = CAST(:value AS text) WHERE id = :id")
                .setParameter("value", canonicalSiteCondition)
                .setParameter("id", id)
                .executeUpdate();
        Object stored = entityManager.createNativeQuery(
                "SELECT site_condition_after_pm FROM pm_reports WHERE id = :id")
                .setParameter("id", id)
                .getSingleResult();
        String storedText = stored == null ? null : stored.toString();
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
                ps.executeUpdate();
            }
            if (!autoCommit) {
                connection.commit();
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
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    @CacheEvict(value = {"pmReportList", "pmReportCount", "pmReportById"}, allEntries = true)
    public PMReportResponse saveReport(PMReportRequest request) {
        if (request.getPmVisitDate() == null) {
            throw new IllegalArgumentException("PM Visit Date is required");
        }

        DataIntegrityViolationException lastConflict = null;
        for (int attempt = 1; attempt <= MAX_REPORT_NUMBER_RETRIES; attempt++) {
            try {
                return transactionTemplate.execute(status -> persistNewReport(request));
            } catch (DataIntegrityViolationException e) {
                if (!isServiceReportNoConflict(e)) {
                    throw e;
                }
                lastConflict = e;
                log.warn("Unique service report number collision on save, retry {}", attempt);
            } catch (RuntimeException e) {
                if (!isServiceReportNoConflict(e)) {
                    throw e;
                }
                lastConflict = e instanceof DataIntegrityViolationException
                        ? (DataIntegrityViolationException) e
                        : lastConflict;
                log.warn("Unique service report number collision on save, retry {}", attempt);
            }
        }
        log.error("Could not allocate a unique Service Report Number after {} attempts",
                MAX_REPORT_NUMBER_RETRIES, lastConflict);
        throw new DuplicateResourceException(
                "Could not allocate a unique Service Report Number. Please try again.");
    }

    private PMReportResponse persistNewReport(PMReportRequest request) {
        String reportNo = allocateServiceReportNo();

        // Create entity manually for better control
        PreventiveMaintenanceReport report = new PreventiveMaintenanceReport();
        
        // Set basic fields — number is always assigned from the database
        report.setServiceReportNo(reportNo);
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
        } else {
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
        }

        String canonicalSiteCondition = report.getSiteConditionAfterPm();
        PreventiveMaintenanceReport savedReport = repository.save(report);
        entityManager.flush();
        writeSiteConditionInSession(savedReport.getId(), canonicalSiteCondition);
        persistSiteConditionAfterCommit(savedReport.getId(), canonicalSiteCondition);

        try {
            return toResponse(savedReport);
        } catch (Exception mappingError) {
            log.warn("Report saved but response mapping failed: {}", mappingError.getMessage());
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

    @Override
    @Transactional
    @CacheEvict(value = {"pmReportList", "pmReportCount", "pmReportById"}, allEntries = true)
    public PMReportResponse updateReport(
            Long id,
            PMReportRequest request) 
    {
        PreventiveMaintenanceReport report =
                repository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "PM Report not found."));

        // Update only editable fields; do not change serviceReportNo, serviceVisitNo, or sensorId
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
    }
}