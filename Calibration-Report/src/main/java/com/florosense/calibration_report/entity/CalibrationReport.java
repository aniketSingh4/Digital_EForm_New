package com.florosense.calibration_report.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDate;

@Entity
@Table(name = "calibration_reports")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalibrationReport {
    
    @Id
    @GeneratedValue(generator = "uuid2")
    @GenericGenerator(name = "uuid2", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(name = "id", columnDefinition = "VARCHAR(255)")
    private String id;
    
    @Column(name = "report_no", unique = true, nullable = false)
    private String reportNo;
    
    @Column(name = "report_date")
    private LocalDate reportDate;
    
    @Column(name = "client_name")
    private String clientName;
    
    @Column(name = "site_name")
    private String siteName;
    
    @Column(name = "site_address")
    private String siteAddress;
    
    @Column(name = "sensor_id")
    private String sensorId;
    
    @Column(name = "model_no")
    private String modelNo;
    
    @Column(name = "serial_no", unique = true)
    private String serialNo;
    
    @Column(name = "calibration_date")
    private LocalDate calibrationDate;
    
    @Column(name = "calibration_due_date")
    private LocalDate calibrationDueDate;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "master_ref_id")
    private MasterRefInstrument masterRefInstrument;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "before_calibration_id")
    private ReadingBeforeCalibration readingBeforeCalibration;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "after_calibration_id")
    private ReadingAfterCalibration readingAfterCalibration;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "summary_id")
    private CalibrationSummary calibrationSummary;
    
    @Column(name = "remarks", columnDefinition = "TEXT")
    private String remarks;
    
    @Column(name = "declaration", columnDefinition = "TEXT")
    private String declaration;
    
    @OneToOne(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "engineer_id")
    private EngineerDetails engineerDetails;
}
