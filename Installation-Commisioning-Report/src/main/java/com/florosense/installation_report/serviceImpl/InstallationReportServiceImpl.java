package com.florosense.installation_report.serviceImpl;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;
import com.florosense.installation_report.entity.InstallationReport;
import com.florosense.installation_report.entity.InstallationSiteImage;
import com.florosense.installation_report.exception.ResourceNotFoundException;
import com.florosense.installation_report.repository.InstallationReportRepository;
import com.florosense.installation_report.repository.InstallationSiteImageRepository;
import com.florosense.installation_report.service.InstallationReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstallationReportServiceImpl implements InstallationReportService {
    
    private final InstallationReportRepository reportRepository;
    private final InstallationSiteImageRepository siteImageRepository;
    
    private static final String UPLOAD_DIR = "uploads/installation-images/";

    // ========================================
    // REPORT CRUD OPERATIONS
    // ========================================

    @Override
    @Transactional
    public InstallationReportResponse createReport(InstallationReportRequest request) 
    {
        log.info("Creating new installation report");
        
        InstallationReport report = new InstallationReport();
        
        // Auto-generate report number
        report.setReportNo(generateReportNumber());
        
        // Set basic fields
        report.setDate(request.getDate());
        report.setInstalledBy(request.getInstalledBy());
        
        // Set Company and Customer Details
        report.setCompanyName(request.getCompanyName());
        report.setSiteAddress(request.getSiteAddress());
        report.setCustomerName(request.getCustomerName());
        report.setContactNo(request.getContactNo());
        report.setEmailId(request.getEmailId());
        
        // Set Equipment Details
        report.setEquipmentDetails(request.getEquipmentDetails());
        
        // Set Work Activity
        report.setMachineUnboxing(request.getMachineUnboxing());
        report.setSensorControllerInstalled(request.getSensorControllerInstalled());
        report.setLedInstalled(request.getLedInstalled());
        report.setWiringInternalConnectionDone(request.getWiringInternalConnectionDone());
        report.setBasicFunctionalityCheck(request.getBasicFunctionalityCheck());
        report.setStablePowerSupply(request.getStablePowerSupply());
        report.setStableInternetConnection(request.getStableInternetConnection());
        report.setSafetyMaintenanceExplained(request.getSafetyMaintenanceExplained());
        
        // NEW: Others Work Activity
        report.setWorkActivityOthers(request.getWorkActivityOthers());
        
        // Set Remark
        report.setRemark(request.getRemark());
        
        // Set Work Confirmation
        report.setWorkConfirmation(request.getWorkConfirmation());
        
        // Set Customer & Technician Confirmation
        report.setCustomerConfirmationName(request.getCustomerConfirmationName());
        report.setCustomerSignature(request.getCustomerSignature());
        report.setTechnicianConfirmationName(request.getTechnicianConfirmationName());
        report.setTechnicianSignature(request.getTechnicianSignature());
        
        InstallationReport savedReport = reportRepository.save(report);
        log.info("Installation report created with ID: {}", savedReport.getId());
        
        return convertToResponse(savedReport);
    }
    
    @Override
    @Transactional
    public InstallationReportResponse updateReport(Long id, InstallationReportRequest request) {
        log.info("Updating installation report with ID: {}", id);
        
        InstallationReport existingReport = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
        
        // Update fields
        existingReport.setDate(request.getDate());
        existingReport.setInstalledBy(request.getInstalledBy());
        
        // Update Company and Customer Details
        existingReport.setCompanyName(request.getCompanyName());
        existingReport.setSiteAddress(request.getSiteAddress());
        existingReport.setCustomerName(request.getCustomerName());
        existingReport.setContactNo(request.getContactNo());
        existingReport.setEmailId(request.getEmailId());
        
        // Update Equipment Details
        existingReport.setEquipmentDetails(request.getEquipmentDetails());
        
        // Update Work Activity
        existingReport.setMachineUnboxing(request.getMachineUnboxing());
        existingReport.setSensorControllerInstalled(request.getSensorControllerInstalled());
        existingReport.setLedInstalled(request.getLedInstalled());
        existingReport.setWiringInternalConnectionDone(request.getWiringInternalConnectionDone());
        existingReport.setBasicFunctionalityCheck(request.getBasicFunctionalityCheck());
        existingReport.setStablePowerSupply(request.getStablePowerSupply());
        existingReport.setStableInternetConnection(request.getStableInternetConnection());
        existingReport.setSafetyMaintenanceExplained(request.getSafetyMaintenanceExplained());
        
        // NEW: Others Work Activity
        existingReport.setWorkActivityOthers(request.getWorkActivityOthers());
        
        // Update Remark
        existingReport.setRemark(request.getRemark());
        
        // Update Work Confirmation
        existingReport.setWorkConfirmation(request.getWorkConfirmation());
        
        // Update Customer & Technician Confirmation
        existingReport.setCustomerConfirmationName(request.getCustomerConfirmationName());
        existingReport.setCustomerSignature(request.getCustomerSignature());
        existingReport.setTechnicianConfirmationName(request.getTechnicianConfirmationName());
        existingReport.setTechnicianSignature(request.getTechnicianSignature());
        
        InstallationReport updatedReport = reportRepository.save(existingReport);
        log.info("Installation report updated with ID: {}", updatedReport.getId());
        
        return convertToResponse(updatedReport);
    }
    
    @Override
    @Transactional(readOnly = true)
    public InstallationReportResponse getReportById(Long id) {
        log.info("Fetching installation report by ID: {}", id);
        
        InstallationReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
        
        return convertToResponse(report);
    }
    
    @Override
    @Transactional(readOnly = true)
    public InstallationReportResponse getReportByReportNo(String reportNo) {
        log.info("Fetching installation report by Report No: {}", reportNo);
        
        InstallationReport report = reportRepository.findByReportNo(reportNo)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with Report No: " + reportNo));
        
        return convertToResponse(report);
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InstallationReportResponse> getAllReports() {
        log.info("Fetching all installation reports");
        
        return reportRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InstallationReportResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching reports between {} and {}", startDate, endDate);
        
        return reportRepository.findByDateBetween(startDate, endDate)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional(readOnly = true)
    public List<InstallationReportResponse> getReportsByInstalledBy(String installedBy) {
        log.info("Fetching reports installed by: {}", installedBy);
        
        return reportRepository.findByInstalledBy(installedBy)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public void deleteReport(Long id) {
        log.info("Deleting installation report with ID: {}", id);
        
        InstallationReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
        
        // Delete all associated images first
        deleteAllImagesByReportId(id);
        
        reportRepository.delete(report);
        log.info("Installation report deleted with ID: {}", id);
    }
    
    @Override
    public String generateReportNumber() {
        String month = LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM"));
        String year = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy"));
        
        long count = reportRepository.count();
        long sequence = count + 1;
        
        String reportNo = String.format("FESPL_%s_%s_%03d", month, year, sequence);
        
        while (reportRepository.existsByReportNo(reportNo)) {
            sequence++;
            reportNo = String.format("FESPL_%s_%s_%03d", month, year, sequence);
        }
        
        return reportNo;
    }

    // ========================================
    // IMAGE MANAGEMENT METHODS
    // ========================================

    @Override
    @Transactional(readOnly = true)
    public List<InstallationSiteImage> getImagesByReportId(Long reportId) {
        log.info("Fetching images for installation report ID: {}", reportId);
        
        // Verify report exists
        if (!reportRepository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        
        return siteImageRepository.findByInstallationReportId(reportId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<InstallationSiteImage> getFinalImagesByReportId(Long reportId) {
        log.info("Fetching final images for installation report ID: {}", reportId);
        
        // Verify report exists
        if (!reportRepository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        
        return siteImageRepository.findByInstallationReportIdAndIsFinal(reportId, true);
    }

    @Override
    @Transactional
    public void deleteImage(Long imageId) {
        log.info("Deleting image with ID: {}", imageId);
        
        InstallationSiteImage image = siteImageRepository.findById(imageId)
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
    @Transactional
    public void deleteAllImagesByReportId(Long reportId) {
        log.info("Deleting all images for installation report ID: {}", reportId);
        
        List<InstallationSiteImage> images = siteImageRepository.findByInstallationReportId(reportId);
        
        // Delete all files from disk
        for (InstallationSiteImage image : images) {
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
        
        siteImageRepository.deleteByInstallationReportId(reportId);
        log.info("All images deleted for installation report ID: {}", reportId);
    }

    @Override
    @Transactional
    public InstallationSiteImage updateImageDetails(Long imageId, String description, Boolean isFinal) {
        log.info("Updating image details for ID: {}", imageId);
        
        InstallationSiteImage image = siteImageRepository.findById(imageId)
                .orElseThrow(() -> new ResourceNotFoundException("Image not found with ID: " + imageId));

        if (description != null) {
            image.setDescription(description);
        }
        if (isFinal != null) {
            image.setIsFinal(isFinal);
        }

        InstallationSiteImage updatedImage = siteImageRepository.save(image);
        log.info("Image updated with ID: {}", imageId);
        return updatedImage;
    }

    @Override
    @Transactional(readOnly = true)
    public long getImageCountByReportId(Long reportId) {
        // Verify report exists
        if (!reportRepository.existsById(reportId)) {
            throw new ResourceNotFoundException("Report not found with ID: " + reportId);
        }
        return siteImageRepository.countByInstallationReportId(reportId);
    }

    // ========================================
    // CONVERSION METHODS
    // ========================================

    private InstallationReportResponse convertToResponse(InstallationReport report) {
        InstallationReportResponse response = new InstallationReportResponse();
        
        response.setId(report.getId());
        response.setReportNo(report.getReportNo());
        response.setDate(report.getDate());
        response.setInstalledBy(report.getInstalledBy());
        
        // Company and Customer Details
        response.setCompanyName(report.getCompanyName());
        response.setSiteAddress(report.getSiteAddress());
        response.setCustomerName(report.getCustomerName());
        response.setContactNo(report.getContactNo());
        response.setEmailId(report.getEmailId());
        
        // Equipment Details
        response.setEquipmentDetails(report.getEquipmentDetails());
        
        // Work Activity
        response.setMachineUnboxing(report.getMachineUnboxing());
        response.setSensorControllerInstalled(report.getSensorControllerInstalled());
        response.setLedInstalled(report.getLedInstalled());
        response.setWiringInternalConnectionDone(report.getWiringInternalConnectionDone());
        response.setBasicFunctionalityCheck(report.getBasicFunctionalityCheck());
        response.setStablePowerSupply(report.getStablePowerSupply());
        response.setStableInternetConnection(report.getStableInternetConnection());
        response.setSafetyMaintenanceExplained(report.getSafetyMaintenanceExplained());
        
        // NEW: Others Work Activity
        response.setWorkActivityOthers(report.getWorkActivityOthers());
        
        // Remark
        response.setRemark(report.getRemark());
        
        // Work Confirmation
        response.setWorkConfirmation(report.getWorkConfirmation());
        
        // Customer & Technician Confirmation
        response.setCustomerConfirmationName(report.getCustomerConfirmationName());
        response.setCustomerSignature(report.getCustomerSignature());
        response.setTechnicianConfirmationName(report.getTechnicianConfirmationName());
        response.setTechnicianSignature(report.getTechnicianSignature());
        
        // NEW: Site Images
        if (report.getSiteImages() != null && !report.getSiteImages().isEmpty()) {
            response.setSiteImages(report.getSiteImages());
        }
        
        // Audit Fields
        response.setCreatedAt(report.getCreatedAt());
        response.setUpdatedAt(report.getUpdatedAt());
        
        return response;
    }
}