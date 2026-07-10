package com.florosense.calibration_report.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Entity
@Table(name = "engineer_details")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EngineerDetails 
{
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "engineer_name")
    private String engineerName;
    
    @Column(name = "signature", columnDefinition = "TEXT")
    private String signature;
    
    @Column(name = "date")
    private LocalDate date;
}
