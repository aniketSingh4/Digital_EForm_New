// src/main/java/com/florosense/thread_starvation/config/ThreadStarvationAutoConfiguration.java
package com.florosense.thread_starvation.config;

import com.florosense.thread_starvation.controller.ThreadStarvationController;
import com.florosense.thread_starvation.filter.RequestTimingFilter;
import com.florosense.thread_starvation.monitor.ClockLeapDetector;
import com.florosense.thread_starvation.monitor.HikariCPMonitor;
import com.florosense.thread_starvation.monitor.ThreadPoolMonitor;
import com.florosense.thread_starvation.monitor.ThreadStarvationDetector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.AutoConfigureAfter;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.jdbc.DataSourceAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import javax.sql.DataSource;

@Configuration
@EnableConfigurationProperties(ThreadStarvationProperties.class)
@EnableScheduling
@ConditionalOnProperty(name = "thread.starvation.enabled", havingValue = "true", matchIfMissing = true)
@AutoConfigureAfter(DataSourceAutoConfiguration.class)
public class ThreadStarvationAutoConfiguration {
    
    private static final Logger log = LoggerFactory.getLogger(ThreadStarvationAutoConfiguration.class);
    
    // ⭐ HikariCP Monitor - ONLY if DataSource is available
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnClass(DataSource.class)
    @ConditionalOnProperty(name = "thread.starvation.hikari.enabled", havingValue = "true", matchIfMissing = true)
    public HikariCPMonitor hikariCPMonitor(DataSource dataSource, 
                                           ThreadStarvationProperties properties) {
        log.info("✅ Initializing HikariCP Monitor (DataSource available)");
        return new HikariCPMonitor(dataSource, properties);
    }
    
    // ⭐ Thread Pool Monitor - Always available
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "thread.starvation.threadPool.enabled", havingValue = "true", matchIfMissing = true)
    public ThreadPoolMonitor threadPoolMonitor(ThreadStarvationProperties properties) {
        log.info("✅ Initializing Thread Pool Monitor");
        return new ThreadPoolMonitor(properties);
    }
    
    // ⭐ Clock Leap Detector - Always available
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "thread.starvation.clockLeap.enabled", havingValue = "true", matchIfMissing = true)
    public ClockLeapDetector clockLeapDetector(ThreadStarvationProperties properties) {
        log.info("✅ Initializing Clock Leap Detector");
        return new ClockLeapDetector(properties);
    }
    
    // ⭐ Thread Starvation Detector - Orchestrates all monitors
    @Bean
    @ConditionalOnMissingBean
    public ThreadStarvationDetector threadStarvationDetector(
            HikariCPMonitor hikariMonitor,
            ThreadPoolMonitor threadPoolMonitor,
            ClockLeapDetector clockLeapDetector,
            ThreadStarvationProperties properties) {
        log.info("✅ Initializing Thread Starvation Detector");
        return new ThreadStarvationDetector(hikariMonitor, threadPoolMonitor, 
                                           clockLeapDetector, properties);
    }
    
    // ⭐ Request Timing Filter
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnProperty(name = "thread.starvation.requestTiming.enabled", havingValue = "true", matchIfMissing = true)
    public RequestTimingFilter requestTimingFilter(ThreadStarvationProperties properties) {
        log.info("✅ Initializing Request Timing Filter");
        return new RequestTimingFilter(properties);
    }
    
    // ⭐ Thread Starvation Controller - ONLY if web application
    @Bean
    @ConditionalOnMissingBean
    @ConditionalOnWebApplication
    @ConditionalOnClass(name = "org.springframework.web.servlet.DispatcherServlet")
    public ThreadStarvationController threadStarvationController(
            HikariCPMonitor hikariMonitor,
            ThreadPoolMonitor threadPoolMonitor,
            ClockLeapDetector clockLeapDetector,
            ThreadStarvationProperties properties) {
        log.info("✅ Initializing Thread Starvation Controller");
        return new ThreadStarvationController(hikariMonitor, threadPoolMonitor, 
                                             clockLeapDetector, properties);
    }
}