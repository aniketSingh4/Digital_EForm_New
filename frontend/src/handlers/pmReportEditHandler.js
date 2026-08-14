import { getAuthHeaders } from '../utils/roles';
import { invalidate } from '../utils/cache';
import { env } from '../config/env';
import { normalizePmStatus, normalizeSiteCondition } from '../utils/pmSummary';

const API_BASE_URL = env.PM_REPORTS_URL

/**
 * Fetch report data by ID for editing
 * @param {string|number} id - Report ID
 * @returns {Promise<Object>} - Report data
 */
export const fetchReportForEdit = async (id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch report: ${response.status}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching report for edit:', error);
        throw error;
    }
};

/**
 * Format report data for form population
 * @param {Object} data - Raw report data from API
 * @returns {Object} - Formatted data for form fields
 */
export const formatReportForEdit = (data) => {
    return {
        report: {
            serviceReportNo: data.serviceReportNo || '',
            serviceVisitNo: data.serviceVisitNo || '',
            clientName: data.clientName || '',
            siteName: data.siteName || '',
            sensorId: data.sensorId || '',
            pmVisitDate: data.pmVisitDate ? data.pmVisitDate.split('T')[0] : '',
            engineerName: data.engineerName || '',
        },
        inspection: {
            // Add inspection fields if any
        },
        technical: {
            // Add technical fields if any
        },
        summary: {
            observation: data.observation || '',
            recommendation: data.recommendation || '',
            pmStatus: normalizePmStatus(data.preventiveMaintenanceStatus || data.summary?.preventiveMaintenanceStatus || data.pmStatus),
            siteCondition: normalizeSiteCondition(data.siteConditionAfterPm || data.siteConditionAfterPM || data.summary?.siteConditionAfterPm || data.summary?.siteCondition)
        },
        signoff: {
            clientRepresentativeName: data.signOff?.clientRepresentativeName || '',
            designation: data.signOff?.designation || '',
            clientSignature: data.signOff?.clientSignature || '',
            clientDate: data.signOff?.clientDate || '',
            serviceEngineerName: data.signOff?.serviceEngineerName || '',
            serviceEngineerSignature: data.signOff?.serviceEngineerSignature || '',
            serviceEngineerDate: data.signOff?.serviceEngineerDate || ''
        },
        review: {},
        checklists: data.checklists || []
    };
};

/**
 * Validate report data before submission
 * @param {Object} formData - Form data to validate
 * @returns {Object} - { isValid: boolean, errors: string[] }
 */
export const validateReportData = (formData) => {
    const errors = [];
    const reportData = formData.report || {};

    // Required field validations
    if (!reportData.serviceReportNo?.trim()) {
        errors.push('Service Report No is required');
    }
    if (!reportData.clientName?.trim()) {
        errors.push('Client Name is required');
    }
    if (!reportData.siteName?.trim()) {
        errors.push('Site Name is required');
    }
    if (!reportData.sensorId?.trim()) {
        errors.push('Sensor ID is required');
    }
    if (!reportData.pmVisitDate) {
        errors.push('PM Visit Date is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
};

/**
 * Prepare payload for update request
 * @param {Object} formData - Form data
 * @param {string|number} id - Report ID
 * @returns {Object} - Formatted payload for API
 */
export const prepareUpdatePayload = (formData, id) => {
    const reportData = formData.report || {};
    
    // Generate or use existing visit number
    let serviceVisitNo = reportData.serviceVisitNo;
    if (!serviceVisitNo) {
        serviceVisitNo = `VISIT-${Date.now()}`;
    }

    // Ensure visit date exists
    let pmVisitDate = reportData.pmVisitDate;
    if (!pmVisitDate) {
        const today = new Date().toISOString().split('T')[0];
        pmVisitDate = today;
    }

    return {
        id: id,
        serviceReportNo: reportData.serviceReportNo?.trim() || '',
        serviceVisitNo: serviceVisitNo,
        clientName: reportData.clientName?.trim() || '',
        siteName: reportData.siteName?.trim() || '',
        sensorId: reportData.sensorId?.trim() || '',
        pmVisitDate: pmVisitDate,
        engineerName: reportData.engineerName || '',
        observation: formData.summary?.observation || '',
        recommendation: formData.summary?.recommendation || '',
        preventiveMaintenanceStatus: normalizePmStatus(formData.summary?.pmStatus),
        siteConditionAfterPm: normalizeSiteCondition(formData.summary?.siteCondition),
        summary: {
            preventiveMaintenanceStatus: normalizePmStatus(formData.summary?.pmStatus),
            siteConditionAfterPm: normalizeSiteCondition(formData.summary?.siteCondition)
        },
        checklists: formData.checklists || [],
        signOff: {
            clientRepresentativeName: formData.signoff?.clientRepresentativeName || '',
            designation: formData.signoff?.designation || '',
            clientSignature: formData.signoff?.clientSignature || formData.signoff?.clientRepresentativeName || '',
            clientDate: formData.signoff?.clientDate || new Date().toISOString().split('T')[0],
            serviceEngineerName: formData.signoff?.serviceEngineerName || '',
            serviceEngineerSignature: formData.signoff?.serviceEngineerSignature || formData.signoff?.serviceEngineerName || '',
            serviceEngineerDate: formData.signoff?.serviceEngineerDate || new Date().toISOString().split('T')[0]
        }
    };
};

/**
 * Update report in database
 * @param {Object} payload - Formatted payload
 * @param {string|number} id - Report ID
 * @returns {Promise<Object>} - Updated report data
 */
export const updateReport = async (payload, id) => {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Failed to update report: ${response.status} - ${errorData}`);
        }

        const result = await response.json();
        invalidate('pm_reports');
        localStorage.removeItem('dashboard_data');
        localStorage.removeItem('dashboard_timestamp');
        return result;
    } catch (error) {
        console.error('Error updating report:', error);
        throw error;
    }
};

/**
 * Handle edit button click - Navigate to edit page
 * @param {Object} report - Report object
 * @param {Function} navigate - React Router navigate function
 */
export const handleEditNavigation = (report, navigate) => {
    if (!report || !report.id) {
        console.error('Invalid report data for edit navigation');
        return;
    }
    navigate(`/pm-reports/edit/${report.id}`);
};

/**
 * Handle successful update - Navigate back to list with success message
 * @param {Object} result - Updated report data
 * @param {Function} navigate - React Router navigate function
 * @param {Function} toast - Toast notification function
 * @param {Function} notificationService - Notification service
 */
export const handleUpdateSuccess = (result, navigate, toast, notificationService) => {
    // Show success messages
    toast.success('✅ Report updated successfully!');
    if (notificationService) {
        notificationService.reportUpdated('PM Report', {
            id: result?.id,
            reportType: 'PM Report',
            reportName: result?.serviceReportNo,
            createdBy: localStorage.getItem('userName') || ''
        });
    }

    // Navigate back to reports list after delay
    setTimeout(() => {
        navigate('/pm-reports/view-all');
    }, 1500);
};

/**
 * Handle update error
 * @param {Error} error - Error object
 * @param {Function} toast - Toast notification function
 * @param {Function} notificationService - Notification service
 */
export const handleUpdateError = (error, toast, notificationService) => {
    console.error('Error updating report:', error);
    
    let errorMessage = error.message || 'An unexpected error occurred';
    
    // Specific error handling
    if (error.message.includes('409')) {
        errorMessage = 'A report with this Service Report Number already exists. Please use a unique number.';
    } else if (error.message.includes('400')) {
        errorMessage = 'Invalid data provided. Please check all fields.';
    } else if (error.message.includes('404')) {
        errorMessage = 'Report not found. It may have been deleted.';
    }

    if (notificationService) {
        notificationService.error(errorMessage);
    }
    toast.error(`❌ ${errorMessage}`);
};

/**
 * Check if report number already exists (for duplicate prevention)
 * @param {string} reportNo - Report number to check
 * @param {string|number} excludeId - ID to exclude from check (current report)
 * @returns {Promise<boolean>} - True if exists, false if not
 */
export const checkReportNumberExists = async (reportNo, excludeId = null) => {
    try {
        // This assumes your API has a check endpoint
        // If not, you may need to fetch all reports and check locally
        const response = await fetch(`${API_BASE_URL}/check?reportNo=${encodeURIComponent(reportNo)}`, {
            headers: getAuthHeaders()
        });
        if (response.status === 404) return false;
        if (response.ok) {
            const data = await response.json();
            // If checking for update, exclude the current report
            if (excludeId && data.id === parseInt(excludeId)) {
                return false;
            }
            return data.exists || false;
        }
        return false;
    } catch (error) {
        console.error('Error checking report number:', error);
        return false;
    }
};

/**
 * Generate unique report number
 * @returns {string} - Generated report number
 */
export const generateReportNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const timestamp = Date.now().toString().slice(-6);
    return `PM-${year}${month}${day}-${timestamp}`;
};

export default {
    fetchReportForEdit,
    formatReportForEdit,
    validateReportData,
    prepareUpdatePayload,
    updateReport,
    handleEditNavigation,
    handleUpdateSuccess,
    handleUpdateError,
    checkReportNumberExists,
    generateReportNumber
};