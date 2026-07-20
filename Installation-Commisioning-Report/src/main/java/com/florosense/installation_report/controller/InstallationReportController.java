package com.florosense.installation_report.controller;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;
import com.florosense.installation_report.dto.InstallationSiteImageDTO;
import com.florosense.installation_report.entity.InstallationReport;
import com.florosense.installation_report.entity.InstallationSiteImage;
import com.florosense.installation_report.repository.InstallationReportRepository;
import com.florosense.installation_report.repository.InstallationSiteImageRepository;
import com.florosense.installation_report.service.InstallationReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/installation-reports")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173"})
@Slf4j
public class InstallationReportController 
{
    
    private final InstallationReportService reportService;
    private final InstallationReportRepository reportRepository;
    private final InstallationSiteImageRepository siteImageRepository;
    
    private static final String UPLOAD_DIR = "uploads/installation-images/";

    // ========================================
    // REPORT CRUD ENDPOINTS
    // ========================================

    @PostMapping
    public ResponseEntity<InstallationReportResponse> createReport(@Valid @RequestBody InstallationReportRequest request) {
        log.info("📝 Creating installation report");
        InstallationReportResponse response = reportService.createReport(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<InstallationReportResponse> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody InstallationReportRequest request) {
        log.info("📝 Updating installation report with ID: {}", id);
        InstallationReportResponse response = reportService.updateReport(id, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InstallationReportResponse> getReportById(@PathVariable Long id) {
        log.info("🔍 Fetching installation report by ID: {}", id);
        InstallationReportResponse response = reportService.getReportById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/report-number/{reportNo}")
    public ResponseEntity<InstallationReportResponse> getReportByReportNo(@PathVariable String reportNo) {
        log.info("🔍 Fetching installation report by Report No: {}", reportNo);
        InstallationReportResponse response = reportService.getReportByReportNo(reportNo);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<InstallationReportResponse>> getAllReports() {
        log.info("📋 Fetching all installation reports");
        List<InstallationReportResponse> responses = reportService.getAllReports();
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<InstallationReportResponse>> getReportsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        log.info("🔍 Fetching reports between {} and {}", startDate, endDate);
        List<InstallationReportResponse> responses = reportService.getReportsByDateRange(startDate, endDate);
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/installed-by/{installedBy}")
    public ResponseEntity<List<InstallationReportResponse>> getReportsByInstalledBy(@PathVariable String installedBy) {
        log.info("🔍 Fetching reports installed by: {}", installedBy);
        List<InstallationReportResponse> responses = reportService.getReportsByInstalledBy(installedBy);
        return ResponseEntity.ok(responses);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        log.info("🗑️ Deleting installation report with ID: {}", id);
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/generate-report-number")
    public ResponseEntity<String> generateReportNumber() {
        log.info("📝 Generating report number");
        String reportNumber = reportService.generateReportNumber();
        return ResponseEntity.ok(reportNumber);
    }

    // ========================================
    // IMAGE UPLOAD ENDPOINTS
    // ========================================

    /**
     * Upload images for a report (multipart file upload)
     */
    @PostMapping(value = "/images/upload/{reportId}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> uploadImages(
            @PathVariable Long reportId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "isFinal", defaultValue = "false") Boolean isFinal,
            @RequestParam(value = "description", required = false) String description) {

        try {
            log.info("📸 Uploading {} images for report ID: {}", files.size(), reportId);
            
            // Verify report exists
            InstallationReport report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

            // Create upload directory if not exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
                log.info("📁 Created upload directory: {}", uploadPath.toAbsolutePath());
            }

            List<InstallationSiteImage> uploadedImages = new ArrayList<>();

            for (MultipartFile file : files) {
                if (file.isEmpty()) {
                    continue;
                }

                try {
                    // Generate unique filename
                    String originalFilename = file.getOriginalFilename();
                    String fileExtension = "";
                    if (originalFilename != null && originalFilename.contains(".")) {
                        fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    }
                    String newFilename = UUID.randomUUID().toString() + fileExtension;

                    // Save file to disk
                    Path filePath = uploadPath.resolve(newFilename);
                    Files.copy(file.getInputStream(), filePath);
                    log.info("💾 Saved file: {}", newFilename);

                    // Create image entity
                    InstallationSiteImage image = new InstallationSiteImage();
                    image.setImageUrl("/uploads/installation-images/" + newFilename);
                    image.setImageName(originalFilename);
                    image.setImageType(file.getContentType());
                    image.setImageSize(file.getSize());
                    image.setIsFinal(isFinal);
                    image.setDescription(description);
                    image.setInstallationReport(report);
                    image.setUploadedBy("SYSTEM");

                    InstallationSiteImage savedImage = siteImageRepository.save(image);
                    uploadedImages.add(savedImage);
                    log.info("✅ Image saved to database with ID: {}", savedImage.getId());

                } catch (IOException e) {
                    log.error("❌ Error uploading file: {}", file.getOriginalFilename(), e);
                }
            }

            if (uploadedImages.isEmpty()) {
                return ResponseEntity.badRequest().body("No images were uploaded successfully");
            }

            // Convert to DTOs
            List<InstallationSiteImageDTO> dtos = uploadedImages.stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);

        } catch (Exception e) {
            log.error("❌ Error uploading images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload images: " + e.getMessage());
        }
    }

    /**
     * Get all images for a report
     */
    @GetMapping("/images/report/{reportId}")
    public ResponseEntity<List<InstallationSiteImageDTO>> getImagesByReport(@PathVariable Long reportId) {
        log.info("🖼️ Fetching images for report ID: {}", reportId);
        
        List<InstallationSiteImage> images = siteImageRepository.findByInstallationReportId(reportId);
        List<InstallationSiteImageDTO> dtos = images.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        log.info("📸 Found {} images", dtos.size());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get only final images for a report
     */
    @GetMapping("/images/report/{reportId}/final")
    public ResponseEntity<List<InstallationSiteImageDTO>> getFinalImagesByReport(@PathVariable Long reportId) {
        log.info("⭐ Fetching final images for report ID: {}", reportId);
        
        List<InstallationSiteImage> images = siteImageRepository.findByInstallationReportIdAndIsFinal(reportId, true);
        List<InstallationSiteImageDTO> dtos = images.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(dtos);
    }

    /**
     * Delete a single image by ID
     */
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        try {
            log.info("🗑️ Deleting image with ID: {}", imageId);
            
            InstallationSiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            // Delete file from disk
            String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("💾 Deleted file: {}", fileName);
            }

            siteImageRepository.delete(image);
            log.info("✅ Image deleted from database: {}", imageId);
            
            return ResponseEntity.ok("Image deleted successfully");

        } catch (Exception e) {
            log.error("❌ Error deleting image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete image: " + e.getMessage());
        }
    }

    /**
     * Delete all images for a report
     */
    @DeleteMapping("/images/report/{reportId}")
    public ResponseEntity<?> deleteAllImages(@PathVariable Long reportId) {
        try {
            log.info("🗑️ Deleting all images for report ID: {}", reportId);
            
            List<InstallationSiteImage> images = siteImageRepository.findByInstallationReportId(reportId);
            
            // Delete all files from disk
            for (InstallationSiteImage image : images) {
                String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
                Path filePath = Paths.get(UPLOAD_DIR + fileName);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("💾 Deleted file: {}", fileName);
                }
            }
            
            siteImageRepository.deleteByInstallationReportId(reportId);
            log.info("✅ All images deleted for report ID: {}", reportId);
            
            return ResponseEntity.ok("All images deleted successfully");

        } catch (Exception e) {
            log.error("❌ Error deleting images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete images: " + e.getMessage());
        }
    }

    /**
     * Update image details (description, isFinal flag)
     */
    @PutMapping("/images/{imageId}")
    public ResponseEntity<?> updateImageDetails(
            @PathVariable Long imageId,
            @RequestBody ImageUpdateRequest request) {
        
        try {
            log.info("✏️ Updating image details for ID: {}", imageId);
            
            InstallationSiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            if (request.getDescription() != null) {
                image.setDescription(request.getDescription());
            }
            if (request.getIsFinal() != null) {
                image.setIsFinal(request.getIsFinal());
            }

            InstallationSiteImage updatedImage = siteImageRepository.save(image);
            log.info("✅ Image updated: {}", imageId);
            
            return ResponseEntity.ok(convertToDTO(updatedImage));

        } catch (Exception e) {
            log.error("❌ Error updating image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update image: " + e.getMessage());
        }
    }

    /**
     * Get image count for a report
     */
    @GetMapping("/images/count/{reportId}")
    public ResponseEntity<Long> getImageCount(@PathVariable Long reportId) {
        log.info("📊 Fetching image count for report ID: {}", reportId);
        
        long count = siteImageRepository.countByInstallationReportId(reportId);
        return ResponseEntity.ok(count);
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private InstallationSiteImageDTO convertToDTO(InstallationSiteImage image) {
        InstallationSiteImageDTO dto = new InstallationSiteImageDTO();
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

    // ========================================
    // INNER CLASSES FOR REQUESTS
    // ========================================

    public static class ImageUpdateRequest {
        private String description;
        private Boolean isFinal;

        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Boolean getIsFinal() { return isFinal; }
        public void setIsFinal(Boolean isFinal) { this.isFinal = isFinal; }
    }
}