package com.florosense.calibration_report.serviceImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.florosense.calibration_report.dto.CalibrationReportDTO;
import com.florosense.calibration_report.dto.CalibrationSummaryDTO;
import com.florosense.calibration_report.dto.CreateCalibrationReportRequest;
import com.florosense.calibration_report.dto.EngineerDetailsDTO;
import com.florosense.calibration_report.dto.MasterRefInstrumentDTO;
import com.florosense.calibration_report.dto.ReadingAfterCalibrationDTO;
import com.florosense.calibration_report.dto.ReadingBeforeCalibrationDTO;
import com.florosense.calibration_report.entity.CalibrationReport;
import com.florosense.calibration_report.entity.CalibrationSummary;
import com.florosense.calibration_report.entity.EngineerDetails;
import com.florosense.calibration_report.entity.MasterRefInstrument;
import com.florosense.calibration_report.entity.ReadingAfterCalibration;
import com.florosense.calibration_report.entity.ReadingBeforeCalibration;
import com.florosense.calibration_report.exception.DuplicateResourceException;
import com.florosense.calibration_report.exception.ResourceNotFoundException;
import com.florosense.calibration_report.repository.CalibrationReportRepository;
import com.florosense.calibration_report.service.CalibrationReportService;
import com.florosense.calibration_report.util.ReportNumberGenerator;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class CalibrationReportServiceImpl implements CalibrationReportService {
    
    private final CalibrationReportRepository reportRepository;
    private final ReportNumberGenerator reportNumberGenerator;
    
    private static final String DEFAULT_DECLARATION = 
        "The calibration activity was carried out using a calibrated reference instrument " +
        "traceable to applicable standards. The readings recorded above represent the observed " +
        "values before and after calibration. Any observations and recommendations have been " +
        "documented for necessary action.";
    
    @Override
    @CacheEvict(value = {"calibrationReportList", "calibrationReportCount"}, allEntries = true)
    public CalibrationReportDTO createReport(CreateCalibrationReportRequest request) {
        log.info("Creating new calibration report for client: {}", request.getClientName());
        
        // Generate unique identifiers
        String reportNo = reportNumberGenerator.generateReportNumber();
        String serialNo = reportNumberGenerator.generateSerialNumber();
        
        // Validate uniqueness
        validateUniqueIdentifiers(reportNo, serialNo);
        
        // Build and save report
        CalibrationReport report = buildReportFromRequest(request, reportNo, serialNo);
        CalibrationReport savedReport = reportRepository.save(report);
        
        log.info("Calibration report created successfully with ID: {}", savedReport.getId());
        return convertToDTO(savedReport);
    }
    
    @Override
    public CalibrationReportDTO getReportById(String id) {
        log.debug("Fetching calibration report by ID: {}", id);
        CalibrationReport report = findReportById(id);
        return convertToDTO(report);
    }
    
    @Override
    public CalibrationReportDTO getReportByReportNo(String reportNo) {
        log.debug("Fetching calibration report by number: {}", reportNo);
        CalibrationReport report = reportRepository.findByReportNo(reportNo)
            .orElseThrow(() -> new ResourceNotFoundException(
                String.format("Calibration report not found with number: %s", reportNo)));
        return convertToDTO(report);
    }
    
    @Override
    @Cacheable(value = "calibrationReportList", key = "'all'")
    public List<CalibrationReportDTO> getAllReports() {
        log.debug("Fetching all calibration reports");
        return reportRepository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    @CacheEvict(value = {"calibrationReportList", "calibrationReportCount"}, allEntries = true)
    public CalibrationReportDTO updateReport(String id, CreateCalibrationReportRequest request) {
        log.info("Updating calibration report with ID: {}", id);
        
        CalibrationReport existingReport = findReportById(id);
        
        // Update the report with new values
        updateReportFields(existingReport, request);
        
        CalibrationReport updatedReport = reportRepository.save(existingReport);
        log.info("Calibration report updated successfully with ID: {}", id);
        
        return convertToDTO(updatedReport);
    }
    
    @Override
    @CacheEvict(value = {"calibrationReportList", "calibrationReportCount"}, allEntries = true)
    public void deleteReport(String id) {
        log.info("Deleting calibration report with ID: {}", id);
        
        if (!reportRepository.existsById(id)) {
            throw new ResourceNotFoundException(
                String.format("Calibration report not found with ID: %s", id));
        }
        
        reportRepository.deleteById(id);
        log.info("Calibration report deleted successfully with ID: {}", id);
    }
    
    @Override
    @Cacheable(value = "calibrationReportCount", key = "'count'")
    public long getReportCount() {
        log.debug("Fetching total report count");
        return reportRepository.count();
    }
    
    @Override
    public List<CalibrationReportDTO> getReportsByClientName(String clientName) {
        log.debug("Fetching reports for client: {}", clientName);
        // This would require a custom repository method
        // For now, we'll filter in memory, but ideally you'd add a method to the repository
        return reportRepository.findAll().stream()
            .filter(report -> report.getClientName() != null && 
                   report.getClientName().equalsIgnoreCase(clientName))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    @Override
    public List<CalibrationReportDTO> getReportsByDateRange(String startDate, String endDate) {
        log.debug("Fetching reports between dates: {} and {}", startDate, endDate);
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        LocalDate start = LocalDate.parse(startDate, formatter);
        LocalDate end = LocalDate.parse(endDate, formatter);
        
        // This would require a custom repository method
        // For now, we'll filter in memory
        return reportRepository.findAll().stream()
            .filter(report -> report.getReportDate() != null && 
                   !report.getReportDate().isBefore(start) && 
                   !report.getReportDate().isAfter(end))
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }
    
    // ==================== PRIVATE HELPER METHODS ====================
    
    /**
     * Find report by ID or throw exception
     */
    private CalibrationReport findReportById(String id) {
        return reportRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException(
                String.format("Calibration report not found with ID: %s", id)));
    }
    
    /**
     * Validate unique identifiers
     */
    private void validateUniqueIdentifiers(String reportNo, String serialNo) {
        if (reportRepository.existsByReportNo(reportNo)) {
            throw new DuplicateResourceException(
                String.format("Report number already exists: %s", reportNo));
        }
        if (reportRepository.existsBySerialNo(serialNo)) {
            throw new DuplicateResourceException(
                String.format("Serial number already exists: %s", serialNo));
        }
    }
    
    /**
     * Build CalibrationReport entity from request
     */
    private CalibrationReport buildReportFromRequest(CreateCalibrationReportRequest request, 
                                                      String reportNo, String serialNo) {
        CalibrationReport report = new CalibrationReport();
        
        // Set basic fields
        report.setReportNo(reportNo);
        report.setSerialNo(serialNo);
        report.setReportDate(request.getReportDate() != null ? 
                            request.getReportDate() : LocalDate.now());
        report.setClientName(request.getClientName());
        report.setSiteName(request.getSiteName());
        report.setSiteAddress(request.getSiteAddress());
        report.setSensorId(request.getSensorId());
        report.setModelNo(request.getModelNo());
        report.setCalibrationDate(request.getCalibrationDate());
        report.setCalibrationDueDate(request.getCalibrationDueDate());
        report.setRemarks(request.getRemarks());
        report.setDeclaration(DEFAULT_DECLARATION);
        
        // Set nested entities
        report.setMasterRefInstrument(buildMasterRefInstrument(request.getMasterRefInstrument()));
        report.setReadingBeforeCalibration(buildReadingBefore(request.getReadingBeforeCalibration()));
        report.setReadingAfterCalibration(buildReadingAfter(request.getReadingAfterCalibration()));
        report.setCalibrationSummary(buildCalibrationSummary(request.getCalibrationSummary()));
        report.setEngineerDetails(buildEngineerDetails(request.getEngineerDetails()));
        
        return report;
    }
    
    /**
     * Update existing report with new values
     */
    private void updateReportFields(CalibrationReport report, CreateCalibrationReportRequest request) {
        // Update basic fields
        if (request.getReportDate() != null) {
            report.setReportDate(request.getReportDate());
        }
        if (StringUtils.hasText(request.getClientName())) {
            report.setClientName(request.getClientName());
        }
        if (StringUtils.hasText(request.getSiteName())) {
            report.setSiteName(request.getSiteName());
        }
        if (StringUtils.hasText(request.getSiteAddress())) {
            report.setSiteAddress(request.getSiteAddress());
        }
        if (StringUtils.hasText(request.getSensorId())) {
            report.setSensorId(request.getSensorId());
        }
        if (StringUtils.hasText(request.getModelNo())) {
            report.setModelNo(request.getModelNo());
        }
        if (request.getCalibrationDate() != null) {
            report.setCalibrationDate(request.getCalibrationDate());
        }
        if (request.getCalibrationDueDate() != null) {
            report.setCalibrationDueDate(request.getCalibrationDueDate());
        }
        if (request.getRemarks() != null) {
            report.setRemarks(request.getRemarks());
        }
        
        // Update nested entities (if provided)
        if (request.getMasterRefInstrument() != null) {
            if (report.getMasterRefInstrument() == null) {
                report.setMasterRefInstrument(new MasterRefInstrument());
            }
            updateMasterRefInstrument(report.getMasterRefInstrument(), 
                                     request.getMasterRefInstrument());
        }
        
        if (request.getReadingBeforeCalibration() != null) {
            if (report.getReadingBeforeCalibration() == null) {
                report.setReadingBeforeCalibration(new ReadingBeforeCalibration());
            }
            updateReadingBefore(report.getReadingBeforeCalibration(), 
                               request.getReadingBeforeCalibration());
        }
        
        if (request.getReadingAfterCalibration() != null) {
            if (report.getReadingAfterCalibration() == null) {
                report.setReadingAfterCalibration(new ReadingAfterCalibration());
            }
            updateReadingAfter(report.getReadingAfterCalibration(), 
                              request.getReadingAfterCalibration());
        }
        
        if (request.getCalibrationSummary() != null) {
            if (report.getCalibrationSummary() == null) {
                report.setCalibrationSummary(new CalibrationSummary());
            }
            updateCalibrationSummary(report.getCalibrationSummary(), 
                                    request.getCalibrationSummary());
        }
        
        if (request.getEngineerDetails() != null) {
            if (report.getEngineerDetails() == null) {
                report.setEngineerDetails(new EngineerDetails());
            }
            updateEngineerDetails(report.getEngineerDetails(), 
                                 request.getEngineerDetails());
        }
    }
    
    // ==================== ENTITY BUILDERS ====================
    
    private MasterRefInstrument buildMasterRefInstrument(MasterRefInstrumentDTO dto) {
        if (dto == null) return null;
        
        MasterRefInstrument entity = new MasterRefInstrument();
        entity.setRefSerialNo(dto.getRefSerialNo());
        entity.setCalibrationCertificateNo(dto.getCalibrationCertificateNo());
        entity.setCertificateValidity(dto.getCertificateValidity());
        return entity;
    }
    
    private ReadingBeforeCalibration buildReadingBefore(ReadingBeforeCalibrationDTO dto) {
        if (dto == null) return null;
        
        ReadingBeforeCalibration entity = new ReadingBeforeCalibration();
        entity.setPm25Value(dto.getPm25Value());
        entity.setPm10Value(dto.getPm10Value());
        entity.setTemp(dto.getTemp());
        entity.setHumidity(dto.getHumidity());
        return entity;
    }
    
    private ReadingAfterCalibration buildReadingAfter(ReadingAfterCalibrationDTO dto) {
        if (dto == null) return null;
        
        ReadingAfterCalibration entity = new ReadingAfterCalibration();
        entity.setPm25Value(dto.getPm25Value());
        entity.setPm10Value(dto.getPm10Value());
        entity.setTemp(dto.getTemp());
        entity.setHumidity(dto.getHumidity());
        return entity;
    }
    
    private CalibrationSummary buildCalibrationSummary(CalibrationSummaryDTO dto) {
        if (dto == null) return null;
        
        CalibrationSummary entity = new CalibrationSummary();
        entity.setCalibrationSuccessful(dto.getCalibrationSuccessful());
        entity.setCalibrationAdjustmentPerformed(dto.getCalibrationAdjustmentPerformed());
        entity.setSensorWithinAcceptableLimits(dto.getSensorWithinAcceptableLimits());
        entity.setSensorRequiresReplacement(dto.getSensorRequiresReplacement());
        return entity;
    }
    
    private EngineerDetails buildEngineerDetails(EngineerDetailsDTO dto) {
        if (dto == null) return null;
        
        EngineerDetails entity = new EngineerDetails();
        entity.setEngineerName(dto.getEngineerName());
        entity.setSignature(dto.getSignature());
        entity.setDate(dto.getDate() != null ? dto.getDate() : LocalDate.now());
        return entity;
    }
    
    // ==================== ENTITY UPDATERS ====================
    
    private void updateMasterRefInstrument(MasterRefInstrument entity, 
                                           MasterRefInstrumentDTO dto) {
        if (StringUtils.hasText(dto.getRefSerialNo())) {
            entity.setRefSerialNo(dto.getRefSerialNo());
        }
        if (StringUtils.hasText(dto.getCalibrationCertificateNo())) {
            entity.setCalibrationCertificateNo(dto.getCalibrationCertificateNo());
        }
        if (StringUtils.hasText(dto.getCertificateValidity())) {
            entity.setCertificateValidity(dto.getCertificateValidity());
        }
    }
    
    private void updateReadingBefore(ReadingBeforeCalibration entity, 
                                     ReadingBeforeCalibrationDTO dto) {
        if (dto.getPm25Value() != null) {
            entity.setPm25Value(dto.getPm25Value());
        }
        if (dto.getPm10Value() != null) {
            entity.setPm10Value(dto.getPm10Value());
        }
        if (dto.getTemp() != null) {
            entity.setTemp(dto.getTemp());
        }
        if (dto.getHumidity() != null) {
            entity.setHumidity(dto.getHumidity());
        }
    }
    
    private void updateReadingAfter(ReadingAfterCalibration entity, 
                                    ReadingAfterCalibrationDTO dto) {
        if (dto.getPm25Value() != null) {
            entity.setPm25Value(dto.getPm25Value());
        }
        if (dto.getPm10Value() != null) {
            entity.setPm10Value(dto.getPm10Value());
        }
        if (dto.getTemp() != null) {
            entity.setTemp(dto.getTemp());
        }
        if (dto.getHumidity() != null) {
            entity.setHumidity(dto.getHumidity());
        }
    }
    
    private void updateCalibrationSummary(CalibrationSummary entity, 
                                         CalibrationSummaryDTO dto) {
        if (dto.getCalibrationSuccessful() != null) {
            entity.setCalibrationSuccessful(dto.getCalibrationSuccessful());
        }
        if (dto.getCalibrationAdjustmentPerformed() != null) {
            entity.setCalibrationAdjustmentPerformed(dto.getCalibrationAdjustmentPerformed());
        }
        if (dto.getSensorWithinAcceptableLimits() != null) {
            entity.setSensorWithinAcceptableLimits(dto.getSensorWithinAcceptableLimits());
        }
        if (dto.getSensorRequiresReplacement() != null) {
            entity.setSensorRequiresReplacement(dto.getSensorRequiresReplacement());
        }
    }
    
    private void updateEngineerDetails(EngineerDetails entity, EngineerDetailsDTO dto) {
        if (StringUtils.hasText(dto.getEngineerName())) {
            entity.setEngineerName(dto.getEngineerName());
        }
        if (StringUtils.hasText(dto.getSignature())) {
            entity.setSignature(dto.getSignature());
        }
        if (dto.getDate() != null) {
            entity.setDate(dto.getDate());
        }
    }
    
    // ==================== DTO CONVERTERS ====================
    
    private CalibrationReportDTO convertToDTO(CalibrationReport report) {
        if (report == null) return null;
        
        CalibrationReportDTO dto = new CalibrationReportDTO();
        
        // Basic fields
        dto.setId(report.getId());
        dto.setReportNo(ReportNumberGenerator.withDateSequenceHyphen(report.getReportNo(), "FLO_CAL_"));
        dto.setReportDate(report.getReportDate());
        dto.setClientName(report.getClientName());
        dto.setSiteName(report.getSiteName());
        dto.setSiteAddress(report.getSiteAddress());
        dto.setSensorId(report.getSensorId());
        dto.setModelNo(report.getModelNo());
        dto.setSerialNo(ReportNumberGenerator.withDateSequenceHyphen(report.getSerialNo(), "FLO_SER_"));
        dto.setCalibrationDate(report.getCalibrationDate());
        dto.setCalibrationDueDate(report.getCalibrationDueDate());
        dto.setRemarks(report.getRemarks());
        dto.setDeclaration(report.getDeclaration());
        
        // Nested entities
        if (report.getMasterRefInstrument() != null) {
            dto.setMasterRefInstrument(convertMasterRefToDTO(report.getMasterRefInstrument()));
        }
        if (report.getReadingBeforeCalibration() != null) {
            dto.setReadingBeforeCalibration(convertReadingBeforeToDTO(
                report.getReadingBeforeCalibration()));
        }
        if (report.getReadingAfterCalibration() != null) {
            dto.setReadingAfterCalibration(convertReadingAfterToDTO(
                report.getReadingAfterCalibration()));
        }
        if (report.getCalibrationSummary() != null) {
            dto.setCalibrationSummary(convertSummaryToDTO(report.getCalibrationSummary()));
        }
        if (report.getEngineerDetails() != null) {
            dto.setEngineerDetails(convertEngineerToDTO(report.getEngineerDetails()));
        }
        
        return dto;
    }
    
    private MasterRefInstrumentDTO convertMasterRefToDTO(MasterRefInstrument entity) {
        if (entity == null) return null;
        
        MasterRefInstrumentDTO dto = new MasterRefInstrumentDTO();
        dto.setRefSerialNo(entity.getRefSerialNo());
        dto.setCalibrationCertificateNo(entity.getCalibrationCertificateNo());
        dto.setCertificateValidity(entity.getCertificateValidity());
        return dto;
    }
    
    private ReadingBeforeCalibrationDTO convertReadingBeforeToDTO(ReadingBeforeCalibration entity) {
        if (entity == null) return null;
        
        ReadingBeforeCalibrationDTO dto = new ReadingBeforeCalibrationDTO();
        dto.setPm25Value(entity.getPm25Value());
        dto.setPm10Value(entity.getPm10Value());
        dto.setTemp(entity.getTemp());
        dto.setHumidity(entity.getHumidity());
        return dto;
    }
    
    private ReadingAfterCalibrationDTO convertReadingAfterToDTO(ReadingAfterCalibration entity) {
        if (entity == null) return null;
        
        ReadingAfterCalibrationDTO dto = new ReadingAfterCalibrationDTO();
        dto.setPm25Value(entity.getPm25Value());
        dto.setPm10Value(entity.getPm10Value());
        dto.setTemp(entity.getTemp());
        dto.setHumidity(entity.getHumidity());
        return dto;
    }
    
    private CalibrationSummaryDTO convertSummaryToDTO(CalibrationSummary entity) {
        if (entity == null) return null;
        
        CalibrationSummaryDTO dto = new CalibrationSummaryDTO();
        dto.setCalibrationSuccessful(entity.getCalibrationSuccessful());
        dto.setCalibrationAdjustmentPerformed(entity.getCalibrationAdjustmentPerformed());
        dto.setSensorWithinAcceptableLimits(entity.getSensorWithinAcceptableLimits());
        dto.setSensorRequiresReplacement(entity.getSensorRequiresReplacement());
        return dto;
    }
    
    private EngineerDetailsDTO convertEngineerToDTO(EngineerDetails entity) {
        if (entity == null) return null;
        
        EngineerDetailsDTO dto = new EngineerDetailsDTO();
        dto.setEngineerName(entity.getEngineerName());
        dto.setSignature(entity.getSignature());
        dto.setDate(entity.getDate());
        return dto;
    }
}
