package com.florosense.thread_starvation.monitor;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;

import java.lang.management.ManagementFactory;
import java.lang.management.ThreadInfo;
import java.lang.management.ThreadMXBean;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

public class ThreadPoolMonitor {
 
 private static final Logger log = LoggerFactory.getLogger(ThreadPoolMonitor.class);
 
 private final ThreadStarvationProperties properties;
 private final ThreadMXBean threadMXBean = ManagementFactory.getThreadMXBean();
 private final Map<String, AtomicLong> warningCounts = new ConcurrentHashMap<>();
 private long previousThreadCount = 0;
 
 public ThreadPoolMonitor(ThreadStarvationProperties properties) {
     this.properties = properties;
     log.info("Thread Pool Monitor initialized");
 }
 
 @Scheduled(fixedDelayString = "${thread.starvation.detectionInterval:60000}")
 public void monitor() {
     if (!properties.isEnabled() || !properties.getThreadPool().isEnabled()) {
         return;
     }
     
     try {
         int threadCount = threadMXBean.getThreadCount();
         int peakThreadCount = threadMXBean.getPeakThreadCount();
         int daemonThreadCount = threadMXBean.getDaemonThreadCount();
         long totalStartedThreadCount = threadMXBean.getTotalStartedThreadCount();
         
         // ⭐ Detect thread starvation - rapid thread creation
         long currentTime = System.currentTimeMillis();
         long threadCreationRate = totalStartedThreadCount - previousThreadCount;
         
         if (threadCreationRate > 100) {
             log.warn("⚠️ HIGH THREAD CREATION RATE: {} new threads in {}ms", 
                     threadCreationRate, properties.getDetectionInterval());
         }
         
         // ⭐ Detect thread exhaustion
         if (threadCount > 500) {
             log.warn("⚠️ HIGH THREAD COUNT: {} active threads", threadCount);
             // Log thread dump
             logThreadDump(10); // Log first 10 threads
         }
         
         // ⭐ Detect deadlocks
         long[] deadlockedThreads = threadMXBean.findDeadlockedThreads();
         if (deadlockedThreads != null && deadlockedThreads.length > 0) {
             log.error("🚨 DEADLOCK DETECTED! {} threads are deadlocked", 
                     deadlockedThreads.length);
             for (long threadId : deadlockedThreads) {
                 ThreadInfo threadInfo = threadMXBean.getThreadInfo(threadId);
                 log.error("Deadlocked Thread: {}", threadInfo.getThreadName());
             }
         }
         
         previousThreadCount = totalStartedThreadCount;
         
     } catch (Exception e) {
         log.error("Error monitoring threads: {}", e.getMessage());
     }
 }
 
 private void logThreadDump(int limit) {
     ThreadInfo[] threadInfos = threadMXBean.dumpAllThreads(true, true);
     log.warn("=== THREAD DUMP (first {} threads) ===", Math.min(limit, threadInfos.length));
     for (int i = 0; i < Math.min(limit, threadInfos.length); i++) {
         ThreadInfo info = threadInfos[i];
         log.warn("Thread {}: {} [{}] - State: {}", 
                 i, info.getThreadName(), info.getThreadId(), info.getThreadState());
         if (info.getLockInfo() != null) {
             log.warn("  Waiting on: {}", info.getLockInfo());
         }
     }
 }
 
 public Map<String, Object> getThreadStatus() {
     Map<String, Object> status = new ConcurrentHashMap<>();
     status.put("threadCount", threadMXBean.getThreadCount());
     status.put("peakThreadCount", threadMXBean.getPeakThreadCount());
     status.put("daemonThreadCount", threadMXBean.getDaemonThreadCount());
     status.put("totalStartedThreadCount", threadMXBean.getTotalStartedThreadCount());
     return status;
 }
}
