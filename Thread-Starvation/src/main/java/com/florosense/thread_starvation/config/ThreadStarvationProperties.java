package com.florosense.thread_starvation.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "thread.starvation")
public class ThreadStarvationProperties 
{
 private boolean enabled = true;
 private HikariConfig hikari = new HikariConfig();
 private ThreadPoolConfig threadPool = new ThreadPoolConfig();
 private ClockLeapConfig clockLeap = new ClockLeapConfig();
 private RequestTimingConfig requestTiming = new RequestTimingConfig();
 private long detectionInterval = 60000;
 
 @Data
 public static class HikariConfig 
 {
     private boolean enabled = true;
     private long warningThreshold = 5000; // 5 seconds
     private long leakDetectionThreshold = 30000; // 30 seconds
     private int maxPoolSize = 20;
     private int minIdle = 10;
 }
 
 @Data
 public static class ThreadPoolConfig 
 {
     private boolean enabled = true;
     private int corePoolSize = 10;
     private int maxPoolSize = 50;
     private long keepAliveTime = 60; // seconds
 }
 
 @Data
 public static class ClockLeapConfig 
 {
     private boolean enabled = true;
     private long maxDeltaThreshold = 5000; // 5 seconds max clock drift
     private long checkInterval = 60000; // 1 minute
     private long warningThreshold = 1000; // 1 second
 }
 
 @Data
 public static class RequestTimingConfig 
 {
     private boolean enabled = true;
     private long slowRequestThreshold = 3000; // 3 seconds
     private long verySlowRequestThreshold = 10000; // 10 seconds
 }
}
