package com.florosense.pre_visit_report.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.florosense.pre_visit_report.dto.PreVisitReportDTO;
import com.florosense.pre_visit_report.service.PreVisitReportService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/previsit-reports")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class PreVisitReportController {

    private final PreVisitReportService service;

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
}