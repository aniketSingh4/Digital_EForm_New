package com.florosense.thread_starvation.filter;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;

import com.florosense.thread_starvation.config.ThreadStarvationProperties;

import java.io.IOException;

@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestTimingFilter implements Filter {
 
 private static final Logger log = LoggerFactory.getLogger(RequestTimingFilter.class);
 private final ThreadStarvationProperties properties;
 
 public RequestTimingFilter(ThreadStarvationProperties properties) {
     this.properties = properties;
 }
 
 @Override
 public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
         throws IOException, jakarta.servlet.ServletException {
     
     if (!properties.isEnabled() || !properties.getRequestTiming().isEnabled()) {
         chain.doFilter(request, response);
         return;
     }
     
     HttpServletRequest httpRequest = (HttpServletRequest) request;
     HttpServletResponse httpResponse = (HttpServletResponse) response;
     
     long startTime = System.currentTimeMillis();
     String requestInfo = String.format("%s %s", httpRequest.getMethod(), 
             httpRequest.getRequestURI());
     
     try {
         chain.doFilter(request, response);
     } finally {
         long duration = System.currentTimeMillis() - startTime;
         long slowThreshold = properties.getRequestTiming().getSlowRequestThreshold();
         long verySlowThreshold = properties.getRequestTiming().getVerySlowRequestThreshold();
         
         // ⭐ Detect slow requests
         if (duration > verySlowThreshold) {
             log.error("🚨 VERY SLOW REQUEST: {} took {}ms (threshold: {}ms)", 
                     requestInfo, duration, verySlowThreshold);
         } else if (duration > slowThreshold) {
             log.warn("⚠️ SLOW REQUEST: {} took {}ms (threshold: {}ms)", 
                     requestInfo, duration, slowThreshold);
         } else {
             log.debug("Request: {} took {}ms", requestInfo, duration);
         }
         
         // ⭐ Add response header for monitoring
         httpResponse.setHeader("X-Response-Time", duration + "ms");
     }
 }
}
