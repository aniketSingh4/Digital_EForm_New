package com.florosense.installation_report.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Embeddable
@Data
@NoArgsConstructor
@AllArgsConstructor
public class EquipmentDetail 
{
    
    @Column(name = "model_no", length = 100)
    private String modelNo;
    
    @Column(name = "serial_no", length = 100)
    private String serialNo;
    
    @Column(name = "quantity")
    private Integer quantity;
}