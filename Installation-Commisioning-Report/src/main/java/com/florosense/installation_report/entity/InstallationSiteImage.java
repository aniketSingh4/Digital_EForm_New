// src/main/java/com/florosense/installation_report/entity/InstallationSiteImage.java
package com.florosense.installation_report.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.type.descriptor.jdbc.BinaryJdbcType;
import java.time.LocalDateTime;

@Entity
@Table(name = "installation_site_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties({"installationReport"})
public class InstallationSiteImage 
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Lob
    @JdbcType(BinaryJdbcType.class)
    @Column(name = "image_data", columnDefinition = "BYTEA")
    private byte[] imageData;

    @Column(name = "image_url", nullable = false, columnDefinition = "TEXT")
    private String imageUrl;

    @Column(name = "image_name", length = 255)
    private String imageName;

    @Column(name = "image_type", length = 50)
    private String imageType;

    @Column(name = "image_size")
    private Long imageSize;

    @Column(name = "is_final")
    private Boolean isFinal = false;

    @Column(name = "description", length = 500)
    private String description;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private InstallationReport installationReport;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;
}