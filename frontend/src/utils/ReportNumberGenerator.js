// src/utils/ReportNumberGenerator.js

const STORAGE_KEYS = {
    PM_REPORT_COUNT: 'pmReportCount',
    VISIT_COUNT_PREFIX: 'svCount_',
    LAST_REPORT_NO: 'lastReportNo',
    LAST_VISIT_NO: 'lastVisitNo'
};

const MONTHS = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'
];

// Cache for localStorage to reduce reads
const cache = {
    reportCount: null,
    visitCounts: {},
    lastReportNo: null,
    lastVisitNo: null
};

// ============================================
// OPTIMIZED CORE GENERATION FUNCTIONS
// ============================================

/**
 * Generate a unique Service Report Number - OPTIMIZED
 * Format: PM-YYYY-XXXX (e.g., PM-2026-0001)
 * 
 * @param {number} year - Year to use (default: current year)
 * @param {number} count - Optional count override
 * @returns {string} Generated service report number
 */
export const generateServiceReportNo = (year = null, count = null) => {
    const currentYear = year || new Date().getFullYear();
    
    // Use cache if available, otherwise read from localStorage
    let currentCount = count;
    if (currentCount === null) {
        // Try cache first
        if (cache.reportCount !== null) {
            currentCount = cache.reportCount + 1;
        } else {
            currentCount = parseInt(localStorage.getItem(STORAGE_KEYS.PM_REPORT_COUNT) || '0');
            currentCount += 1;
        }
        
        // Update cache and localStorage
        cache.reportCount = currentCount;
        localStorage.setItem(STORAGE_KEYS.PM_REPORT_COUNT, currentCount.toString());
    }
    
    const paddedCount = String(currentCount).padStart(4, '0');
    const reportNo = `PM-${currentYear}-${paddedCount}`;
    
    // Cache the last generated number
    cache.lastReportNo = reportNo;
    localStorage.setItem(STORAGE_KEYS.LAST_REPORT_NO, reportNo);
    
    return reportNo;
};

/**
 * Generate Service Visit Number - OPTIMIZED
 * Format: SVG_MONTH_ENG_CODE_XXX (e.g., SVG_JUNE_RAH_001)
 * 
 * @param {string} engineerName - Name of the engineer (min 3 characters)
 * @param {number} month - Month index (0-11, default: current month)
 * @param {number} count - Optional count override
 * @returns {string} Generated service visit number
 */
export const generateServiceVisitNo = (engineerName, month = null, count = null) => {
    const currentMonth = month !== null ? month : new Date().getMonth();
    const monthName = MONTHS[currentMonth];
    
    // Get engineer code (first 3 letters of engineer name, uppercase)
    const engineerCode = getEngineerCode(engineerName);
    
    // Use cache if available, otherwise read from localStorage
    let currentCount = count;
    if (currentCount === null) {
        const storageKey = STORAGE_KEYS.VISIT_COUNT_PREFIX + currentMonth;
        
        // Try cache first
        if (cache.visitCounts[storageKey] !== undefined) {
            currentCount = cache.visitCounts[storageKey] + 1;
        } else {
            currentCount = parseInt(localStorage.getItem(storageKey) || '0');
            currentCount += 1;
        }
        
        // Update cache and localStorage
        cache.visitCounts[storageKey] = currentCount;
        localStorage.setItem(storageKey, currentCount.toString());
    }
    
    const paddedCount = String(currentCount).padStart(3, '0');
    const visitNo = `SVG_${monthName}_${engineerCode}_${paddedCount}`;
    
    // Cache the last generated number
    cache.lastVisitNo = visitNo;
    localStorage.setItem(STORAGE_KEYS.LAST_VISIT_NO, visitNo);
    
    return visitNo;
};

/**
 * Get engineer code from name (first 3 letters, uppercase) - OPTIMIZED
 * 
 * @param {string} name - Engineer's full name
 * @param {number} length - Number of characters to use (default: 3)
 * @returns {string} Engineer code
 */
export const getEngineerCode = (name, length = 3) => {
    if (!name || typeof name !== 'string') {
        return 'ENG';
    }
    
    // Optimize: Remove extra spaces and get first word
    const trimmedName = name.trim();
    const firstSpaceIndex = trimmedName.indexOf(' ');
    const firstWord = firstSpaceIndex === -1 ? trimmedName : trimmedName.substring(0, firstSpaceIndex);
    
    // Get first N characters and convert to uppercase
    const code = firstWord.substring(0, length).toUpperCase();
    
    // Ensure minimum length
    if (code.length < length) {
        return code.padEnd(length, 'X');
    }
    
    return code;
};

// ============================================
// OPTIMIZED COUNTER MANAGEMENT
// ============================================

/**
 * Get current count for Service Report No - CACHED
 * 
 * @returns {number} Current count
 */
export const getCurrentReportCount = () => {
    if (cache.reportCount !== null) {
        return cache.reportCount;
    }
    const count = parseInt(localStorage.getItem(STORAGE_KEYS.PM_REPORT_COUNT) || '0');
    cache.reportCount = count;
    return count;
};

/**
 * Get current count for Service Visit No for a specific month - CACHED
 * 
 * @param {number} month - Month index (0-11)
 * @returns {number} Current count
 */
export const getCurrentVisitCount = (month) => {
    const storageKey = STORAGE_KEYS.VISIT_COUNT_PREFIX + (month !== undefined ? month : new Date().getMonth());
    
    if (cache.visitCounts[storageKey] !== undefined) {
        return cache.visitCounts[storageKey];
    }
    
    const count = parseInt(localStorage.getItem(storageKey) || '0');
    cache.visitCounts[storageKey] = count;
    return count;
};

/**
 * Get the last generated Service Report No - CACHED
 * 
 * @returns {string|null} Last generated report number
 */
export const getLastReportNo = () => {
    if (cache.lastReportNo !== null) {
        return cache.lastReportNo;
    }
    const lastNo = localStorage.getItem(STORAGE_KEYS.LAST_REPORT_NO) || null;
    cache.lastReportNo = lastNo;
    return lastNo;
};

/**
 * Get the last generated Service Visit No - CACHED
 * 
 * @returns {string|null} Last generated visit number
 */
export const getLastVisitNo = () => {
    if (cache.lastVisitNo !== null) {
        return cache.lastVisitNo;
    }
    const lastNo = localStorage.getItem(STORAGE_KEYS.LAST_VISIT_NO) || null;
    cache.lastVisitNo = lastNo;
    return lastNo;
};

/**
 * Get next Service Visit count for a specific month - OPTIMIZED
 * 
 * @param {number} month - Month index (0-11, default: current month)
 * @returns {number} Next count
 */
export const getNextServiceVisitCount = (month = null) => {
    const currentMonth = month !== null ? month : new Date().getMonth();
    const storageKey = STORAGE_KEYS.VISIT_COUNT_PREFIX + currentMonth;
    
    let count;
    if (cache.visitCounts[storageKey] !== undefined) {
        count = cache.visitCounts[storageKey] + 1;
    } else {
        count = parseInt(localStorage.getItem(storageKey) || '0');
        count += 1;
    }
    
    cache.visitCounts[storageKey] = count;
    localStorage.setItem(storageKey, count.toString());
    return count;
};

// ============================================
// BATCH OPERATIONS FOR BETTER PERFORMANCE
// ============================================

/**
 * Preload all counters into cache for better performance
 * Call this once when the app initializes
 */
export const preloadCounters = () => {
    // Preload report count
    const reportCount = parseInt(localStorage.getItem(STORAGE_KEYS.PM_REPORT_COUNT) || '0');
    cache.reportCount = reportCount;
    
    // Preload visit counts for all months
    for (let i = 0; i < 12; i++) {
        const storageKey = STORAGE_KEYS.VISIT_COUNT_PREFIX + i;
        const count = parseInt(localStorage.getItem(storageKey) || '0');
        cache.visitCounts[storageKey] = count;
    }
    
    // Preload last generated numbers
    cache.lastReportNo = localStorage.getItem(STORAGE_KEYS.LAST_REPORT_NO) || null;
    cache.lastVisitNo = localStorage.getItem(STORAGE_KEYS.LAST_VISIT_NO) || null;
};

/**
 * Clear cache (useful for testing or when localStorage changes externally)
 */
export const clearCache = () => {
    cache.reportCount = null;
    cache.visitCounts = {};
    cache.lastReportNo = null;
    cache.lastVisitNo = null;
};

// ============================================
// RESET FUNCTIONS (For Testing/Admin)
// ============================================

/**
 * Reset all counters (for testing or new year)
 * 
 * @param {boolean} confirm - Require confirmation before resetting
 */
export const resetCounts = (confirm = false) => {
    if (confirm && !window.confirm('Are you sure you want to reset all counters? This action cannot be undone.')) {
        return false;
    }
    
    // Reset Report No counter
    localStorage.removeItem(STORAGE_KEYS.PM_REPORT_COUNT);
    localStorage.removeItem(STORAGE_KEYS.LAST_REPORT_NO);
    cache.reportCount = null;
    cache.lastReportNo = null;
    
    // Reset Visit No counters for all months
    for (let i = 0; i < 12; i++) {
        localStorage.removeItem(STORAGE_KEYS.VISIT_COUNT_PREFIX + i);
        cache.visitCounts[STORAGE_KEYS.VISIT_COUNT_PREFIX + i] = undefined;
    }
    localStorage.removeItem(STORAGE_KEYS.LAST_VISIT_NO);
    cache.lastVisitNo = null;
    
    return true;
};

/**
 * Reset counters for a specific month
 * 
 * @param {number} month - Month index (0-11)
 * @param {boolean} confirm - Require confirmation
 */
export const resetMonthCount = (month, confirm = false) => {
    if (month < 0 || month > 11) {
        console.error('❌ Invalid month index. Must be between 0 and 11.');
        return false;
    }
    
    if (confirm && !window.confirm(`Are you sure you want to reset counters for ${MONTHS[month]}?`)) {
        return false;
    }
    
    const storageKey = STORAGE_KEYS.VISIT_COUNT_PREFIX + month;
    localStorage.removeItem(storageKey);
    cache.visitCounts[storageKey] = undefined;
    return true;
};

/**
 * Set custom count for Service Report No
 * 
 * @param {number} count - New count value
 * @param {boolean} confirm - Require confirmation
 */
export const setReportCount = (count, confirm = false) => {
    if (count < 0) {
        console.error('❌ Count must be a positive number');
        return false;
    }
    
    if (confirm && !window.confirm(`Are you sure you want to set report count to ${count}?`)) {
        return false;
    }
    
    localStorage.setItem(STORAGE_KEYS.PM_REPORT_COUNT, count.toString());
    cache.reportCount = count;
    return true;
};

// ============================================
// VALIDATION FUNCTIONS
// ============================================

/**
 * Validate Service Report No format
 * 
 * @param {string} reportNo - Report number to validate
 * @returns {boolean} Is valid format
 */
export const isValidReportNo = (reportNo) => {
    const pattern = /^PM-\d{4}-\d{4}$/;
    return pattern.test(reportNo);
};

/**
 * Validate Service Visit No format
 * 
 * @param {string} visitNo - Visit number to validate
 * @returns {boolean} Is valid format
 */
export const isValidVisitNo = (visitNo) => {
    const pattern = /^SVG_[A-Z]{3,9}_[A-Z]{3}_\d{3}$/;
    return pattern.test(visitNo);
};

/**
 * Parse Service Report No to extract components
 * 
 * @param {string} reportNo - Report number to parse
 * @returns {Object|null} Parsed components
 */
export const parseReportNo = (reportNo) => {
    if (!isValidReportNo(reportNo)) {
        return null;
    }
    
    const parts = reportNo.split('-');
    return {
        prefix: parts[0],
        year: parseInt(parts[1]),
        number: parseInt(parts[2])
    };
};

/**
 * Parse Service Visit No to extract components
 * 
 * @param {string} visitNo - Visit number to parse
 * @returns {Object|null} Parsed components
 */
export const parseVisitNo = (visitNo) => {
    if (!isValidVisitNo(visitNo)) {
        return null;
    }
    
    const parts = visitNo.split('_');
    return {
        prefix: parts[0],
        month: parts[1],
        engineerCode: parts[2],
        number: parseInt(parts[3])
    };
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Get all stored counts (for debugging)
 * 
 * @returns {Object} All stored counts
 */
export const getAllCounts = () => {
    const counts = {
        reportCount: getCurrentReportCount(),
        lastReportNo: getLastReportNo(),
        lastVisitNo: getLastVisitNo(),
        visitCounts: {}
    };
    
    for (let i = 0; i < 12; i++) {
        counts.visitCounts[MONTHS[i]] = getCurrentVisitCount(i);
    }
    
    return counts;
};

/**
 * Preview next Report No without incrementing
 * 
 * @param {number} year - Year (default: current year)
 * @returns {string} Next report number
 */
export const previewNextReportNo = (year = null) => {
    const currentYear = year || new Date().getFullYear();
    const currentCount = getCurrentReportCount();
    const nextCount = currentCount + 1;
    const paddedCount = String(nextCount).padStart(4, '0');
    return `PM-${currentYear}-${paddedCount}`;
};

/**
 * Preview next Visit No without incrementing
 * 
 * @param {string} engineerName - Engineer's name
 * @param {number} month - Month index (0-11)
 * @returns {string} Next visit number
 */
export const previewNextVisitNo = (engineerName, month = null) => {
    const currentMonth = month !== null ? month : new Date().getMonth();
    const monthName = MONTHS[currentMonth];
    const engineerCode = getEngineerCode(engineerName);
    const currentCount = getCurrentVisitCount(currentMonth);
    const nextCount = currentCount + 1;
    const paddedCount = String(nextCount).padStart(3, '0');
    return `SVG_${monthName}_${engineerCode}_${paddedCount}`;
};

// ============================================
// EXPORT DEFAULTS
// ============================================

export default {
    generateServiceReportNo,
    generateServiceVisitNo,
    getEngineerCode,
    getCurrentReportCount,
    getCurrentVisitCount,
    getLastReportNo,
    getLastVisitNo,
    getNextServiceVisitCount,
    preloadCounters,
    clearCache,
    resetCounts,
    resetMonthCount,
    setReportCount,
    isValidReportNo,
    isValidVisitNo,
    parseReportNo,
    parseVisitNo,
    getAllCounts,
    previewNextReportNo,
    previewNextVisitNo
};