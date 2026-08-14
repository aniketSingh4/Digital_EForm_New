package com.florosense.pm_service_reports.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Locale;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class PmReportsSchemaGuard implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PmReportsSchemaGuard.class);
    private static final String TABLE = "pm_reports";
    private static final int TARGET_LENGTH = 64;

    private final DataSource dataSource;

    public PmReportsSchemaGuard(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @Override
    public void run(ApplicationArguments args) {
        try (Connection connection = dataSource.getConnection()) {
            widenColumn(connection, "preventive_maintenance_status",
                    new String[] { "SATISFACTORY", "FOLLOW_UP_VISIT_REQUIRED", "REQUIRES_ATTENTION" });
            widenColumn(connection, "site_condition_after_pm",
                    new String[] { "SYSTEM_OPERATIONAL", "SYSTEM_NOT_OPERATIONAL", "SYSTEM_OPERATIONAL_WITH_OBSERVATION" });
        } catch (Exception ex) {
            log.error("PM summary column widen failed: {}", ex.getMessage(), ex);
            throw new IllegalStateException("Failed to ensure pm_reports summary columns are varchar(64)", ex);
        }
    }

    private void widenColumn(Connection connection, String column, String[] ordinalNames) throws Exception {
        ColumnMeta meta = readColumnMeta(connection, column);
        if (meta == null) {
            log.warn("Column {}.{} not found; Hibernate ddl-auto will create it", TABLE, column);
            return;
        }

        boolean integerType = isIntegerType(meta);
        boolean needsWiden = integerType
                || isNativeEnum(meta)
                || meta.characterMaximumLength == null
                || meta.characterMaximumLength < TARGET_LENGTH;

        if (needsWiden) {
            String sql = "ALTER TABLE " + TABLE + " ALTER COLUMN " + column
                    + " TYPE varchar(" + TARGET_LENGTH + ") USING " + column + "::text";
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
            }
            log.info("Widened {}.{} from {}({}) / {} to varchar({})",
                    TABLE, column, meta.dataType, meta.characterMaximumLength, meta.udtName, TARGET_LENGTH);
        } else {
            log.info("Column {}.{} already {}({})", TABLE, column, meta.dataType, meta.characterMaximumLength);
        }

        migrateOrdinals(connection, column, ordinalNames);
        migrateTruncatedValues(connection, column);
    }

    private void migrateTruncatedValues(Connection connection, String column) throws Exception {
        String[][] repairs;
        if ("preventive_maintenance_status".equals(column)) {
            repairs = new String[][] {
                    { "FOLLOW_UP_VISIT_REQUIRED", "FOLLOW%" },
                    { "REQUIRES_ATTENTION", "REQUIR%" }
            };
        } else if ("site_condition_after_pm".equals(column)) {
            repairs = new String[][] {
                    { "SYSTEM_OPERATIONAL_WITH_OBSERVATION", "SYSTEM_OPERATIONAL_WITH%" },
                    { "SYSTEM_NOT_OPERATIONAL", "SYSTEM_NOT%" },
                    { "SYSTEM_NOT_OPERATIONAL", "%NON_OPER%" }
            };
        } else {
            return;
        }

        for (String[] repair : repairs) {
            String sql = "UPDATE " + TABLE + " SET " + column + " = ? WHERE " + column + " LIKE ? AND " + column + " <> ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, repair[0]);
                ps.setString(2, repair[1]);
                ps.setString(3, repair[0]);
                int updated = ps.executeUpdate();
                if (updated > 0) {
                    log.info("Repaired truncated {}.{} values matching {} -> {} ({} rows)",
                            TABLE, column, repair[1], repair[0], updated);
                }
            }
        }
    }

    private void migrateOrdinals(Connection connection, String column, String[] ordinalNames) throws Exception {
        for (int i = 0; i < ordinalNames.length; i++) {
            String sql = "UPDATE " + TABLE + " SET " + column + " = ? WHERE " + column + " = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, ordinalNames[i]);
                ps.setString(2, String.valueOf(i));
                int updated = ps.executeUpdate();
                if (updated > 0) {
                    log.info("Migrated {}.{} ordinal {} -> {} ({} rows)", TABLE, column, i, ordinalNames[i], updated);
                }
            }
        }
    }

    private ColumnMeta readColumnMeta(Connection connection, String column) throws Exception {
        String sql = """
                SELECT data_type, character_maximum_length, udt_name
                FROM information_schema.columns
                WHERE table_schema = current_schema() AND table_name = ? AND column_name = ?
                """;
        try (PreparedStatement ps = connection.prepareStatement(sql)) {
            ps.setString(1, TABLE);
            ps.setString(2, column);
            try (ResultSet rs = ps.executeQuery()) {
                if (!rs.next()) {
                    return null;
                }
                Integer length = rs.getObject("character_maximum_length") != null
                        ? rs.getInt("character_maximum_length")
                        : null;
                return new ColumnMeta(
                        rs.getString("data_type"),
                        length,
                        rs.getString("udt_name"));
            }
        }
    }

    private boolean isIntegerType(ColumnMeta meta) {
        String type = safe(meta.dataType);
        String udt = safe(meta.udtName);
        return type.contains("int") || udt.contains("int") || "numeric".equals(type);
    }

    private boolean isNativeEnum(ColumnMeta meta) {
        String type = safe(meta.dataType);
        String udt = safe(meta.udtName);
        return "user-defined".equals(type) || type.contains("enum") || (!udt.isBlank() && !udt.startsWith("varchar")
                && !udt.startsWith("bpchar") && !udt.startsWith("text") && !udt.contains("int")
                && !udt.equals("numeric") && !udt.equals("bool"));
    }

    private String safe(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT);
    }

    private record ColumnMeta(String dataType, Integer characterMaximumLength, String udtName) {
    }
}
