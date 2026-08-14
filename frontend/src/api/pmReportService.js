// src/api/pmReportService.js
import axios from 'axios';
import { invalidate } from '../utils/cache';
import { env } from '../config/env';

const apiClient = axios.create({
  baseURL: env.PM_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 120000,
});

// Interceptors
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('userName');
      localStorage.removeItem('userRole');
      localStorage.removeItem('dashboard_data');
      localStorage.removeItem('dashboard_timestamp');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Map Inspection Status to enum values expected by backend
 * Converts "Yes" -> "YES", "No" -> "NO"
 */
const mapInspectionStatus = (status) => {
  if (!status) return "NO";

  const statusStr = String(status).trim().toUpperCase();

  // Check if it's already a valid enum value
  if (statusStr === "YES" || statusStr === "NO") {
    return statusStr;
  }

  // Handle various input formats
  const statusMap = {
    "Y": "YES",
    "TRUE": "YES",
    "1": "YES",
    "OK": "YES",
    "PASS": "YES",
    "GOOD": "YES",
    "N": "NO",
    "FALSE": "NO",
    "0": "NO",
    "FAIL": "NO",
    "BAD": "NO",
    "": "NO"
  };

  return statusMap[statusStr] || "NO";
};

/**
 * Map PM Status to enum values expected by backend
 */
export const mapPMStatus = (status) => {
  if (!status) return "";

  const statusStr = String(status).trim().toUpperCase();

  const statusMap = {
    "SATISFACTORY": "SATISFACTORY",
    "FOLLOW_UP_VISIT_REQUIRED": "FOLLOW_UP_VISIT_REQUIRED",
    "REQUIRES_ATTENTION": "REQUIRES_ATTENTION",
    "FOLLOW UP VISIT REQUIRED": "FOLLOW_UP_VISIT_REQUIRED",
    "FOLLOWUP VISIT REQUIRED": "FOLLOW_UP_VISIT_REQUIRED",
    "REQUIRES ATTENTION": "REQUIRES_ATTENTION"
  };

  return statusMap[statusStr] || statusStr;
};

/**
 * Map Site Condition to enum values expected by backend
 */
export const mapSiteCondition = (condition) => {
  if (!condition) return "";

  const conditionStr = String(condition).trim().toUpperCase().replace(/ /g, "_");

  const conditionMap = {
    "SYSTEM_OPERATIONAL": "SYSTEM_OPERATIONAL",
    "SYSTEM_NOT_OPERATIONAL": "SYSTEM_NOT_OPERATIONAL",
    "SYSTEM_OPERATIONAL_WITH_OBSERVATION": "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
    "SYSTEM_OPERATIONAL_WITH_ISSUES": "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
    "OPERATIONAL": "SYSTEM_OPERATIONAL",
    "NOT_OPERATIONAL": "SYSTEM_NOT_OPERATIONAL",
    "WITH_ISSUES": "SYSTEM_OPERATIONAL_WITH_OBSERVATION",
    "WITH_OBSERVATION": "SYSTEM_OPERATIONAL_WITH_OBSERVATION"
  };

  return conditionMap[conditionStr] || conditionStr;
};

/**
 * Map Checklist Category to enum values expected by backend
 */
const mapChecklistCategory = (category) => {
  if (!category) return "PHYSICAL_INSPECTION";

  const categoryStr = String(category).trim().toUpperCase();

  const categoryMap = {
    "PHYSICAL_INSPECTION": "PHYSICAL_INSPECTION",
    "PHYSICAL INSPECTION": "PHYSICAL_INSPECTION",
    "POWER_SUPPLY": "POWER_SUPPLY",
    "POWER SUPPLY": "POWER_SUPPLY",
    "SENSOR_HEALTH": "SENSOR_HEALTH",
    "SENSOR HEALTH": "SENSOR_HEALTH",
    "COMMUNICATION": "COMMUNICATION",
    "CALIBRATION_PERFORMANCE_VERIFICATION": "CALIBRATION_PERFORMANCE_VERIFICATION",
    "CALIBRATION PERFORMANCE VERIFICATION": "CALIBRATION_PERFORMANCE_VERIFICATION",
    "CALIBRATION": "CALIBRATION_PERFORMANCE_VERIFICATION",
    "CLEANING_ACTIVITY": "CLEANING_ACTIVITY",
    "CLEANING ACTIVITY": "CLEANING_ACTIVITY",
    "CLEANING": "CLEANING_ACTIVITY"
  };

  return categoryMap[categoryStr] || "PHYSICAL_INSPECTION";
};

/**
 * NEW: Remove immutable fields for update
 * These fields cannot be changed after creation
 */
const removeImmutableFields = (payload) => {
  // Create a copy to avoid mutating the original
  const cleanPayload = { ...payload };
  
  // Remove immutable fields
  delete cleanPayload.serviceReportNo;
  delete cleanPayload.serviceVisitNo;
  delete cleanPayload.sensorId;
  
  console.log('Immutable fields removed for update:', {
    removed: ['serviceReportNo', 'serviceVisitNo', 'sensorId'],
    remainingFields: Object.keys(cleanPayload)
  });
  
  return cleanPayload;
};

/**
 * Transforms form data to the exact API format required by backend
 * @param {Object} formData - The form data
 * @param {boolean} isEditMode - Whether this is an edit operation
 */
export const transformDataForAPI = (formData, isEditMode = false) => {
  // console.log("Transforming form data:", formData);

  const { report, inspection, technical, summary, signoff } = formData;

  const checklists = [];

  const addChecklistItems = (dataObject, category, items) => {
    if (!dataObject) return;

    items.forEach(item => {
      const itemData = dataObject[item.key];
      if (itemData) {
        checklists.push({
          category: mapChecklistCategory(category),
          itemName: item.label,
          status: mapInspectionStatus(itemData.status),
          remark: itemData.remark || ""
        });
      }
    });
  };

  // Physical Inspection
  addChecklistItems(inspection?.physicalInspection, "PHYSICAL_INSPECTION", [
    { key: "Sensor Enclosure Checked", label: "Sensor Enclosure Checked" },
    { key: "Mounting Structure Checked", label: "Mounting Structure Checked" },
    { key: "Cable Condition Checked", label: "Cable Condition Checked" },
    { key: "Dust and Dirt Cleaned", label: "Dust and Dirt Cleaned" },
    { key: "Water Ingress Signs Checked", label: "Water Ingress Signs Checked" }
  ]);

  // Power Supply
  addChecklistItems(inspection?.powerSupply, "POWER_SUPPLY", [
    { key: "Input Voltage Checked", label: "Input Voltage Checked" },
    { key: "SMPS / Adapter Condition Checked", label: "SMPS Adapter Condition Checked" },
    { key: "Earthing Checked", label: "Earthing Checked" },
    { key: "Power Connections Tightened", label: "Power Connections Tightened" }
  ]);

  // Sensor Health
  addChecklistItems(technical?.sensorHealth, "SENSOR_HEALTH", [
    { key: "PM2.5 Sensor Status Checked", label: "PM2.5 Sensor Status Checked" },
    { key: "PM10 Sensor Status Checked", label: "PM10 Sensor Status Checked" },
    { key: "Temperature Status Checked", label: "Temperature Status Checked" },
    { key: "Humidity Status Checked", label: "Humidity Status Checked" },
    { key: "Data Accuracy Checked", label: "Data Accuracy Checked" }
  ]);

  // Communication
  addChecklistItems(technical?.communication, "COMMUNICATION", [
    { key: "SIM Card Status Checked", label: "SIM Card Status Checked" },
    { key: "Network Signal Strength Checked", label: "Network Signal Strength Checked" },
    { key: "Data Transmission Verified", label: "Data Transmission Verified" },
    { key: "Dashboard Connectivity Checked", label: "Dashboard Connectivity Checked" }
  ]);

  // Calibration
  addChecklistItems(technical?.calibration, "CALIBRATION_PERFORMANCE_VERIFICATION", [
    { key: "Sensor Reading Verified", label: "Sensor Reading Verified" },
    { key: "Calibration Status Checked", label: "Calibration Status Checked" },
    { key: "Error Logs Reviewed", label: "Error Logs Reviewed" },
    { key: "Firmware Version Checked", label: "Firmware Version Checked" }
  ]);

  // Cleaning
  addChecklistItems(technical?.cleaning, "CLEANING_ACTIVITY", [
    { key: "Sensor Chamber Cleaned", label: "Sensor Chamber Cleaned" },
    { key: "Air Inlet / Outlet Cleaned", label: "Air Inlet/Outlet Cleaned" },
    { key: "Enclosure Cleaned", label: "Enclosure Cleaned" }
  ]);

  // Build the final API payload
  let apiPayload = {
    serviceReportNo: report?.serviceReportNo || "",
    serviceVisitNo: report?.serviceVisitNo || "",
    clientName: report?.clientName || "",
    siteName: report?.siteName || "",
    sensorId: report?.sensorId || "",
    pmVisitDate: report?.pmVisitDate || report?.pmDate || "",
    engineerName: report?.engineerName || "",
    observation: summary?.observation || "",
    recommendation: summary?.recommendation || "",
    summary: {
      preventiveMaintenanceStatus: mapPMStatus(summary?.pmStatus),
      siteConditionAfterPm: mapSiteCondition(summary?.siteCondition)
    },
    checklists: checklists,
    signOff: {
      clientRepresentativeName: signoff?.clientRepresentativeName || "",
      designation: signoff?.designation || "",
      clientSignature: signoff?.clientRepresentativeName || "",
      clientDate: new Date().toISOString().split('T')[0],
      serviceEngineerName: signoff?.serviceEngineerName || "",
      serviceEngineerSignature: signoff?.serviceEngineerName || "",
      serviceEngineerDate: new Date().toISOString().split('T')[0]
    }
  };

  // If in edit mode, remove immutable fields
  if (isEditMode) {
    apiPayload = removeImmutableFields(apiPayload);
  }

  // Debug: Validate the payload
  // console.log("Final API Payload:", JSON.stringify(apiPayload, null, 2));
  // console.log("Number of checklists:", checklists.length);

  // Validate enum values
  const validStatuses = ["YES", "NO"];
  const invalidStatuses = apiPayload.checklists?.filter(
    item => !validStatuses.includes(item.status)
  ) || [];

  if (invalidStatuses.length > 0) {
    console.warn("Found invalid status values:", invalidStatuses);
  }

  return apiPayload;
};

const getServiceReportNoFromPayload = (formData, payload) =>
  payload?.serviceReportNo
  || formData?.serviceReportNo
  || formData?.report?.serviceReportNo
  || '';

const shouldLookupExistingReport = (error) => {
  if (!error) {
    return false;
  }
  const status = error.response?.status;
  if (status === 409 || (status >= 500 && status < 600)) {
    return true;
  }
  return !error.response && (!!error.request || error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK');
};

export const fetchPMReportByNumber = async (serviceReportNo) => {
  if (!serviceReportNo) {
    return null;
  }
  const response = await apiClient.get(
    `/pm_reports/by-number/${encodeURIComponent(serviceReportNo)}`,
    { timeout: 20000 }
  );
  return response.data;
};

const recoverCreatedReport = async (error, formData, payload) => {
  if (!shouldLookupExistingReport(error)) {
    return null;
  }
  const serviceReportNo = getServiceReportNoFromPayload(formData, payload);
  if (!serviceReportNo) {
    return null;
  }
  const lookup = async () => {
    try {
      return await fetchPMReportByNumber(serviceReportNo);
    } catch {
      return null;
    }
  };
  let existing = await lookup();
  if (!existing && (!error.response || error.code === 'ECONNABORTED')) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    existing = await lookup();
  }
  return existing || null;
};

const successResult = (data) => {
  invalidate('pm_reports');
  localStorage.removeItem('dashboard_data');
  localStorage.removeItem('dashboard_timestamp');
  return {
    success: true,
    data,
    error: null
  };
};

const failureMessage = (error) => {
  if (error.response) {
    const data = error.response.data;
    if (typeof data === 'string' && data.trim()) {
      return data;
    }
    return data?.message || data?.error || `Server error: ${error.response.status}`;
  }
  if (error.code === 'ECONNABORTED') {
    return 'The request timed out. Checking whether the report was saved...';
  }
  if (error.request) {
    return 'No response from server. Please check your network connection.';
  }
  return error.message || 'Failed to submit report';
};

/**
 * Submit PM Report to API (CREATE)
 */
export const submitPMReport = async (formData) => {
  const payload = transformDataForAPI(formData, false);
  try {
    const response = await apiClient.post('/pm_reports', payload, { timeout: 120000 });
    return successResult(response.data);
  } catch (error) {
    const recovered = await recoverCreatedReport(error, formData, payload);
    if (recovered) {
      return successResult(recovered);
    }
    console.error("Submit error:", error);
    return {
      success: false,
      data: null,
      error: failureMessage(error)
    };
  }
};

/**
 * NEW: Update PM Report to API (UPDATE)
 * @param {string|number} id - Report ID
 * @param {Object} formData - Form data
 * @param {Function} onProgress - Progress callback
 */
export const updatePMReport = async (id, formData, onProgress) => {
  try {
    // Transform data for API with edit mode = true
    const payload = transformDataForAPI(formData, true);

    // console.log(`Updating report ${id} with payload:`, JSON.stringify(payload, null, 2));

    const response = await apiClient.put(`/pm_reports/${id}`, payload, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      }
    });

    // console.log("Update success:", response.data);
    invalidate('pm_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return {
      success: true,
      data: response.data,
      error: null
    };

  } catch (error) {
    // console.error("Update error:", error);

    let errorMessage = error.message;
    if (error.response) {
      errorMessage = error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`;
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your network connection.';
    }

    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
};

/**
 * Submit PM Report with progress tracking (CREATE)
 */
export const submitPMReportWithProgress = async (formData, onProgress) => {
  let payload = formData;

  if (formData.report) {
    payload = transformDataForAPI(formData, false);
  }

  try {
    const response = await apiClient.post('/pm_reports', payload, {
      timeout: 120000,
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      }
    });

    return successResult(response.data);
  } catch (error) {
    const recovered = await recoverCreatedReport(error, formData, payload);
    if (recovered) {
      return successResult(recovered);
    }

    return {
      success: false,
      data: null,
      error: failureMessage(error)
    };
  }
};

/**
 * NEW: Update PM Report with progress tracking (UPDATE)
 */
export const updatePMReportWithProgress = async (id, formData, onProgress) => {
  try {
    let payload = formData;

    // If it has a 'report' property, it's the raw form data
    if (formData.report) {
      payload = transformDataForAPI(formData, true); // Pass true for edit mode
    }

    // console.log(`Updating report ${id} with payload:`, JSON.stringify(payload, null, 2));
    // console.log("Checklists in payload:", payload.checklists?.length || 0);

    const response = await apiClient.put(`/pm_reports/${id}`, payload, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      }
    });

    //console.log("Update success:", response.data);
    invalidate('pm_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return {
      success: true,
      data: response.data,
      error: null
    };

  } catch (error) {
    //console.error("Update error:", error);

    let errorMessage = error.message;
    if (error.response) {
      errorMessage = error.response.data?.message ||
        error.response.data?.error ||
        `Server error: ${error.response.status}`;
      console.error("Response data:", error.response.data);
    } else if (error.request) {
      errorMessage = 'No response from server. Please check your network connection.';
    }

    return {
      success: false,
      data: null,
      error: errorMessage
    };
  }
};

/**
 * Clear sensor cache
 */
export const clearSensorCache = () => {
  window.dispatchEvent(new CustomEvent('sensorCacheCleared'));
};

/**
 * Fetch Report by ID
 */
export const fetchPMReport = async (id) => {
  try {
    const response = await apiClient.get(`/pm_reports/${id}`);
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
    throw error;
  }
};

export default apiClient;