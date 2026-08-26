package com.florosense.installation_report.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.florosense.installation_report.dto.InstallationReportSummaryResponse;
import com.florosense.installation_report.entity.InstallationReport;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstallationReportRepository extends JpaRepository<InstallationReport, Long> 
{
    
    Optional<InstallationReport> findByReportNo(String reportNo);
    
    boolean existsByReportNo(String reportNo);

    @Query("""
            SELECT new com.florosense.installation_report.dto.InstallationReportSummaryResponse(
                r.id, r.reportNo, r.date, r.installedBy, r.companyName, r.siteAddress, r.customerName, r.workConfirmation)
            FROM InstallationReport r
            ORDER BY r.date DESC
            """)
    List<InstallationReportSummaryResponse> findAllSummaries();

    @Query("""
            SELECT new com.florosense.installation_report.dto.InstallationReportSummaryResponse(
                r.id, r.reportNo, r.date, r.installedBy, r.companyName, r.siteAddress, r.customerName, r.workConfirmation)
            FROM InstallationReport r
            WHERE r.date BETWEEN :startDate AND :endDate
            ORDER BY r.date DESC
            """)
    List<InstallationReportSummaryResponse> findSummariesByDateBetween(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate);

    @Query("""
            SELECT new com.florosense.installation_report.dto.InstallationReportSummaryResponse(
                r.id, r.reportNo, r.date, r.installedBy, r.companyName, r.siteAddress, r.customerName, r.workConfirmation)
            FROM InstallationReport r
            WHERE r.installedBy = :installedBy
            ORDER BY r.date DESC
            """)
    List<InstallationReportSummaryResponse> findSummariesByInstalledBy(@Param("installedBy") String installedBy);
}
