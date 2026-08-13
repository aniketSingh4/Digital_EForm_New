// src/api/preVisitReportService.js
import axios from 'axios';
import { getCached, setCached, invalidate, LIST_CACHE_TTL } from '../utils/cache';

const PREVISIT_API_BASE_URL = 'https://previsit-reports.onrender.com/api';
const LIST_CACHE_KEY = 'previsit_reports_list';

const preVisitApiClient = axios.create({
  baseURL: PREVISIT_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
preVisitApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
preVisitApiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[Pre-Visit] API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      window.location.href = '/login';
    }
    if (error.response?.status === 404) {
      console.warn('[Pre-Visit] Endpoint not found, returning empty array');
      return { data: [] };
    }
    return Promise.reject(error);
  }
);

const clearPreVisitCaches = () => {
  invalidate('previsit_reports');
  localStorage.removeItem('dashboard_data');
  localStorage.removeItem('dashboard_timestamp');
};

const preVisitReportService = {
  //Get all reports - GET /previsit-reports
  getAllReports: async (options = {}) => {
    try {
      const { forceRefresh = false } = options;
      if (!forceRefresh) {
        const cached = getCached(LIST_CACHE_KEY);
        if (cached) return cached;
      }
      const response = await preVisitApiClient.get('/previsit-reports');
      const data = response.data || [];
      setCached(LIST_CACHE_KEY, data, LIST_CACHE_TTL);
      return data;
    } catch (error) {
      console.error('[Pre-Visit] Error in getAllReports:', error);
      return [];
    }
  },

  //Get report by ID - GET /previsit-reports/{id}
  getReportById: async (id) => {
    try {
      const response = await preVisitApiClient.get(`/previsit-reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('[Pre-Visit] Error fetching report:', error);
      throw error.response?.data || 'Failed to fetch report';
    }
  },

  // Create report - POST /previsit-reports
  createReport: async (reportData) => {
    try {
      const response = await preVisitApiClient.post('/previsit-reports', reportData);
      clearPreVisitCaches();
      return response.data;
    } catch (error) {
      console.error('[Pre-Visit] Error creating report:', error);
      throw error.response?.data || 'Failed to create report';
    }
  },

  //Update report - PUT /previsit-reports/{id}
  updateReport: async (id, reportData) => {
    try {
      const response = await preVisitApiClient.put(`/previsit-reports/${id}`, reportData);
      clearPreVisitCaches();
      return response.data;
    } catch (error) {
      console.error('[Pre-Visit] Error updating report:', error);
      throw error.response?.data || 'Failed to update report';
    }
  },

  //Delete report - DELETE /previsit-reports/{id}
  deleteReport: async (id) => {
    try {
      await preVisitApiClient.delete(`/previsit-reports/${id}`);
      clearPreVisitCaches();
      return true;
    } catch (error) {
      console.error('[Pre-Visit] Error deleting report:', error);
      throw error.response?.data || 'Failed to delete report';
    }
  },

  //Search reports - GET /previsit-reports/search?keyword=...
  searchReports: async (keyword) => {
    try {
      //console.log('[Pre-Visit] Searching reports:', keyword);
      const response = await preVisitApiClient.get(`/previsit-reports/search?keyword=${encodeURIComponent(keyword)}`);
      return response.data || [];
    } catch (error) {
      console.error('[Pre-Visit] Error searching reports:', error);
      return [];
    }
  },

  //Get reports by company - GET /previsit-reports/company?companyName=...
  getReportsByCompany: async (companyName) => {
    try {
      //console.log('[Pre-Visit] Fetching reports for company:', companyName);
      const response = await preVisitApiClient.get(`/previsit-reports/company?companyName=${encodeURIComponent(companyName)}`);
      return response.data || [];
    } catch (error) {
      console.error('[Pre-Visit] Error fetching reports by company:', error);
      return [];
    }
  },

  //Check email exists - GET /previsit-reports/exists?email=...
  checkEmailExists: async (email, excludeId = null) => {
    try {
      //console.log('[Pre-Visit] Checking email:', email);
      const params = { email };
      if (excludeId) {
        params.excludeId = excludeId;
      }
      const response = await preVisitApiClient.get('/previsit-reports/exists', { params });
      //console.log('[Pre-Visit] Email exists:', response.data);
      return response.data || false;
    } catch (error) {
      console.error('[Pre-Visit] Error checking email:', error);
      return false;
    }
  },

  //Get report count - GET /previsit-reports/count
  getReportCount: async () => {
    try {
      //console.log('[Pre-Visit] Fetching report count');
      const response = await preVisitApiClient.get('/previsit-reports/count');
      return response.data || 0;
    } catch (error) {
      console.error('[Pre-Visit] Error fetching report count:', error);
      return 0;
    }
  },

  // ========================================
  // IMAGE MANAGEMENT OPERATIONS
  // ========================================

  /**
   * Upload images for a report - POST /previsit-reports/images/upload/{reportId}
   * @param {number} reportId - Report ID
   * @param {FormData} formData - FormData containing image files
   * @param {Object} options - Upload options
   * @returns {Promise<Array>} - Uploaded images data
   */
  uploadImages: async (reportId, formData, options = {}) => {
    try {
      //console.log('[Pre-Visit] Uploading images for report:', reportId);
      const response = await preVisitApiClient.post(
        `/previsit-reports/images/upload/${reportId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          ...options
        }
      );
      //console.log('[Pre-Visit] Images uploaded:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('[Pre-Visit] Error uploading images:', error);
      throw error.response?.data || 'Failed to upload images';
    }
  },

  /**
   * Upload a single image as base64 - POST /previsit-reports/images/upload-base64/{reportId}
   * @param {number} reportId - Report ID
   * @param {Object} imageData - Image data object
   * @param {string} imageData.imageData - Base64 image data
   * @param {string} imageData.imageName - Image name
   * @param {boolean} imageData.isFinal - Is this a final image
   * @param {string} imageData.description - Image description
   * @returns {Promise<Object>} - Uploaded image data
   */
  uploadBase64Image: async (reportId, imageData) => {
    try {
      //console.log('[Pre-Visit] Uploading base64 image for report:', reportId);
      const response = await preVisitApiClient.post(
        `/previsit-reports/images/upload-base64/${reportId}`,
        imageData
      );
      //console.log('[Pre-Visit] Base64 image uploaded:', response.data?.id);
      return response.data;
    } catch (error) {
      console.error('[Pre-Visit] Error uploading base64 image:', error);
      throw error.response?.data || 'Failed to upload image';
    }
  },

  /**
   * Get all images for a report - GET /previsit-reports/images/report/{reportId}
   * @param {number} reportId - Report ID
   * @returns {Promise<Array>} - List of images
   */
  getImagesByReport: async (reportId) => {
    try {
      //console.log('[Pre-Visit] Fetching images for report:', reportId);
      const response = await preVisitApiClient.get(`/previsit-reports/images/report/${reportId}`);
      //console.log('[Pre-Visit] Images fetched:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('[Pre-Visit] Error fetching images:', error);
      return [];
    }
  },

  /**
   * Get final images for a report - GET /previsit-reports/images/report/{reportId}/final
   * @param {number} reportId - Report ID
   * @returns {Promise<Array>} - List of final images
   */
  getFinalImagesByReport: async (reportId) => {
    try {
      //console.log('[Pre-Visit] Fetching final images for report:', reportId);
      const response = await preVisitApiClient.get(`/previsit-reports/images/report/${reportId}/final`);
      //console.log('[Pre-Visit] Final images fetched:', response.data?.length || 0);
      return response.data || [];
    } catch (error) {
      console.error('[Pre-Visit] Error fetching final images:', error);
      return [];
    }
  },

  /**
   * Delete an image - DELETE /previsit-reports/images/{imageId}
   * @param {number} imageId - Image ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteImage: async (imageId) => {
    try {
      //console.log('[Pre-Visit] Deleting image:', imageId);
      await preVisitApiClient.delete(`/previsit-reports/images/${imageId}`);
      //console.log('[Pre-Visit] Image deleted:', imageId);
      return true;
    } catch (error) {
      console.error('[Pre-Visit] Error deleting image:', error);
      throw error.response?.data || 'Failed to delete image';
    }
  },

  /**
   * Delete all images for a report - DELETE /previsit-reports/images/report/{reportId}
   * @param {number} reportId - Report ID
   * @returns {Promise<boolean>} - Success status
   */
  deleteAllImages: async (reportId) => {
    try {
      //console.log('[Pre-Visit] Deleting all images for report:', reportId);
      await preVisitApiClient.delete(`/previsit-reports/images/report/${reportId}`);
      //console.log('[Pre-Visit] All images deleted for report:', reportId);
      return true;
    } catch (error) {
      console.error('[Pre-Visit] Error deleting all images:', error);
      throw error.response?.data || 'Failed to delete images';
    }
  },

  /**
   * Update image details - PUT /previsit-reports/images/{imageId}
   * @param {number} imageId - Image ID
   * @param {Object} updates - Update data
   * @param {string} updates.description - New description
   * @param {boolean} updates.isFinal - New final status
   * @returns {Promise<Object>} - Updated image data
   */
  updateImage: async (imageId, updates) => {
    try {
      //console.log('[Pre-Visit] Updating image:', imageId);
      const response = await preVisitApiClient.put(`/previsit-reports/images/${imageId}`, updates);
      //console.log('[Pre-Visit] Image updated:', imageId);
      return response.data;
    } catch (error) {
      console.error('[Pre-Visit] Error updating image:', error);
      throw error.response?.data || 'Failed to update image';
    }
  },

  /**
   * Get image count for a report - GET /previsit-reports/images/count/{reportId}
   * @param {number} reportId - Report ID
   * @returns {Promise<number>} - Number of images
   */
  getImageCount: async (reportId) => {
    try {
      //console.log('[Pre-Visit] Fetching image count for report:', reportId);
      const response = await preVisitApiClient.get(`/previsit-reports/images/count/${reportId}`);
      return response.data || 0;
    } catch (error) {
      console.error('[Pre-Visit] Error fetching image count:', error);
      return 0;
    }
  },

  /**
   * Get image by ID - GET /previsit-reports/images/{imageId}
   * @param {number} imageId - Image ID
   * @returns {Promise<Object>} - Image data
   */
  getImageById: async (imageId) => {
    try {
      //console.log('[Pre-Visit] Fetching image:', imageId);
      const response = await preVisitApiClient.get(`/previsit-reports/images/${imageId}`);
      return response.data;
    } catch (error) {
      //console.error('[Pre-Visit] Error fetching image:', error);
      throw error.response?.data || 'Failed to fetch image';
    }
  },
};

export default preVisitReportService;