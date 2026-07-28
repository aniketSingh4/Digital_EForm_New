package com.florosense.pre_visit_report.repository;

import com.florosense.pre_visit_report.entity.SiteImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SiteImageRepository extends JpaRepository<SiteImage, Long> 
{
    List<SiteImage> findByReportId(Long reportId);
    List<SiteImage> findByReportIdAndIsFinal(Long reportId, Boolean isFinal);
    void deleteByReportId(Long reportId);
    long countByReportId(Long reportId);
    
    //Method to find image with its data for a specific report
    @Query("SELECT si FROM SiteImage si WHERE si.report.id = :reportId AND si.id = :imageId")
    Optional<SiteImage> findByReportIdAndImageId(@Param("reportId") Long reportId, @Param("imageId") Long imageId);
}