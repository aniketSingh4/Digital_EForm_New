package com.florosense.thread_starvation.monitor;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class ThreadStarvationDetector {
    
    private static final Logger log = LoggerFactory.getLogger(ThreadStarvationDetector.class);
    
    private final HikariCPMonitor hikariMonitor;
    private final ThreadPoolMonitor threadPoolMonitor;
    private final ClockLeapDetector clockLeapDetector;
    private final ThreadStarvationProperties properties;
    private int consecutiveWarnings = 0;
    
    // ⭐ Make all monitors optional with @Autowired(required = false)
    @Autowired
    public ThreadStarvationDetector(
            @Autowired(required = false) HikariCPMonitor hikariMonitor,
            @Autowired(required = false) ThreadPoolMonitor threadPoolMonitor,
            @Autowired(required = false) ClockLeapDetector clockLeapDetector,
            ThreadStarvationProperties properties) {
        this.hikariMonitor = hikariMonitor;
        this.threadPoolMonitor = threadPoolMonitor;
        this.clockLeapDetector = clockLeapDetector;
        this.properties = properties;
        log.info("Thread Starvation Detector initialized");
        
        if (hikariMonitor == null) {
            log.info("HikariCP Monitor not available - will skip HikariCP checks");
        }
        if (threadPoolMonitor == null) {
            log.info("Thread Pool Monitor not available - will skip thread pool checks");
        }
        if (clockLeapDetector == null) {
            log.info("Clock Leap Detector not available - will skip clock leap checks");
        }
    }
    
    @Scheduled(fixedDelayString = "${thread.starvation.detectionInterval:60000}")
    public void detectStarvation() {
        if (!properties.isEnabled()) {
            return;
        }
        
        try {
            boolean hasStarvation = false;
            StringBuilder report = new StringBuilder();
            
            // ⭐ Check HikariCP (only if available)
            if (hikariMonitor != null) {
                try {
                    Map<String, Object> hikariStatus = hikariMonitor.getPoolStatus();
                    Boolean available = (Boolean) hikariStatus.get("available");
                    if (available != null && available) {
                        Integer awaiting = (Integer) hikariStatus.get("threadsAwaiting");
                        if (awaiting != null && awaiting > 5) {
                            hasStarvation = true;
                            report.append(String.format("HikariCP: %d threads awaiting connections; ", awaiting));
                        }
                    }
                } catch (Exception e) {
                    log.debug("Error checking HikariCP status: {}", e.getMessage());
                }
            }
            
            // ⭐ Check Thread count (only if available)
            if (threadPoolMonitor != null) {
                try {
                    Map<String, Object> threadStatus = threadPoolMonitor.getThreadStatus();
                    Integer threadCount = (Integer) threadStatus.get("threadCount");
                    if (threadCount != null && threadCount > 300) {
                        hasStarvation = true;
                        report.append(String.format("Thread Count: %d active threads; ", threadCount));
                    }
                } catch (Exception e) {
                    log.debug("Error checking thread status: {}", e.getMessage());
                }
            }
            
            // ⭐ Check Clock leaps (only if available)
            if (clockLeapDetector != null) {
                try {
                    Map<String, Object> clockStatus = clockLeapDetector.getClockStatus();
                    Integer leapEvents = (Integer) clockStatus.get("leapEvents");
                    if (leapEvents != null && leapEvents > 3) {
                        hasStarvation = true;
                        report.append(String.format("Clock Leaps: %d events detected; ", leapEvents));
                    }
                } catch (Exception e) {
                    log.debug("Error checking clock status: {}", e.getMessage());
                }
            }
            
            // ⭐ Generate alert if starvation detected
            if (hasStarvation) {
                consecutiveWarnings++;
                log.warn("⚠️ THREAD STARVATION DETECTED: {}", report.toString());
                
                if (consecutiveWarnings > 3) {
                    log.error("🚨 PERSISTENT THREAD STARVATION! {} consecutive warnings.", 
                            consecutiveWarnings);
                    sendAlert(report.toString());
                }
            } else {
                if (consecutiveWarnings > 0) {
                    log.info("✅ Thread starvation resolved after {} warnings", consecutiveWarnings);
                    consecutiveWarnings = 0;
                }
            }
            
        } catch (Exception e) {
            log.error("Error detecting thread starvation: {}", e.getMessage());
        }
    }
    
    private void sendAlert(String message) {
        log.error("🚨 ALERT: {}", message);
        // You can integrate with email/Slack/PagerDuty here
    }
    
    public Map<String, Object> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("consecutiveWarnings", consecutiveWarnings);
        status.put("hikariCP", hikariMonitor != null ? "available" : "not available");
        status.put("threadPool", threadPoolMonitor != null ? "available" : "not available");
        status.put("clockLeap", clockLeapDetector != null ? "available" : "not available");
        return status;
    }
}