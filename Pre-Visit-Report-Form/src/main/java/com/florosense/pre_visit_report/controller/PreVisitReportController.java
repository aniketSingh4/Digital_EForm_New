package com.florosense.pre_visit_report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.florosense.pre_visit_report.dto.PreVisitReportDTO;
import com.florosense.pre_visit_report.dto.SiteImageDTO;
import com.florosense.pre_visit_report.entity.PreVisitReport;
import com.florosense.pre_visit_report.entity.SiteImage;
import com.florosense.pre_visit_report.repository.PreVisitReportRepository;
import com.florosense.pre_visit_report.repository.SiteImageRepository;
import com.florosense.pre_visit_report.service.PreVisitReportService;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/previsit-reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PreVisitReportController {

    private final PreVisitReportService service;
    private final PreVisitReportRepository reportRepository;
    private final SiteImageRepository siteImageRepository;

    private static final String UPLOAD_DIR = "uploads/previsit-images/";

    // ========================================
    // EXISTING REPORT ENDPOINTS
    // ========================================

    @PostMapping
    public PreVisitReportDTO createReport(@Valid @RequestBody PreVisitReportDTO reportDTO) {
        log.info("Received request to create pre-visit report");
        return service.createReport(reportDTO);
    }

    @PutMapping("/{id}")
    public PreVisitReportDTO updateReport(
            @PathVariable Long id,
            @Valid @RequestBody PreVisitReportDTO reportDTO) {
        log.info("Received request to update pre-visit report with ID: {}", id);
        return service.updateReport(id, reportDTO);
    }

    @GetMapping("/{id}")
    public PreVisitReportDTO getReportById(@PathVariable Long id) {
        log.info("Received request to fetch pre-visit report with ID: {}", id);
        return service.getReportById(id);
    }

    @GetMapping
    public List<PreVisitReportDTO> getAllReports() {
        log.info("Received request to fetch all pre-visit reports");
        return service.getAllReports();
    }

    @GetMapping("/company")
    public List<PreVisitReportDTO> getReportsByCompanyName(
            @RequestParam String companyName) {
        log.info("Received request to fetch reports for company: {}", companyName);
        return service.getReportsByCompanyName(companyName);
    }

    @GetMapping("/date-range")
    public List<PreVisitReportDTO> getReportsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        log.info("Received request to fetch reports between {} and {}", startDate, endDate);
        return service.getReportsByDateRange(startDate, endDate);
    }

    @GetMapping("/search")
    public List<PreVisitReportDTO> searchReports(@RequestParam String keyword) {
        log.info("Received request to search reports with keyword: {}", keyword);
        return service.searchReports(keyword);
    }

    @DeleteMapping("/{id}")
    public void deleteReport(@PathVariable Long id) {
        log.info("Received request to delete pre-visit report with ID: {}", id);
        service.deleteReport(id);
    }

    @GetMapping("/exists")
    public boolean checkEmailExists(@RequestParam String email) {
        log.info("Checking if email exists: {}", email);
        return service.existsByEmailId(email);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getReportCount() {
        log.info("Received request to get pre-visit report count");
        long count = service.getReportCount();
        return ResponseEntity.ok(count);
    }

    // ========================================
    // IMAGE UPLOAD ENDPOINTS
    // ========================================

    /**
     * Upload images for a report (multipart file upload)
     */
    @PostMapping("/images/upload/{reportId}")
    public ResponseEntity<?> uploadImages(
            @PathVariable Long reportId,
            @RequestParam("files") List<MultipartFile> files,
            @RequestParam(value = "isFinal", defaultValue = "false") Boolean isFinal,
            @RequestParam(value = "description", required = false) String description) {
        
        try {
            PreVisitReport report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

            // Create upload directory if not exists
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            List<SiteImageDTO> uploadedImages = files.stream().map(file -> {
                try {
                    // Generate unique filename
                    String originalFilename = file.getOriginalFilename();
                    String fileExtension = originalFilename.substring(originalFilename.lastIndexOf("."));
                    String newFilename = UUID.randomUUID().toString() + fileExtension;
                    
                    // Save file
                    Path filePath = uploadPath.resolve(newFilename);
                    Files.copy(file.getInputStream(), filePath);

                    // Create image entity
                    SiteImage image = new SiteImage();
                    image.setImageUrl("/uploads/previsit-images/" + newFilename);
                    image.setImageName(originalFilename);
                    image.setImageType(file.getContentType());
                    image.setImageSize(file.getSize());
                    image.setIsFinal(isFinal);
                    image.setDescription(description);
                    image.setReport(report);
                    image.setUploadedBy("SYSTEM");

                    SiteImage savedImage = siteImageRepository.save(image);
                    return convertToSiteImageDTO(savedImage);

                } catch (IOException e) {
                    log.error("Error uploading file: {}", file.getOriginalFilename(), e);
                    return null;
                }
            }).filter(dto -> dto != null).collect(Collectors.toList());

            return ResponseEntity.ok(uploadedImages);

        } catch (Exception e) {
            log.error("Error uploading images", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload images: " + e.getMessage());
        }
    }

    /**
     * Upload a single image as base64 string
     */
    @PostMapping("/images/upload-base64/{reportId}")
    public ResponseEntity<?> uploadBase64Image(
            @PathVariable Long reportId,
            @RequestBody Base64ImageRequest request) {
        
        try {
            PreVisitReport report = reportRepository.findById(reportId)
                    .orElseThrow(() -> new RuntimeException("Report not found with ID: " + reportId));

            // Decode base64
            String base64Data = request.getImageData();
            String[] parts = base64Data.split(",");
            String imageData = parts.length > 1 ? parts[1] : parts[0];
            byte[] imageBytes = Base64.getDecoder().decode(imageData);

            // Create upload directory
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            // Generate unique filename
            String fileExtension = ".jpg";
            if (base64Data.contains("png")) {
                fileExtension = ".png";
            } else if (base64Data.contains("jpeg") || base64Data.contains("jpg")) {
                fileExtension = ".jpeg";
            } else if (base64Data.contains("gif")) {
                fileExtension = ".gif";
            }
            String newFilename = UUID.randomUUID().toString() + fileExtension;
            
            // Save file
            Path filePath = uploadPath.resolve(newFilename);
            Files.write(filePath, imageBytes);

            // Create image entity
            SiteImage image = new SiteImage();
            image.setImageUrl("/uploads/previsit-images/" + newFilename);
            image.setImageName(request.getImageName() != null ? request.getImageName() : "site-image" + fileExtension);
            image.setImageType("image/" + fileExtension.substring(1));
            image.setImageSize((long) imageBytes.length);
            image.setIsFinal(request.getIsFinal() != null ? request.getIsFinal() : false);
            image.setDescription(request.getDescription());
            image.setReport(report);
            image.setUploadedBy("SYSTEM");

            SiteImage savedImage = siteImageRepository.save(image);
            SiteImageDTO dto = convertToSiteImageDTO(savedImage);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("Error uploading base64 image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * Get all images for a report
     */
    @GetMapping("/images/report/{reportId}")
    public ResponseEntity<List<SiteImageDTO>> getImagesByReport(@PathVariable Long reportId) {
        List<SiteImage> images = siteImageRepository.findByReportId(reportId);
        List<SiteImageDTO> dtos = images.stream()
                .map(this::convertToSiteImageDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Get only final images for a report
     */
    @GetMapping("/images/report/{reportId}/final")
    public ResponseEntity<List<SiteImageDTO>> getFinalImagesByReport(@PathVariable Long reportId) {
        List<SiteImage> images = siteImageRepository.findByReportIdAndIsFinal(reportId, true);
        List<SiteImageDTO> dtos = images.stream()
                .map(this::convertToSiteImageDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtos);
    }

    /**
     * Delete a single image by ID
     */
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        try {
            SiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            // Delete file from disk
            String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            if (Files.exists(filePath)) {
                Files.delete(filePath);
                log.info("Deleted file: {}", fileName);
            }

            siteImageRepository.delete(image);
            return ResponseEntity.ok("Image deleted successfully");

        } catch (Exception e) {
            log.error("Error deleting image", e);
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
            List<SiteImage> images = siteImageRepository.findByReportId(reportId);
            
            // Delete all files from disk
            for (SiteImage image : images) {
                String fileName = image.getImageUrl().substring(image.getImageUrl().lastIndexOf("/") + 1);
                Path filePath = Paths.get(UPLOAD_DIR + fileName);
                if (Files.exists(filePath)) {
                    Files.delete(filePath);
                    log.info("Deleted file: {}", fileName);
                }
            }
            
            siteImageRepository.deleteByReportId(reportId);
            return ResponseEntity.ok("All images deleted successfully");

        } catch (Exception e) {
            log.error("Error deleting images", e);
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
            SiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            if (request.getDescription() != null) {
                image.setDescription(request.getDescription());
            }
            if (request.getIsFinal() != null) {
                image.setIsFinal(request.getIsFinal());
            }

            SiteImage updatedImage = siteImageRepository.save(image);
            return ResponseEntity.ok(convertToSiteImageDTO(updatedImage));

        } catch (Exception e) {
            log.error("Error updating image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to update image: " + e.getMessage());
        }
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private SiteImageDTO convertToSiteImageDTO(SiteImage image) 
    {
        SiteImageDTO dto = new SiteImageDTO();
        dto.setId(image.getId());
        dto.setImageUrl(image.getImageUrl());
        dto.setImageName(image.getImageName());
        dto.setImageType(image.getImageType());
        dto.setImageSize(image.getImageSize());
        dto.setIsFinal(image.getIsFinal());
        dto.setDescription(image.getDescription());
        dto.setUploadedAt(image.getUploadedAt() != null ? image.getUploadedAt().toString() : null);
        return dto;
    }
}