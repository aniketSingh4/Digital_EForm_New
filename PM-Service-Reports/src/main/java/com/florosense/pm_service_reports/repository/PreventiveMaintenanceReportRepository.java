package com.florosense.pm_service_reports.repository;

import com.florosense.pm_service_reports.entity.PreventiveMaintenanceReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PreventiveMaintenanceReportRepository extends JpaRepository<PreventiveMaintenanceReport, Long> {

    boolean existsByServiceReportNo(String serviceReportNo);

    Optional<PreventiveMaintenanceReport> findByServiceReportNo(String serviceReportNo);

    Optional<PreventiveMaintenanceReport> findFirstByServiceReportNoStartingWithOrderByServiceReportNoDesc(String prefix);

    // Count reports for a specific year using YEAR function (HQL)
    @Query("SELECT COUNT(r) FROM PreventiveMaintenanceReport r WHERE YEAR(r.createdAt) = :year")
    long countByYear(@Param("year") String year);

    // Count reports for a specific month using MONTH and YEAR functions (HQL)
    @Query("SELECT COUNT(r) FROM PreventiveMaintenanceReport r WHERE YEAR(r.createdAt) = :year AND MONTH(r.createdAt) = :month")
    long countByMonth(@Param("year") int year, @Param("month") int month);

    // Count reports for a specific month-year using string comparison
    @Query("SELECT COUNT(r) FROM PreventiveMaintenanceReport r WHERE FUNCTION('DATE_FORMAT', r.createdAt, '%Y-%m') = :monthYear")
    long countByMonthYear(@Param("monthYear") String monthYear);

    // Find reports for a specific year
    @Query("SELECT r FROM PreventiveMaintenanceReport r WHERE YEAR(r.createdAt) = :year")
    List<PreventiveMaintenanceReport> findByYear(@Param("year") int year);

    // Find reports for a specific month
    @Query("SELECT r FROM PreventiveMaintenanceReport r WHERE YEAR(r.createdAt) = :year AND MONTH(r.createdAt) = :month")
    List<PreventiveMaintenanceReport> findByMonth(@Param("year") int year, @Param("month") int month);

    // Native SQL query for PostgreSQL/H2 (more efficient)
    @Query(value = "SELECT COUNT(*) FROM pm_reports WHERE EXTRACT(YEAR FROM created_at) = :year", nativeQuery = true)
    long countByYearNative(@Param("year") int year);

    // Native SQL query for PostgreSQL/H2 by month
    @Query(value = "SELECT COUNT(*) FROM pm_reports WHERE EXTRACT(YEAR_MONTH FROM created_at) = :yearMonth", nativeQuery = true)
    long countByYearMonthNative(@Param("yearMonth") int yearMonth);
    
    // In PreventiveMaintenanceReportRepository.java
    @Query("SELECT COUNT(r) FROM PreventiveMaintenanceReport r WHERE r.sensorId = :sensorId")
    int countBySensorId(@Param("sensorId") String sensorId);

    @Query(value = "SELECT pg_advisory_xact_lock(:lockKey)", nativeQuery = true)
    List<Object> acquirePmReportNumberLock(@Param("lockKey") long lockKey);
}