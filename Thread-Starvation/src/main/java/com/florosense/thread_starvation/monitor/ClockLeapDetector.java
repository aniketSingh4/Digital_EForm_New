package com.florosense.thread_starvation.monitor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class ClockLeapDetector {
 
 private static final Logger log = LoggerFactory.getLogger(ClockLeapDetector.class);
 
 private final ThreadStarvationProperties properties;
 private final AtomicLong lastTimestamp = new AtomicLong(System.currentTimeMillis());
 private final Map<String, Long> leapEvents = new ConcurrentHashMap<>();
 private int leapCounter = 0;
 
 public ClockLeapDetector(ThreadStarvationProperties properties) {
     this.properties = properties;
     log.info("Clock Leap Detector initialized with threshold: {}ms", 
             properties.getClockLeap().getMaxDeltaThreshold());
 }
 
 @Scheduled(fixedDelayString = "${thread.starvation.clockLeap.checkInterval:60000}")
 public void detectClockLeap() {
     if (!properties.isEnabled() || !properties.getClockLeap().isEnabled()) {
         return;
     }
     
     try {
         long currentTime = System.currentTimeMillis();
         long previousTime = lastTimestamp.get();
         long delta = currentTime - previousTime;
         long expectedDelta = properties.getClockLeap().getCheckInterval();
         
         // ⭐ Detect clock leap (positive or negative)
         if (Math.abs(delta - expectedDelta) > properties.getClockLeap().getWarningThreshold()) {
             String direction = delta > expectedDelta ? "FORWARD" : "BACKWARD";
             long leapAmount = Math.abs(delta - expectedDelta);
             
             log.warn("⚠️ CLOCK LEAP DETECTED: {} direction, Delta: {}ms, " +
                     "Expected: {}ms, Leap: {}ms", 
                     direction, delta, expectedDelta, leapAmount);
             
             // Store leap event
             String eventKey = Instant.now().toString();
             leapEvents.put(eventKey, delta);
             
             leapCounter++;
             
             // ⭐ Severe clock leap (> 5 seconds)
             if (leapAmount > properties.getClockLeap().getMaxDeltaThreshold()) {
                 log.error("🚨 SEVERE CLOCK LEAP: {}ms deviation detected! " +
                         "This may cause thread starvation warnings.", leapAmount);
                 
                 // Reset HikariCP internal timers if needed
                 // (This would require reflection access to HikariCP)
             }
             
             // Reset last timestamp to current time
             lastTimestamp.set(currentTime);
         } else {
             // Normal operation - update timestamp
             lastTimestamp.set(currentTime);
         }
         
     } catch (Exception e) {
         log.error("Error detecting clock leap: {}", e.getMessage());
     }
 }
 
 public Map<String, Object> getClockStatus() {
     Map<String, Object> status = new ConcurrentHashMap<>();
     status.put("lastTimestamp", lastTimestamp.get());
     status.put("leapEvents", leapEvents.size());
     status.put("leapCounter", leapCounter);
     status.put("maxDeltaThreshold", properties.getClockLeap().getMaxDeltaThreshold());
     return status;
 }
}
