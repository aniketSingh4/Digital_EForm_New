package com.florosense.installation_report.repository;


import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.florosense.installation_report.entity.InstallationReport;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InstallationReportRepository extends JpaRepository<InstallationReport, Long> 
{
    
    Optional<InstallationReport> findByReportNo(String reportNo);
    
    List<InstallationReport> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);
    
    List<InstallationReport> findByInstalledBy(String installedBy);
    
    boolean existsByReportNo(String reportNo);
}