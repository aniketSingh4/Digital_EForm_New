package com.florosense.pre_visit_report.serviceImpl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.florosense.pre_visit_report.dto.ChecklistItemDTO;
import com.florosense.pre_visit_report.dto.PreVisitReportDTO;
import com.florosense.pre_visit_report.dto.SiteImageDTO;
import com.florosense.pre_visit_report.entity.PreVisitReport;
import com.florosense.pre_visit_report.entity.SiteImage;
import com.florosense.pre_visit_report.exception.ResourceNotFoundException;
import com.florosense.pre_visit_report.repository.PreVisitReportRepository;
import com.florosense.pre_visit_report.repository.SiteImageRepository;
import com.florosense.pre_visit_report.service.PreVisitReportService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class PreVisitReportServiceImpl implements PreVisitReportService {

    private final PreVisitReportRepository repository;
    private final SiteImageRepository siteImageRepository;
    private final ObjectMapper objectMapper;

    private static final List<String> CHECKLIST_FIELDS = Arrays.asList(
        "Confirm Availability of Stabilized power supply (230 V)",
        "Verify Controller Mounting Structure (Wall/Pole)",
        "Verify Sensor Placement Location",
        "Inform Client Regarding internet connectivity requirement",
        "Confirm LED Installation Location",
        "Discuss Client Scope of Work"
    );

    private static final String UPLOAD_DIR = "uploads/previsit-images/";

    // ========================================
    // EXISTING METHODS
    // ========================================

    @Override
    @CacheEvict(value = {"preVisitReportList", "preVisitReportCount"}, allEntries = true)
    public PreVisitReportDTO createReport(PreVisitReportDTO reportDTO) {
        log.info("Received DTO: {}", reportDTO);
        
        // Set default visit date if null
        if (reportDTO.getVisitDate() == null) {
            log.warn("Visit date is null, setting to current date");
            reportDTO.setVisitDate(LocalDate.now());
        }
        
        // Validate company name
        String companyName = reportDTO.getCompanyName();
        if (companyName == null || companyName.trim().isEmpty()) {
            log.error("Company name is null in the request");
            throw new IllegalArgumentException("Company name is required");
        }
        
        log.info("Creating new pre-visit report for company: {}", companyName);

        // Validate email
        if (reportDTO.getEmailId() != null && !reportDTO.getEmailId().isEmpty() && existsByEmailId(reportDTO.getEmailId())) {
            throw new IllegalArgumentException("Email already exists: " + reportDTO.getEmailId());
        }

        PreVisitReport report = convertToEntity(reportDTO);
        report.setCreatedBy("SYSTEM");
        
        PreVisitReport savedReport = repository.save(report);
        log.info("Pre-visit report created with ID: {}", savedReport.getId());

        return convertToDTO(savedReport);
    }

    @Override
    @CacheEvict(value = {"preVisitReportList", "preVisitReportCount"}, allEntries = true)
    public PreVisitReportDTO updateReport(Long id, PreVisitReportDTO reportDTO) {
        log.info("Updating pre-visit report with ID: {}", id);

        PreVisitReport existingReport = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));

        updateEntityFields(existingReport, reportDTO);
        existingReport.setUpdatedBy("SYSTEM");

        PreVisitReport updatedReport = repository.save(existingReport);
        log.info("Pre-visit report updated with ID: {}", updatedReport.getId());

        return convertToDTO(updatedReport);
    }

    @Override
    @Transactional(readOnly = true)
    public PreVisitReportDTO getReportById(Long id) {
        log.info("Fetching pre-visit report with ID: {}", id);
        PreVisitReport report = repository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
        return convertToDTO(report);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "preVisitReportList", key = "'all'")
    public List<PreVisitReportDTO> getAllReports() {
        log.info("Fetching all pre-visit reports");
        return repository.findAll().stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreVisitReportDTO> getReportsByCompanyName(String companyName) {
        log.info("Fetching reports for company: {}", companyName);
        return repository.findByCompanyNameContainingIgnoreCase(companyName).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreVisitReportDTO> getReportsByDateRange(LocalDate startDate, LocalDate endDate) {
        log.info("Fetching reports between {} and {}", startDate, endDate);
        return repository.findByVisitDateBetween(startDate, endDate).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<PreVisitReportDTO> searchReports(String keyword) {
        log.info("Searching reports with keyword: {}", keyword);
        return repository.searchByKeyword(keyword).stream()
            .map(this::convertToDTO)
            .collect(Collectors.toList());
    }

    @Override
    @CacheEvict(value = {"preVisitReportList", "preVisitReportCount"}, allEntries = true)
    public void deleteReport(Long id) {
        log.info("Deleting pre-visit report with ID: {}", id);
        if (!repository.existsById(id)) {
            throw new ResourceNotFoundException("Report not found with ID: " + id);
        }
        
        // Delete all associated images first
        deleteAllImagesByReportId(id);
        
        repository.deleteById(id);
        log.info("Pre-visit report deleted with ID: {}", id);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existsByEmailId(String emailId) {
        return repository.existsByEmailId(emailId);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "preVisitReportCount", key = "'count'")
    public long getReportCount() {
        return repository.count();
    }

    // ========================================
    // IMAGE MANAGEMENT METHODS
    // ========================================

    @Override
    @Transactional(readOnly = true)
    public List<SiteImageDTO> getImagesByReportId(Long reportId) {
        log.info("Fetching images for report ID: {}", reportId);
        
        // Verify report exists
        if (!repository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        
        List<SiteImage> images = siteImageRepository.findByReportId(reportId);
        return images.stream()
            .map(this::convertToSiteImageDTO)
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<SiteImageDTO> getFinalImagesByReportId(Long reportId) {
        log.info("Fetching final images for report ID: {}", reportId);
        
        // Verify report exists
        if (!repository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        
        List<SiteImage> images = siteImageRepository.findByReportIdAndIsFinal(reportId, true);
        return images.stream()
            .map(this::convertToSiteImageDTO)
            .collect(Collectors.toList());
    }

    @Override
    public void deleteImage(Long imageId) {
        log.info("Deleting image with ID: {}", imageId);
        
        SiteImage image = siteImageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId));

        // Delete file from disk
        String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
        Path filePath = Paths.get(UPLOAD_DIR + fileName);
        if (Files.exists(filePath)) {
            try {
                Files.delete(filePath);
                log.info("Deleted file: {}", fileName);
            } catch (IOException e) {
                log.error("Error deleting file: {}", fileName, e);
            }
        }

        siteImageRepository.delete(image);
        log.info("Image deleted with ID: {}", imageId);
    }

    @Override
    public void deleteAllImagesByReportId(Long reportId) {
        log.info("Deleting all images for report ID: {}", reportId);
        
        List<SiteImage> images = siteImageRepository.findByReportId(reportId);
        
        // Delete all files from disk
        for (SiteImage image : images) {
            String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            if (Files.exists(filePath)) {
                try {
                    Files.delete(filePath);
                    log.info("Deleted file: {}", fileName);
                } catch (IOException e) {
                    log.error("Error deleting file: {}", fileName, e);
                }
            }
        }
        
        siteImageRepository.deleteByReportId(reportId);
        log.info("All images deleted for report ID: {}", reportId);
    }

    @Override
    public SiteImageDTO updateImageDetails(Long imageId, String description, Boolean isFinal) {
        log.info("Updating image details for ID: {}", imageId);
        
        SiteImage image = siteImageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId));

        if (description != null) {
            image.setDescription(description);
        }
        if (isFinal != null) {
            image.setIsFinal(isFinal);
        }

        SiteImage updatedImage = siteImageRepository.save(image);
        log.info("Image updated with ID: {}", imageId);
        return convertToSiteImageDTO(updatedImage);
    }

    @Override
    @Transactional(readOnly = true)
    public long getImageCountByReportId(Long reportId) {
        // Verify report exists
        if (!repository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        return siteImageRepository.countByReportId(reportId);
    }

    // ========================================
    // CONVERSION METHODS
    // ========================================

    private PreVisitReport convertToEntity(PreVisitReportDTO dto) 
    {
        PreVisitReport entity = new PreVisitReport();
        
        // Set basic details
        entity.setVisitDate(dto.getVisitDate() != null ? dto.getVisitDate() : LocalDate.now());
        entity.setCompanyName(dto.getCompanyName());
        entity.setSiteAddress(dto.getSiteAddress());
        entity.setSitePersonName(dto.getSitePersonName());
        entity.setContactNo(dto.getContactNo());
        entity.setEmailId(dto.getEmailId());
        entity.setInspectedBy(dto.getInspectedBy());
        entity.setNotedIfAny(dto.getNotedIfAny());

        // Set signatures
        entity.setCustomerName(dto.getCustomerName());
        entity.setCustomerSignature(dto.getCustomerSignature());
        entity.setTechnicianName(dto.getTechnicianName());
        entity.setTechnicianSignature(dto.getTechnicianSignature());
        entity.setSignatureDate(LocalDate.now());

        // Set checklist statuses
        if (dto.getChecklist() != null && !dto.getChecklist().isEmpty()) {
            log.info("Processing {} checklist items", dto.getChecklist().size());
            for (ChecklistItemDTO item : dto.getChecklist()) {
                log.info("Checklist item: {} - Status: {}", item.getFieldName(), item.getStatus());
                setChecklistField(entity, item);
            }
        }

        return entity;
    }

    private PreVisitReportDTO convertToDTO(PreVisitReport entity) {
        PreVisitReportDTO dto = new PreVisitReportDTO();
        
        // Set basic details
        dto.setId(entity.getId());
        dto.setVisitDate(entity.getVisitDate());
        dto.setCompanyName(entity.getCompanyName());
        dto.setSiteAddress(entity.getSiteAddress());
        dto.setSitePersonName(entity.getSitePersonName());
        dto.setContactNo(entity.getContactNo());
        dto.setEmailId(entity.getEmailId());
        dto.setInspectedBy(entity.getInspectedBy());
        dto.setNotedIfAny(entity.getNotedIfAny());

        // Set signatures
        dto.setCustomerName(entity.getCustomerName());
        dto.setCustomerSignature(entity.getCustomerSignature());
        dto.setTechnicianName(entity.getTechnicianName());
        dto.setTechnicianSignature(entity.getTechnicianSignature());

        // Set checklist
        List<ChecklistItemDTO> checklist = new ArrayList<>();
        addChecklistItem(checklist, "Confirm Availability of Stabilized power supply (230 V)", 
            entity.getStatusPowerSupply(), entity.getRemarkPowerSupply());
        addChecklistItem(checklist, "Verify Controller Mounting Structure (Wall/Pole)", 
            entity.getStatusControllerMounting(), entity.getRemarkControllerMounting());
        addChecklistItem(checklist, "Verify Sensor Placement Location", 
            entity.getStatusSensorPlacement(), entity.getRemarkSensorPlacement());
        addChecklistItem(checklist, "Inform Client Regarding internet connectivity requirement", 
            entity.getStatusInternetConnectivity(), entity.getRemarkInternetConnectivity());
        addChecklistItem(checklist, "Confirm LED Installation Location", 
            entity.getStatusLedInstallation(), entity.getRemarkLedInstallation());
        addChecklistItem(checklist, "Discuss Client Scope of Work", 
            entity.getStatusClientScope(), entity.getRemarkClientScope());
        dto.setChecklist(checklist);

        // ✅ NEW: Convert Site Images to DTO
        if (entity.getSiteImages() != null && !entity.getSiteImages().isEmpty()) {
            List<SiteImageDTO> imageDTOs = entity.getSiteImages().stream()
                    .map(this::convertToSiteImageDTO)
                    .collect(Collectors.toList());
            dto.setSiteImages(imageDTOs);
        }

        // Set audit fields
        dto.setCreatedAt(entity.getCreatedAt() != null ? 
            entity.getCreatedAt().toLocalDate() : null);
        dto.setUpdatedAt(entity.getUpdatedAt() != null ? 
            entity.getUpdatedAt().toLocalDate() : null);

        return dto;
    }

    // ✅ NEW: Convert SiteImage to SiteImageDTO
    private SiteImageDTO convertToSiteImageDTO(SiteImage image) {
        SiteImageDTO dto = new SiteImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());
        dto.setImageName(image.getImageName());
        dto.setImageType(image.getImageType());
        dto.setImageSize(image.getImageSize());
        dto.setIsFinal(image.getIsFinal());
        dto.setDescription(image.getDescription());
        dto.setUploadedAt(image.getUploadedAt() != null ? 
            image.getUploadedAt().toString() : null);
        return dto;
    }

    private void setChecklistField(PreVisitReport entity, ChecklistItemDTO item) {
        String fieldName = item.getFieldName();
        Boolean status = item.getStatus();
        String remark = item.getRemark();

        if (fieldName == null) {
            log.warn("Field name is null in checklist item");
            return;
        }

        log.debug("Setting field: {} with status: {} and remark: {}", fieldName, status, remark);

        if (fieldName.contains("Stabilized power supply")) {
            entity.setStatusPowerSupply(status);
            entity.setRemarkPowerSupply(remark);
        } else if (fieldName.contains("Controller Mounting Structure")) {
            entity.setStatusControllerMounting(status);
            entity.setRemarkControllerMounting(remark);
        } else if (fieldName.contains("Sensor Placement Location")) {
            entity.setStatusSensorPlacement(status);
            entity.setRemarkSensorPlacement(remark);
        } else if (fieldName.contains("internet connectivity")) {
            entity.setStatusInternetConnectivity(status);
            entity.setRemarkInternetConnectivity(remark);
        } else if (fieldName.contains("LED Installation")) {
            entity.setStatusLedInstallation(status);
            entity.setRemarkLedInstallation(remark);
        } else if (fieldName.contains("Scope of Work")) {
            entity.setStatusClientScope(status);
            entity.setRemarkClientScope(remark);
        } else {
            log.warn("Unknown field name: {}", fieldName);
        }
    }

    private void addChecklistItem(List<ChecklistItemDTO> list, String fieldName, 
                                   Boolean status, String remark) {
        ChecklistItemDTO item = new ChecklistItemDTO();
        item.setFieldName(fieldName);
        item.setStatus(status);
        item.setRemark(remark);
        item.setDisplayName(fieldName);
        list.add(item);
    }

    private void updateEntityFields(PreVisitReport entity, PreVisitReportDTO dto) {
        // Update basic details
        if (dto.getVisitDate() != null) entity.setVisitDate(dto.getVisitDate());
        if (dto.getCompanyName() != null) entity.setCompanyName(dto.getCompanyName());
        if (dto.getSiteAddress() != null) entity.setSiteAddress(dto.getSiteAddress());
        if (dto.getSitePersonName() != null) entity.setSitePersonName(dto.getSitePersonName());
        if (dto.getContactNo() != null) entity.setContactNo(dto.getContactNo());
        if (dto.getEmailId() != null) entity.setEmailId(dto.getEmailId());
        if (dto.getInspectedBy() != null) entity.setInspectedBy(dto.getInspectedBy());
        if (dto.getNotedIfAny() != null) entity.setNotedIfAny(dto.getNotedIfAny());

        // Update signatures
        if (dto.getCustomerName() != null) entity.setCustomerName(dto.getCustomerName());
        if (dto.getCustomerSignature() != null) entity.setCustomerSignature(dto.getCustomerSignature());
        if (dto.getTechnicianName() != null) entity.setTechnicianName(dto.getTechnicianName());
        if (dto.getTechnicianSignature() != null) entity.setTechnicianSignature(dto.getTechnicianSignature());
        entity.setSignatureDate(LocalDate.now());

        // Update checklist
        if (dto.getChecklist() != null && !dto.getChecklist().isEmpty()) {
            for (ChecklistItemDTO item : dto.getChecklist()) {
                setChecklistField(entity, item);
            }
        }
    }

    //NEW: Get image data as byte array
    @Override
    @Transactional(readOnly = true)
    public byte[] getImageData(Long imageId) {
        log.info("Fetching image data for ID: {}", imageId);
        
        SiteImage image = siteImageRepository.findById(imageId)
            .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId));
        
        byte[] imageData = image.getImageData();
        if (imageData == null) {
            log.warn("No image data found for ID: {}", imageId);
            // Fallback: try to read from disk if data not in database
            try {
                String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
                Path filePath = Paths.get(UPLOAD_DIR + fileName);
                if (Files.exists(filePath)) {
                    log.info("Reading image from disk: {}", fileName);
                    return Files.readAllBytes(filePath);
                }
            } catch (IOException e) {
                log.error("Error reading image from disk", e);
            }
            return null;
        }
        
        return imageData;
    }
}