package com.florosense.pm_service_reports.config;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

import javax.sql.DataSource;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.BeansException;
import org.springframework.beans.factory.config.BeanPostProcessor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class PmReportsSchemaGuard implements BeanPostProcessor {

    private static final Logger log = LoggerFactory.getLogger(PmReportsSchemaGuard.class);
    private static final String TABLE = "pm_reports";
    private static final String SITE_COLUMN = "site_condition_after_pm";
    private static final int TARGET_LENGTH = 64;
    private static final AtomicBoolean REPAIRED = new AtomicBoolean(false);

    @Override
    public Object postProcessAfterInitialization(Object bean, String beanName) throws BeansException {
        if (bean instanceof DataSource dataSource) {
            repairOnce(dataSource);
        }
        return bean;
    }

    private void repairOnce(DataSource dataSource) {
        if (!REPAIRED.compareAndSet(false, true)) {
            return;
        }
        try (Connection connection = dataSource.getConnection()) {
            widenColumn(connection, "preventive_maintenance_status",
                    new String[] { "SATISFACTORY", "FOLLOW_UP_VISIT_REQUIRED", "REQUIRES_ATTENTION" }, false);
            recreateSiteConditionAsText(connection);
            ensureSiteConditionKeyColumn(connection);
        } catch (Exception ex) {
            REPAIRED.set(false);
            log.error("PM summary column repair failed: {}", ex.getMessage(), ex);
            throw new IllegalStateException("Failed to ensure pm_reports site_condition_after_pm is text", ex);
        }
    }

    private void recreateSiteConditionAsText(Connection connection) throws Exception {
        ColumnMeta meta = readColumnMeta(connection, SITE_COLUMN);
        if (meta == null) {
            log.warn("Column {}.{} not found; Hibernate ddl-auto will create it", TABLE, SITE_COLUMN);
            return;
        }

        dropDefault(connection, SITE_COLUMN);
        dropColumnChecksAndTriggers(connection);
        dropNotNull(connection, SITE_COLUMN);

        boolean alreadyText = "text".equalsIgnoreCase(safe(meta.dataType)) || "text".equalsIgnoreCase(safe(meta.udtName));
        if (isNativeEnum(meta) || isIntegerType(meta)) {
            try (Statement statement = connection.createStatement()) {
                statement.execute("ALTER TABLE " + TABLE + " ADD COLUMN IF NOT EXISTS site_condition_tmp text");
                statement.execute("UPDATE " + TABLE + " SET site_condition_tmp = " + SITE_COLUMN + "::text");
                statement.execute("ALTER TABLE " + TABLE + " DROP COLUMN " + SITE_COLUMN);
                statement.execute("ALTER TABLE " + TABLE + " RENAME COLUMN site_condition_tmp TO " + SITE_COLUMN);
            }
            log.info("Replaced enum/integer {}.{} with a new text column (was {} / {})",
                    TABLE, SITE_COLUMN, meta.dataType, meta.udtName);
            dropOrphanSiteConditionEnums(connection);
        } else if (!alreadyText) {
            String sql = "ALTER TABLE " + TABLE + " ALTER COLUMN " + SITE_COLUMN
                    + " TYPE text USING " + SITE_COLUMN + "::text";
            try (Statement statement = connection.createStatement()) {
                statement.execute(sql);
            }
            log.info("Converted {}.{} to text from {}({}) / {}",
                    TABLE, SITE_COLUMN, meta.dataType, meta.characterMaximumLength, meta.udtName);
        } else {
            log.info("Column {}.{} already text", TABLE, SITE_COLUMN);
        }

        migrateOrdinals(connection, SITE_COLUMN,
                new String[] { "SYSTEM_OPERATIONAL", "SYSTEM_NOT_OPERATIONAL", "SYSTEM_OPERATIONAL_WITH_OBSERVATION" });
        repairTruncatedSiteCondition(connection);
    }

    private void ensureSiteConditionKeyColumn(Connection connection) throws Exception {
        try (Statement statement = connection.createStatement()) {
            statement.execute("ALTER TABLE " + TABLE + " ADD COLUMN IF NOT EXISTS site_condition_key varchar(16)");
        }
        log.info("Ensured {}.site_condition_key varchar(16)", TABLE);
        String[][] backfill = {
                { "SC_DOWN", "SYSTEM_NOT_OPERATIONAL" },
                { "SC_OBS", "SYSTEM_OPERATIONAL_WITH_OBSERVATION" },
                { "SC_OK", "SYSTEM_OPERATIONAL" }
        };
        for (String[] row : backfill) {
            String sql = "UPDATE " + TABLE + " SET site_condition_key = ? "
                    + "WHERE site_condition_key IS NULL AND site_condition_after_pm = ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, row[0]);
                ps.setString(2, row[1]);
                int updated = ps.executeUpdate();
                if (updated > 0) {
                    log.info("Backfilled site_condition_key {} from {} ({} rows)", row[0], row[1], updated);
                }
            }
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE " + TABLE + " SET site_condition_key = 'SC_OBS' "
                        + "WHERE site_condition_key IS NULL AND site_condition_after_pm LIKE 'SYSTEM_OPERATIONAL_WITH%'")) {
            int updated = ps.executeUpdate();
            if (updated > 0) {
                log.info("Backfilled site_condition_key SC_OBS from truncated WITH values ({} rows)", updated);
            }
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE " + TABLE + " SET site_condition_key = 'SC_DOWN' "
                        + "WHERE site_condition_key IS NULL AND site_condition_after_pm LIKE 'SYSTEM_NOT%'")) {
            int updated = ps.executeUpdate();
            if (updated > 0) {
                log.info("Backfilled site_condition_key SC_DOWN from truncated NOT values ({} rows)", updated);
            }
        }
    }

    private void dropNotNull(Connection connection, String column) {
        String sql = "ALTER TABLE " + TABLE + " ALTER COLUMN " + column + " DROP NOT NULL";
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
        } catch (Exception ex) {
            log.info("Could not drop NOT NULL on {}.{}: {}", TABLE, column, ex.getMessage());
        }
    }

    private void dropOrphanSiteConditionEnums(Connection connection) {
        String sql = """
                DO $$
                DECLARE t record;
                BEGIN
                  FOR t IN
                    SELECT n.nspname, typ.typname
                    FROM pg_type typ
                    JOIN pg_namespace n ON n.oid = typ.typnamespace
                    WHERE typ.typtype = 'e'
                      AND n.nspname = current_schema()
                      AND (typ.typname ILIKE '%site_condition%' OR typ.typname ILIKE '%sitecondition%')
                  LOOP
                    EXECUTE format('DROP TYPE IF EXISTS %I.%I CASCADE', t.nspname, t.typname);
                  END LOOP;
                END $$;
                """;
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
            log.info("Dropped leftover site-condition enum types if any existed");
        } catch (Exception ex) {
            log.info("No leftover site-condition enum types to drop: {}", ex.getMessage());
        }
    }

    private void dropColumnChecksAndTriggers(Connection connection) {
        String dropChecks = """
                DO $$
                DECLARE r record;
                BEGIN
                  FOR r IN
                    SELECT con.conname
                    FROM pg_constraint con
                    JOIN pg_class rel ON rel.oid = con.conrelid
                    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
                    WHERE rel.relname = 'pm_reports'
                      AND nsp.nspname = current_schema()
                      AND con.contype = 'c'
                      AND pg_get_constraintdef(con.oid) ILIKE '%site_condition_after_pm%'
                  LOOP
                    EXECUTE format('ALTER TABLE pm_reports DROP CONSTRAINT IF EXISTS %I', r.conname);
                  END LOOP;
                END $$;
                """;
        String dropTriggers = """
                DO $$
                DECLARE r record;
                BEGIN
                  FOR r IN
                    SELECT t.tgname
                    FROM pg_trigger t
                    JOIN pg_class c ON t.tgrelid = c.oid
                    JOIN pg_namespace n ON c.relnamespace = n.oid
                    WHERE c.relname = 'pm_reports'
                      AND n.nspname = current_schema()
                      AND NOT t.tgisinternal
                      AND pg_get_triggerdef(t.oid) ILIKE '%site_condition_after_pm%'
                  LOOP
                    EXECUTE format('DROP TRIGGER IF EXISTS %I ON pm_reports', r.tgname);
                  END LOOP;
                END $$;
                """;
        try (Statement statement = connection.createStatement()) {
            statement.execute(dropChecks);
            statement.execute(dropTriggers);
            log.info("Dropped checks/triggers on {}.{} if any existed", TABLE, SITE_COLUMN);
        } catch (Exception ex) {
            log.info("No checks/triggers to drop on {}.{}: {}", TABLE, SITE_COLUMN, ex.getMessage());
        }
    }

    private void widenColumn(Connection connection, String column, String[] ordinalNames, boolean alwaysWiden)
            throws Exception {
        ColumnMeta meta = readColumnMeta(connection, column);
        if (meta == null) {
            log.warn("Column {}.{} not found; Hibernate ddl-auto will create it", TABLE, column);
            return;
        }

        dropDefault(connection, column);

        boolean integerType = isIntegerType(meta);
        boolean needsWiden = alwaysWiden
                || integerType
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
    }

    private void repairTruncatedSiteCondition(Connection connection) throws Exception {
        String[][] repairs = {
                { "SYSTEM_OPERATIONAL_WITH_OBSERVATION", "SYSTEM_OPERATIONAL_WITH%" },
                { "SYSTEM_NOT_OPERATIONAL", "SYSTEM_NOT%" }
        };
        for (String[] repair : repairs) {
            String sql = "UPDATE " + TABLE + " SET site_condition_after_pm = ? "
                    + "WHERE site_condition_after_pm LIKE ? AND site_condition_after_pm <> ?";
            try (PreparedStatement ps = connection.prepareStatement(sql)) {
                ps.setString(1, repair[0]);
                ps.setString(2, repair[1]);
                ps.setString(3, repair[0]);
                int updated = ps.executeUpdate();
                if (updated > 0) {
                    log.info("Repaired truncated site_condition_after_pm matching {} -> {} ({} rows)",
                            repair[1], repair[0], updated);
                }
            }
        }
    }

    private void dropDefault(Connection connection, String column) {
        String sql = "ALTER TABLE " + TABLE + " ALTER COLUMN " + column + " DROP DEFAULT";
        try (Statement statement = connection.createStatement()) {
            statement.execute(sql);
            log.info("Dropped default on {}.{}", TABLE, column);
        } catch (Exception ex) {
            log.info("No default to drop on {}.{}: {}", TABLE, column, ex.getMessage());
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
