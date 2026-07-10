package com.florosense.calibration_report.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.florosense.calibration_report.entity.CalibrationReport;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalibrationReportRepository extends JpaRepository<CalibrationReport, String> 
{
    
    Optional<CalibrationReport> findByReportNo(String reportNo);
    
    Optional<CalibrationReport> findBySerialNo(String serialNo);
    
    boolean existsByReportNo(String reportNo);
    
    boolean existsBySerialNo(String serialNo);
    
    List<CalibrationReport> findByClientNameContainingIgnoreCase(String clientName);
    
    List<CalibrationReport> findByReportDateBetween(LocalDate startDate, LocalDate endDate);
    
    @Query("SELECT r FROM CalibrationReport r WHERE r.calibrationDueDate < :date")
    List<CalibrationReport> findOverdueReports(@Param("date") LocalDate date);
    
    @Query("SELECT COUNT(r) FROM CalibrationReport r WHERE r.calibrationSummary.calibrationSuccessful = true")
    long countSuccessfulCalibrations();
    
    @Query("SELECT r FROM CalibrationReport r ORDER BY r.reportDate DESC")
    List<CalibrationReport> findRecentReports();
}