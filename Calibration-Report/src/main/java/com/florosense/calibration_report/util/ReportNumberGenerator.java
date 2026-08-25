package com.florosense.calibration_report.util;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import com.florosense.calibration_report.repository.CalibrationReportRepository;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Component
@RequiredArgsConstructor
public class ReportNumberGenerator 
{
    
    private final CalibrationReportRepository reportRepository;
    
    private static final String REPORT_PREFIX = "FLO_CAL_";
    private static final String SERIAL_PREFIX = "FLO_SER_";
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyyMMdd");
    
    
    public String generateReportNumber() {
        return nextId(REPORT_PREFIX, reportRepository::existsByReportNo);
    }

    public String generateSerialNumber() {
        return nextId(SERIAL_PREFIX, reportRepository::existsBySerialNo);
    }

    /**
     * Normalize to PREFIX + yyyyMMdd + '-' + 4-digit sequence.
     * Accepts compact (FLO_CAL_202608250004), hyphen-after-type (FLO_CAL-20260825-0004),
     * and extra-hyphen (FLO_CAL_-20260825-0004) forms.
     */
    public static String withDateSequenceHyphen(String value, String prefix) {
        if (value == null || prefix == null) {
            return value;
        }
        String type = prefix.endsWith("_") ? prefix.substring(0, prefix.length() - 1) : prefix;
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("^" + java.util.regex.Pattern.quote(type) + "[_-]+(\\d{8})-?(\\d{4})$")
                .matcher(value.trim());
        if (matcher.matches()) {
            return type + "_" + matcher.group(1) + "-" + matcher.group(2);
        }
        return value;
    }

    /**
     * Format: PREFIX + yyyyMMdd + '-' + 4-digit sequence, e.g. FLO_CAL_20260825-0004
     */
    private String nextId(String prefix, java.util.function.Predicate<String> exists) {
        String datePart = LocalDate.now().format(DATE_FORMATTER);
        long sequence = reportRepository.count() + 1;
        String candidate;
        do {
            candidate = prefix + datePart + "-" + String.format("%04d", sequence);
            sequence++;
        } while (exists.test(candidate));
        return candidate;
    }
}