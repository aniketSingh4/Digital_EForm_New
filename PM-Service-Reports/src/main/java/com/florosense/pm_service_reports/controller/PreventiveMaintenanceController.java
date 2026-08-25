package com.florosense.pm_service_reports.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.florosense.pm_service_reports.dto.PMReportRequest;
import com.florosense.pm_service_reports.dto.PMReportResponse;
import com.florosense.pm_service_reports.dto.PMReportSummaryResponse;
import com.florosense.pm_service_reports.repository.PreventiveMaintenanceReportRepository;
import com.florosense.pm_service_reports.service.PreventiveMaintenanceService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/pm_reports")
@Validated
@CrossOrigin(origins = "*", allowedHeaders ="*", methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class PreventiveMaintenanceController 
{
    private static final Logger log = LoggerFactory.getLogger(PreventiveMaintenanceController.class);

    @Autowired
    private PreventiveMaintenanceReportRepository repository;

    private final PreventiveMaintenanceService service;

    public PreventiveMaintenanceController(
            PreventiveMaintenanceService service) {
        this.service = service;
    }

    @GetMapping("/count")
    public ResponseEntity<Long> getCount() {
        return ResponseEntity.ok(service.getReportCount());
    }
    
    @GetMapping("/sensor/{sensorId}/count")
    public ResponseEntity<Map<String, Integer>> getSensorVisitCount(@PathVariable String sensorId) {
        try {
            int count = repository.countBySensorId(sensorId);
            Map<String, Integer> response = new HashMap<>();
            response.put("count", count);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error getting sensor count: {}", e.getMessage());
            return ResponseEntity.ok(Map.of("count", 0));
        }
    }
    
    @PostMapping
    public ResponseEntity<PMReportResponse> saveReport(
            @Valid @RequestBody PMReportRequest request) {
        PMReportResponse response = service.saveReport(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<PMReportSummaryResponse>> getAllReports() {
        return ResponseEntity.ok(service.getAllReports());
    }

    @GetMapping("/by-number/{serviceReportNo}")
    public ResponseEntity<PMReportResponse> getReportByServiceReportNo(@PathVariable String serviceReportNo) {
        return ResponseEntity.ok(service.getReportByServiceReportNo(serviceReportNo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PMReportResponse> getReport(@PathVariable Long id) {
        try {
            PMReportResponse report = service.getReport(id);
            return ResponseEntity.ok(report);
        } catch (Exception e) {
            log.error("Error fetching report: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<PMReportResponse> updateReport(
            @PathVariable Long id,
            @Valid @RequestBody PMReportRequest request) {
        return ResponseEntity.ok(service.updateReport(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReport(@PathVariable Long id) {
        service.deleteReport(id);
        return ResponseEntity.noContent().build();
    }
}