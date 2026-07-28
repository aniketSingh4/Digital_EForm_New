package com.florosense.pre_visit_report.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
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
     * ✅ UPDATED: Upload images - Store in PostgreSQL
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

            List<SiteImageDTO> uploadedImages = files.stream().map(file -> {
                try {
                    // ✅ NEW: Read file as byte array
                    byte[] imageBytes = file.getBytes();
                    
                    // Generate unique filename for reference
                    String originalFilename = file.getOriginalFilename();
                    String uniqueId = UUID.randomUUID().toString();
                    
                    // Create image entity with byte data
                    SiteImage image = new SiteImage();
                    image.setImageData(imageBytes);  // ✅ Store bytes in database
                    image.setImageName(originalFilename);
                    image.setImageType(file.getContentType());
                    image.setImageSize(file.getSize());
                    image.setIsFinal(isFinal);
                    image.setDescription(description);
                    image.setReport(report);
                    image.setUploadedBy("SYSTEM");
                    
                    // ✅ Set URL as data URI
                    String base64Image = Base64.getEncoder().encodeToString(imageBytes);
                    image.setImageUrl("data:" + file.getContentType() + ";base64," + base64Image);

                    SiteImage savedImage = siteImageRepository.save(image);
                    log.info("✅ Image saved to database with ID: {}", savedImage.getId());
                    
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
     * ✅ UPDATED: Upload base64 image - Store in PostgreSQL
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

            // Detect content type
            String contentType = "image/jpeg";
            if (base64Data.contains("png")) {
                contentType = "image/png";
            } else if (base64Data.contains("jpeg") || base64Data.contains("jpg")) {
                contentType = "image/jpeg";
            } else if (base64Data.contains("gif")) {
                contentType = "image/gif";
            }

            // Create image entity with byte data
            SiteImage image = new SiteImage();
            image.setImageData(imageBytes);  // ✅ Store bytes in database
            image.setImageName(request.getImageName() != null ? 
                request.getImageName() : "site-image.jpg");
            image.setImageType(contentType);
            image.setImageSize((long) imageBytes.length);
            image.setIsFinal(request.getIsFinal() != null ? request.getIsFinal() : false);
            image.setDescription(request.getDescription());
            image.setReport(report);
            image.setUploadedBy("SYSTEM");
            
            // ✅ Set URL as data URI
            String base64Image = Base64.getEncoder().encodeToString(imageBytes);
            image.setImageUrl("data:" + contentType + ";base64," + base64Image);

            SiteImage savedImage = siteImageRepository.save(image);
            log.info("✅ Base64 image saved to database with ID: {}", savedImage.getId());
            
            SiteImageDTO dto = convertToSiteImageDTO(savedImage);
            return ResponseEntity.ok(dto);

        } catch (Exception e) {
            log.error("Error uploading base64 image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to upload image: " + e.getMessage());
        }
    }

    /**
     * ✅ NEW: Get image data as byte array
     */
    @GetMapping(value = "/images/{imageId}/data", produces = MediaType.APPLICATION_OCTET_STREAM_VALUE)
    public ResponseEntity<byte[]> getImageData(@PathVariable Long imageId) {
        try {
            SiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));
            
            byte[] imageData = image.getImageData();
            if (imageData == null) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(image.getImageType()))
                    .body(imageData);
        } catch (Exception e) {
            log.error("Error fetching image data", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * ✅ UPDATED: Get all images for a report
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
     * ✅ UPDATED: Get only final images for a report
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
     * ✅ UPDATED: Delete a single image - No file system cleanup needed!
     */
    @DeleteMapping("/images/{imageId}")
    public ResponseEntity<?> deleteImage(@PathVariable Long imageId) {
        try {
            SiteImage image = siteImageRepository.findById(imageId)
                    .orElseThrow(() -> new RuntimeException("Image not found with ID: " + imageId));

            // ✅ No file system deletion needed - just delete from database
            siteImageRepository.delete(image);
            log.info("✅ Image deleted from database: {}", imageId);
            
            return ResponseEntity.ok("Image deleted successfully");

        } catch (Exception e) {
            log.error("Error deleting image", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to delete image: " + e.getMessage());
        }
    }

    /**
     * ✅ UPDATED: Delete all images - No file system cleanup needed!
     */
    @DeleteMapping("/images/report/{reportId}")
    public ResponseEntity<?> deleteAllImages(@PathVariable Long reportId) {
        try {
            // ✅ Just delete from database
            siteImageRepository.deleteByReportId(reportId);
            log.info("✅ All images deleted for report ID: {}", reportId);
            
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

    // HELPER METHODS
    //UPDATED: Convert SiteImage to SiteImageDTO with image data
     
    private SiteImageDTO convertToSiteImageDTO(SiteImage image) {
        SiteImageDTO dto = new SiteImageDTO();
        dto.setId(image.getId());
        dto.setImageName(image.getImageName());
        dto.setImageType(image.getImageType());
        dto.setImageSize(image.getImageSize());
        dto.setIsFinal(image.getIsFinal());
        dto.setDescription(image.getDescription());
        dto.setUploadedAt(image.getUploadedAt() != null ? 
            image.getUploadedAt().toString() : null);
        
        //Set image data as base64 for frontend
        if (image.getImageData() != null) {
            String base64Image = Base64.getEncoder().encodeToString(image.getImageData());
            dto.setImageData("data:" + image.getImageType() + ";base64," + base64Image);
            dto.setImageUrl("data:" + image.getImageType() + ";base64," + base64Image);
        } else {
            // Fallback to URL if no data in database
            dto.setImageUrl(image.getImageUrl());
        }
        
        return dto;
    }
}