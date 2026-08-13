# ==================== STAGE 1: Build ====================
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

# Set working directory
WORKDIR /app

# Copy pom.xml first for better layer caching
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application (skip tests for faster builds)
RUN mvn clean package -DskipTests

# ==================== STAGE 2: Runtime ====================
FROM eclipse-temurin:21-jre-alpine

# Install wget for healthcheck
RUN apk add --no-cache wget

# Create a non-root user for security
RUN addgroup -S spring && adduser -S spring -G spring
USER spring

WORKDIR /app

# Create uploads directory for file storage
RUN mkdir -p uploads

# Copy the JAR from the builder stage
COPY --from=builder /app/target/pre-visit-report-1.0.0.jar app.jar

# Expose port (Render will override with PORT env variable)
EXPOSE 8080

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=90s --retries=5 \
    CMD wget --quiet --tries=1 --spider http://localhost:${PORT:-8080}/actuator/health || exit 1

# Run the application - BIND TO 0.0.0.0 AND USE PORT FROM ENV
ENTRYPOINT ["sh", "-c", "java ${JAVA_OPTS:--Xmx512m} -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -Dspring.profiles.active=${SPRING_PROFILES_ACTIVE:prod} -jar app.jar"]