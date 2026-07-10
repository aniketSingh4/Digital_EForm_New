package com.florosense.pre_visit_report.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.florosense.pre_visit_report.entity.PreVisitReport;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PreVisitReportRepository extends JpaRepository<PreVisitReport, Long> {

    List<PreVisitReport> findByCompanyNameContainingIgnoreCase(String companyName);

    List<PreVisitReport> findByVisitDateBetween(LocalDate startDate, LocalDate endDate);

    List<PreVisitReport> findByInspectedBy(String inspectedBy);

    @Query("SELECT p FROM PreVisitReport p WHERE p.companyName LIKE %:keyword% OR p.sitePersonName LIKE %:keyword% OR p.emailId LIKE %:keyword%")
    List<PreVisitReport> searchByKeyword(@Param("keyword") String keyword);

    boolean existsByEmailId(String emailId);
}