package com.florosense.calibration_report.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "master_ref_instruments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MasterRefInstrument 
{
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    
    @Column(name = "ref_serial_no")
    private String refSerialNo;
    
    @Column(name = "calibration_certificate_no")
    private String calibrationCertificateNo;
    
    @Column(name = "certificate_validity")
    private String certificateValidity;
}
