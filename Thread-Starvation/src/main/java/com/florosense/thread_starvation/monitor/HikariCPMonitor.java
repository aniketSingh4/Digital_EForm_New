package com.florosense.thread_starvation.monitor;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;
import com.zaxxer.hikari.HikariDataSource;
import com.zaxxer.hikari.pool.HikariPool;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import javax.sql.DataSource;
import java.lang.reflect.Method;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class HikariCPMonitor {
 
    private static final Logger log = LoggerFactory.getLogger(HikariCPMonitor.class);
    
    private final DataSource dataSource;
    private final ThreadStarvationProperties properties;
    private final Map<String, AtomicLong> warningCounts = new ConcurrentHashMap<>();
    private long previousTimestamp = System.currentTimeMillis();
    private boolean isAvailable = false;
    
    public HikariCPMonitor(DataSource dataSource, ThreadStarvationProperties properties) {
        this.dataSource = dataSource;
        this.properties = properties;
        
        // ⭐ Check if DataSource is available and is HikariCP
        if (dataSource != null && dataSource instanceof HikariDataSource) {
            this.isAvailable = true;
            log.info("✅ HikariCP Monitor initialized with threshold: {}ms", 
                    properties.getHikari().getWarningThreshold());
        } else {
            log.info("⚠️ HikariCP Monitor disabled - DataSource not available");
        }
    }
    
    @Scheduled(fixedDelayString = "${thread.starvation.detectionInterval:60000}")
    public void monitor() {
        // ⭐ Skip if not available
        if (!isAvailable || !properties.isEnabled() || !properties.getHikari().isEnabled()) {
            return;
        }
        
        try {
            if (dataSource instanceof HikariDataSource) {
                HikariDataSource hikari = (HikariDataSource) dataSource;
                HikariPool pool = getPool(hikari);
                
                if (pool != null) {
                    int active = getActiveConnections(pool);
                    int idle = getIdleConnections(pool);
                    int total = getTotalConnections(pool);
                    int awaiting = getThreadsAwaitingConnection(pool);
                    
                    log.debug("HikariCP: Active={}, Idle={}, Total={}, Awaiting={}", 
                            active, idle, total, awaiting);
                    
                    if (awaiting > 5) {
                        String warningKey = "thread_starvation";
                        AtomicLong count = warningCounts.computeIfAbsent(warningKey, 
                                k -> new AtomicLong(0));
                        long currentCount = count.incrementAndGet();
                        
                        log.warn("⚠️ THREAD STARVATION DETECTED! {} threads waiting for connections. " +
                                "Active: {}, Total: {}, Pool: {}", 
                                awaiting, active, total, hikari.getPoolName());
                        
                        if (currentCount > 3) {
                            log.error("🚨 PERSISTENT THREAD STARVATION! {} occurrences detected.", currentCount);
                            count.set(0);
                        }
                    } else {
                        warningCounts.remove("thread_starvation");
                    }
                    
                    if (total > 0 && active > total * 0.8) {
                        log.warn("⚠️ CONNECTION POOL PRESSURE: {}% of connections active.", 
                                (active * 100 / total));
                    }
                    
                    long currentTime = System.currentTimeMillis();
                    long delta = currentTime - previousTimestamp;
                    if (Math.abs(delta - 60000) > 5000) {
                        log.warn("⚠️ CLOCK LEAP DETECTED in HikariCP: Delta = {}ms", delta);
                        previousTimestamp = currentTime;
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error monitoring HikariCP pool: {}", e.getMessage());
        }
    }
    
    private HikariPool getPool(HikariDataSource hikari) {
        try {
            Method method = HikariDataSource.class.getDeclaredMethod("getPool");
            method.setAccessible(true);
            return (HikariPool) method.invoke(hikari);
        } catch (Exception e) {
            log.debug("Could not access HikariPool: {}", e.getMessage());
            return null;
        }
    }
    
    private int getActiveConnections(HikariPool pool) {
        try {
            Method method = pool.getClass().getMethod("getActiveConnections");
            return (int) method.invoke(pool);
        } catch (Exception e) {
            return 0;
        }
    }
    
    private int getIdleConnections(HikariPool pool) {
        try {
            Method method = pool.getClass().getMethod("getIdleConnections");
            return (int) method.invoke(pool);
        } catch (Exception e) {
            return 0;
        }
    }
    
    private int getTotalConnections(HikariPool pool) {
        try {
            Method method = pool.getClass().getMethod("getTotalConnections");
            return (int) method.invoke(pool);
        } catch (Exception e) {
            return 0;
        }
    }
    
    private int getThreadsAwaitingConnection(HikariPool pool) {
        try {
            Method method = pool.getClass().getMethod("getThreadsAwaitingConnection");
            return (int) method.invoke(pool);
        } catch (Exception e) {
            return 0;
        }
    }
    
    public Map<String, Object> getPoolStatus() {
        Map<String, Object> status = new ConcurrentHashMap<>();
        status.put("available", isAvailable);
        
        if (!isAvailable) {
            status.put("message", "DataSource not available");
            return status;
        }
        
        if (dataSource instanceof HikariDataSource) {
            HikariDataSource hikari = (HikariDataSource) dataSource;
            HikariPool pool = getPool(hikari);
            
            if (pool != null) {
                status.put("poolName", hikari.getPoolName());
                status.put("activeConnections", getActiveConnections(pool));
                status.put("idleConnections", getIdleConnections(pool));
                status.put("totalConnections", getTotalConnections(pool));
                status.put("threadsAwaiting", getThreadsAwaitingConnection(pool));
                status.put("maxPoolSize", hikari.getMaximumPoolSize());
                status.put("minIdle", hikari.getMinimumIdle());
                status.put("connectionTimeout", hikari.getConnectionTimeout());
                status.put("leakDetectionThreshold", hikari.getLeakDetectionThreshold());
            }
        }
        
        status.put("warningCount", warningCounts);
        return status;
    }
}