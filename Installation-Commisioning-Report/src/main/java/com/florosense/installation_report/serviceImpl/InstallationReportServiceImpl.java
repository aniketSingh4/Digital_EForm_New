package com.florosense.installation_report.serviceImpl;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;
import com.florosense.installation_report.entity.InstallationReport;
import com.florosense.installation_report.exception.ResourceNotFoundException;
import com.florosense.installation_report.repository.InstallationReportRepository;
import com.florosense.installation_report.service.InstallationReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class InstallationReportServiceImpl implements InstallationReportService {
    
    private final InstallationReportRepository reportRepository;
    
    @Override
    @Transactional
    public InstallationReportResponse createReport(InstallationReportRequest request) {
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
    public InstallationReportResponse getReportById(Long id) {
        log.info("Fetching installation report by ID: {}", id);
        
        InstallationReport report = reportRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with ID: " + id));
        
        return convertToResponse(report);
    }
    
    @Override
    public InstallationReportResponse getReportByReportNo(String reportNo) {
        log.info("Fetching installation report by Report No: {}", reportNo);
        
        InstallationReport report = reportRepository.findByReportNo(reportNo)
                .orElseThrow(() -> new ResourceNotFoundException("Report not found with Report No: " + reportNo));
        
        return convertToResponse(report);
    }
    
    @Override
    public List<InstallationReportResponse> getAllReports() {
        log.info("Fetching all installation reports");
        
        return reportRepository.findAll()
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<InstallationReportResponse> getReportsByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        log.info("Fetching reports between {} and {}", startDate, endDate);
        
        return reportRepository.findByDateBetween(startDate, endDate)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    @Override
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
        
        // Remark
        response.setRemark(report.getRemark());
        
        // Work Confirmation
        response.setWorkConfirmation(report.getWorkConfirmation());
        
        // Customer & Technician Confirmation
        response.setCustomerConfirmationName(report.getCustomerConfirmationName());
        response.setCustomerSignature(report.getCustomerSignature());
        response.setTechnicianConfirmationName(report.getTechnicianConfirmationName());
        response.setTechnicianSignature(report.getTechnicianSignature());
        
        // Audit Fields
        response.setCreatedAt(report.getCreatedAt());
        response.setUpdatedAt(report.getUpdatedAt());
        
        return response;
    }
}