package com.florosense.thread_starvation.controller;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;
import com.florosense.thread_starvation.monitor.ClockLeapDetector;
import com.florosense.thread_starvation.monitor.HikariCPMonitor;
import com.florosense.thread_starvation.monitor.ThreadPoolMonitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/actuator/thread-starvation")
public class ThreadStarvationController {
    
    private static final Logger log = LoggerFactory.getLogger(ThreadStarvationController.class);
    
    private final HikariCPMonitor hikariMonitor;
    private final ThreadPoolMonitor threadPoolMonitor;
    private final ClockLeapDetector clockLeapDetector;
    private final ThreadStarvationProperties properties;
    
    // ⭐ Use @Autowired(required = false) to make all monitors optional
    @Autowired
    public ThreadStarvationController(
            @Autowired(required = false) HikariCPMonitor hikariMonitor,
            @Autowired(required = false) ThreadPoolMonitor threadPoolMonitor,
            @Autowired(required = false) ClockLeapDetector clockLeapDetector,
            ThreadStarvationProperties properties) {
        this.hikariMonitor = hikariMonitor;
        this.threadPoolMonitor = threadPoolMonitor;
        this.clockLeapDetector = clockLeapDetector;
        this.properties = properties;
        log.info("Thread Starvation Controller initialized");
    }
    
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> getStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("enabled", properties.isEnabled());
        status.put("timestamp", System.currentTimeMillis());
        
        // ⭐ Handle null monitors safely
        if (hikariMonitor != null) {
            status.put("hikariCP", hikariMonitor.getPoolStatus());
        } else {
            Map<String, Object> hikariStatus = new HashMap<>();
            hikariStatus.put("available", false);
            hikariStatus.put("message", "DataSource not available - HikariCP monitoring disabled");
            status.put("hikariCP", hikariStatus);
        }
        
        if (threadPoolMonitor != null) {
            status.put("threadPool", threadPoolMonitor.getThreadStatus());
        } else {
            Map<String, Object> threadStatus = new HashMap<>();
            threadStatus.put("available", false);
            threadStatus.put("message", "Thread pool monitor disabled");
            status.put("threadPool", threadStatus);
        }
        
        if (clockLeapDetector != null) {
            status.put("clockLeap", clockLeapDetector.getClockStatus());
        } else {
            Map<String, Object> clockStatus = new HashMap<>();
            clockStatus.put("available", false);
            clockStatus.put("message", "Clock leap detector disabled");
            status.put("clockLeap", clockStatus);
        }
        
        return ResponseEntity.ok(status);
    }
}