package com.florosense.pm_service_reports.repository;


import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.florosense.pm_service_reports.entity.PreventiveMaintenanceChecklist;


@Repository
public interface PreventiveMaintenanceChecklistRepository
        extends JpaRepository<PreventiveMaintenanceChecklist, Long> 
{

    List<PreventiveMaintenanceChecklist> findByReportId(Long reportId);

}
