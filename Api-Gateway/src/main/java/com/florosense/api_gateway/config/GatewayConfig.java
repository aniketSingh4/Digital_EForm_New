package com.florosense.api_gateway.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.cloud.gateway.filter.ratelimit.KeyResolver;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import reactor.core.publisher.Mono;

@Configuration
public class GatewayConfig 
{
    
    private static final Logger logger = LoggerFactory.getLogger(GatewayConfig.class);
    
    @Bean
    public GlobalFilter loggingGlobalFilter() 
    {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            ServerHttpResponse response = exchange.getResponse();
            
            // Log request details
            logger.info("Request: {} {}", request.getMethod(), request.getURI());
            
            // Add custom header (optional)
            request.mutate()
                .header("X-Gateway-Request", "true")
                .build();
            
            // Continue with the filter chain
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                // Log response status
                logger.info("Response Status: {}", response.getStatusCode());
            }));
        };
    }
    
    // Rate limiter key resolver
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> Mono.just(exchange.getRequest().getRemoteAddress().getAddress().getHostAddress());
    }
}
