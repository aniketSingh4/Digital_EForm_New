package com.florosense.pre_visit_report;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class PreVisitReportFormApplication 
{
    public static void main(String[] args) 
    {
        SpringApplication.run(PreVisitReportFormApplication.class, args);
    }
}
