package com.florosense.calibration_report.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "reading_after_calibration")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReadingAfterCalibration {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "pm25_value")
    private Double pm25Value;
    
    @Column(name = "pm10_value")
    private Double pm10Value;
    
    @Column(name = "temp")
    private Double temp;
    
    @Column(name = "humidity")
    private Double humidity;
}
