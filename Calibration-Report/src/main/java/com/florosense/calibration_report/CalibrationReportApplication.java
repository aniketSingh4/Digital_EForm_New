package com.florosense.calibration_report;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class CalibrationReportApplication {

	public static void main(String[] args) {
		SpringApplication.run(CalibrationReportApplication.class, args);
	}

}
