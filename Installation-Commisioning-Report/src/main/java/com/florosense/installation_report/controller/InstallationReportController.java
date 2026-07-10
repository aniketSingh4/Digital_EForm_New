package com.florosense.installation_report.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.florosense.installation_report.dto.InstallationReportRequest;
import com.florosense.installation_report.dto.InstallationReportResponse;
import com.florosense.installation_report.service.InstallationReportService;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@CrossOrigin(origins = {"http://localhost:5173"})
public class InstallationReportController 
{
    
    private final InstallationReportService reportService;
    
    @PostMapping
    public ResponseEntity<InstallationReportResponse> createReport(@Valid @RequestBody InstallationReportRequest request) {
        InstallationReportResponse response = reportService.createReport(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<InstallationReportResponse> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody InstallationReportRequest request) {
        InstallationReportResponse response = reportService.updateReport(id, request);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<InstallationReportResponse> getReportById(@PathVariable Long id) {
        InstallationReportResponse response = reportService.getReportById(id);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/report-number/{reportNo}")
    public ResponseEntity<InstallationReportResponse> getReportByReportNo(@PathVariable String reportNo) {
        InstallationReportResponse response = reportService.getReportByReportNo(reportNo);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping
    public ResponseEntity<List<InstallationReportResponse>> getAllReports() {
        List<InstallationReportResponse> responses = reportService.getAllReports();
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<InstallationReportResponse>> getReportsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        List<InstallationReportResponse> responses = reportService.getReportsByDateRange(startDate, endDate);
        return ResponseEntity.ok(responses);
    }
    
    @GetMapping("/installed-by/{installedBy}")
    public ResponseEntity<List<InstallationReportResponse>> getReportsByInstalledBy(@PathVariable String installedBy) {
        List<InstallationReportResponse> responses = reportService.getReportsByInstalledBy(installedBy);
        return ResponseEntity.ok(responses);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
    
    @GetMapping("/generate-report-number")
    public ResponseEntity<String> generateReportNumber() {
        String reportNumber = reportService.generateReportNumber();
        return ResponseEntity.ok(reportNumber);
    }
}