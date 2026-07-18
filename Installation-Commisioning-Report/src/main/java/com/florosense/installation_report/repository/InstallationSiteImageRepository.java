package com.florosense.installation_report.repository;

import com.florosense.installation_report.entity.InstallationSiteImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InstallationSiteImageRepository extends JpaRepository<InstallationSiteImage, Long> 
{
    List<InstallationSiteImage> findByInstallationReportId(Long reportId);
    List<InstallationSiteImage> findByInstallationReportIdAndIsFinal(Long reportId, Boolean isFinal);
    void deleteByInstallationReportId(Long reportId);
    long countByInstallationReportId(Long reportId);
}