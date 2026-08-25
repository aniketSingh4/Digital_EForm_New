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
            // Normalize to FLO_CAL_yyyyMMdd-NNNN / FLO_SER_yyyyMMdd-NNNN
            int reports = statement.executeUpdate(
                    "UPDATE calibration_reports SET report_no = "
                            + "regexp_replace(report_no, '^FLO_CAL[_-]+(\\d{8})-?(\\d{4})$', 'FLO_CAL_\\1-\\2') "
                            + "WHERE report_no ~ '^FLO_CAL[_-]+\\d{8}-?\\d{4}$' "
                            + "AND report_no !~ '^FLO_CAL_\\d{8}-\\d{4}$'");
            int serials = statement.executeUpdate(
                    "UPDATE calibration_reports SET serial_no = "
                            + "regexp_replace(serial_no, '^FLO_SER[_-]+(\\d{8})-?(\\d{4})$', 'FLO_SER_\\1-\\2') "
                            + "WHERE serial_no ~ '^FLO_SER[_-]+\\d{8}-?\\d{4}$' "
                            + "AND serial_no !~ '^FLO_SER_\\d{8}-\\d{4}$'");
            if (reports > 0 || serials > 0) {
                log.info("Normalized calibration IDs: {} report numbers, {} serial numbers", reports, serials);
            }
        } catch (Exception ex) {
            log.warn("Calibration report number normalize skipped: {}", ex.getMessage());
        }
    }
}
