package com.florosense.pm_service_reports.repository;


import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceSignOff;


@Repository
public interface PreventiveMaintenanceSignOffRepository
        extends JpaRepository<PreventiveMaintenanceSignOff, Long> {

    Optional<PreventiveMaintenanceSignOff> findByReportId(Long reportId);

}
