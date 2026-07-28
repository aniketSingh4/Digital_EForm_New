package com.florosense.installation_report.repository;

import com.florosense.installation_report.entity.InstallationSiteImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InstallationSiteImageRepository extends JpaRepository<InstallationSiteImage, Long> 
{
    List<InstallationSiteImage> findByInstallationReportId(Long reportId);
    List<InstallationSiteImage> findByInstallationReportIdAndIsFinal(Long reportId, Boolean isFinal);
    void deleteByInstallationReportId(Long reportId);
    long countByInstallationReportId(Long reportId);
    
    @Query("SELECT si FROM InstallationSiteImage si WHERE si.installationReport.id = :reportId AND si.id = :imageId")
    Optional<InstallationSiteImage> findByReportIdAndImageId(@Param("reportId") Long reportId, @Param("imageId") Long imageId);
}