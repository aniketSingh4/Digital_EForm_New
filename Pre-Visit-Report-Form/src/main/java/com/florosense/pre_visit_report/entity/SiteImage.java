package com.florosense.pre_visit_report.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "previsit_site_images")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SiteImage 
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    //Store image as byte array in database
    @Lob
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "report_id", nullable = false)
    private PreVisitReport report;

    @CreationTimestamp
    @Column(name = "uploaded_at", updatable = false)
    private LocalDateTime uploadedAt;

    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;
}