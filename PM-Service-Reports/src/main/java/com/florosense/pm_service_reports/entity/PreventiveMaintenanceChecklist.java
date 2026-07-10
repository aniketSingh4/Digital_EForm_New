package com.florosense.pm_service_reports.entity;


import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "pm_checklist")
@Data
public class PreventiveMaintenanceChecklist 
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id")
    private PreventiveMaintenanceReport report;

    @Enumerated(EnumType.STRING)
    private ChecklistCategory category;

    @Column(nullable = false)
    private String itemName;

    @Enumerated(EnumType.STRING)
    private InspectionStatus status;

    @Column(length = 1000)
    private String remark;

	
}
