package com.florosense.calibration_report.controller;


import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.florosense.calibration_report.dto.CalibrationReportDTO;
import com.florosense.calibration_report.dto.CreateCalibrationReportRequest;
import com.florosense.calibration_report.service.CalibrationReportService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/calibration-reports")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CalibrationReportController {
    
    private final CalibrationReportService reportService;
    
    @PostMapping
    public ResponseEntity<CalibrationReportDTO> createReport(
            @Valid @RequestBody CreateCalibrationReportRequest request) {
        CalibrationReportDTO createdReport = reportService.createReport(request);
        return new ResponseEntity<>(createdReport, HttpStatus.CREATED);
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<CalibrationReportDTO> getReportById(@PathVariable String id) {
        CalibrationReportDTO report = reportService.getReportById(id);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping("/report-number/{reportNo}")
    public ResponseEntity<CalibrationReportDTO> getReportByReportNo(
            @PathVariable String reportNo) {
        CalibrationReportDTO report = reportService.getReportByReportNo(reportNo);
        return ResponseEntity.ok(report);
    }
    
    @GetMapping
    public ResponseEntity<List<CalibrationReportDTO>> getAllReports() {
        List<CalibrationReportDTO> reports = reportService.getAllReports();
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/client/{clientName}")
    public ResponseEntity<List<CalibrationReportDTO>> getReportsByClient(
            @PathVariable String clientName) {
        List<CalibrationReportDTO> reports = reportService.getReportsByClientName(clientName);
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/search")
    public ResponseEntity<List<CalibrationReportDTO>> getReportsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<CalibrationReportDTO> reports = reportService.getReportsByDateRange(
            startDate.toString(), endDate.toString());
        return ResponseEntity.ok(reports);
    }
    
    @GetMapping("/count")
    public ResponseEntity<Long> getReportCount() {
        long count = reportService.getReportCount();
        return ResponseEntity.ok(count);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<CalibrationReportDTO> updateReport(
            @PathVariable String id,
            @Valid @RequestBody CreateCalibrationReportRequest request) {
        CalibrationReportDTO updatedReport = reportService.updateReport(id, request);
        return ResponseEntity.ok(updatedReport);
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable String id) {
        reportService.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}
