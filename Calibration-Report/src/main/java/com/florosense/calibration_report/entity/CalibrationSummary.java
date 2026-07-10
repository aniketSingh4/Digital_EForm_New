package com.florosense.calibration_report.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "calibration_summary")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalibrationSummary {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "calibration_successful")
    private Boolean calibrationSuccessful;
    
    @Column(name = "calibration_adjustment_performed")
    private Boolean calibrationAdjustmentPerformed;
    
    @Column(name = "sensor_within_acceptable_limits")
    private Boolean sensorWithinAcceptableLimits;
    
    @Column(name = "sensor_requires_replacement")
    private Boolean sensorRequiresReplacement;
}
