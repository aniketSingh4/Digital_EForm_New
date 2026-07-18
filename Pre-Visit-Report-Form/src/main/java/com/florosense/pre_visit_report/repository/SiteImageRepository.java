package com.florosense.pre_visit_report.repository;

import com.florosense.pre_visit_report.entity.SiteImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SiteImageRepository extends JpaRepository<SiteImage, Long> 
{
    List<SiteImage> findByReportId(Long reportId);
    List<SiteImage> findByReportIdAndIsFinal(Long reportId, Boolean isFinal);
    void deleteByReportId(Long reportId);
}