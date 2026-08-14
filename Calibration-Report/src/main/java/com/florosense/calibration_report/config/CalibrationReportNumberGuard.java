package com.florosense.calibration_report.config;

import java.sql.Connection;
import java.sql.Statement;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class CalibrationReportNumberGuard implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(CalibrationReportNumberGuard.class);

    private final DataSource dataSource;

    public CalibrationReportNumberGuard(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            int reports = statement.executeUpdate(
                    "UPDATE calibration_reports SET report_no = REPLACE(report_no, 'FLO_CAL_-', 'FLO_CAL_') "
                            + "WHERE report_no LIKE 'FLO_CAL_-%'");
            int serials = statement.executeUpdate(
                    "UPDATE calibration_reports SET serial_no = REPLACE(serial_no, 'FLO_SER_-', 'FLO_SER_') "
                            + "WHERE serial_no LIKE 'FLO_SER_-%'");
            if (reports > 0 || serials > 0) {
                log.info("Normalized calibration IDs: {} report numbers, {} serial numbers", reports, serials);
            }
        } catch (Exception ex) {
            log.warn("Calibration report number normalize skipped: {}", ex.getMessage());
        }
    }
}
