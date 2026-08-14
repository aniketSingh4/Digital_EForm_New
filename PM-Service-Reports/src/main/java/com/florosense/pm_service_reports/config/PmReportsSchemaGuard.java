package com.florosense.pm_service_reports.config;

import java.sql.Connection;
import java.sql.Statement;

import javax.sql.DataSource;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class PmReportsSchemaGuard implements ApplicationRunner {

    private final DataSource dataSource;

    public PmReportsSchemaGuard(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute(
                    "ALTER TABLE pm_reports ALTER COLUMN site_condition_after_pm TYPE varchar(64) USING site_condition_after_pm::text");
            statement.execute(
                    "ALTER TABLE pm_reports ALTER COLUMN preventive_maintenance_status TYPE varchar(64) USING preventive_maintenance_status::text");
        } catch (Exception ex) {
            System.out.println("PM summary column widen skipped: " + ex.getMessage());
        }
    }
}
