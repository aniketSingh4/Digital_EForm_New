package com.florosense.thread_starvation.annotation;


import org.springframework.context.annotation.Import;

import com.florosense.thread_starvation.config.ThreadStarvationAutoConfiguration;

import java.lang.annotation.*;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
@Documented
@Import(ThreadStarvationAutoConfiguration.class)
public @interface EnableThreadStarvationDetection 
{
 boolean enableHikariMonitoring() default true;
 boolean enableThreadPoolMonitoring() default true;
 boolean enableClockLeapDetection() default true;
 boolean enableRequestTiming() default true;
 long slowRequestThreshold() default 3000;
 long detectionInterval() default 60000;
}
