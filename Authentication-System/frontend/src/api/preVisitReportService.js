// src/api/preVisitReportService.js
import axios from 'axios';

const PREVISIT_API_BASE_URL = 'http://localhost:8088/api';

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
    console.log('📤 [Pre-Visit] Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
preVisitApiClient.interceptors.response.use(
  (response) => {
    console.log('📥 [Pre-Visit] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [Pre-Visit] API Error:', error.response?.status, error.response?.data);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    // Return empty array for 404 to prevent UI crash
    if (error.response?.status === 404) {
      console.warn('⚠️ [Pre-Visit] Endpoint not found, returning empty array');
      return { data: [] };
    }
    return Promise.reject(error);
  }
);

const preVisitReportService = {
  // ✅ CORRECT: Get all reports - GET /previsit-reports
  getAllReports: async () => {
    try {
      console.log('🔄 [Pre-Visit] Fetching all reports from: /previsit-reports');
      const response = await preVisitApiClient.get('/previsit-reports');
      console.log('✅ [Pre-Visit] Reports fetched:', response.data?.length || 0, 'records');
      return response.data || [];
    } catch (error) {
      console.error('❌ [Pre-Visit] Error in getAllReports:', error);
      return [];
    }
  },

  // ✅ Get report by ID - GET /previsit-reports/{id}
  getReportById: async (id) => {
    try {
      console.log('🔍 [Pre-Visit] Fetching report:', id);
      const response = await preVisitApiClient.get(`/previsit-reports/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ [Pre-Visit] Error fetching report:', error);
      throw error.response?.data || 'Failed to fetch report';
    }
  },

  // ✅ Create report - POST /previsit-reports
  createReport: async (reportData) => {
    try {
      console.log('📝 [Pre-Visit] Creating report:', reportData.companyName);
      const response = await preVisitApiClient.post('/previsit-reports', reportData);
      console.log('✅ [Pre-Visit] Report created with ID:', response.data?.id);
      return response.data;
    } catch (error) {
      console.error('❌ [Pre-Visit] Error creating report:', error);
      throw error.response?.data || 'Failed to create report';
    }
  },

  // ✅ Update report - PUT /previsit-reports/{id}
  updateReport: async (id, reportData) => {
    try {
      console.log('📝 [Pre-Visit] Updating report:', id);
      const response = await preVisitApiClient.put(`/previsit-reports/${id}`, reportData);
      console.log('✅ [Pre-Visit] Report updated:', id);
      return response.data;
    } catch (error) {
      console.error('❌ [Pre-Visit] Error updating report:', error);
      throw error.response?.data || 'Failed to update report';
    }
  },

  // ✅ Delete report - DELETE /previsit-reports/{id}
  deleteReport: async (id) => {
    try {
      console.log('🗑️ [Pre-Visit] Deleting report:', id);
      await preVisitApiClient.delete(`/previsit-reports/${id}`);
      console.log('✅ [Pre-Visit] Report deleted:', id);
      return true;
    } catch (error) {
      console.error('❌ [Pre-Visit] Error deleting report:', error);
      throw error.response?.data || 'Failed to delete report';
    }
  },

  // ✅ Search reports - GET /previsit-reports/search?keyword=...
  searchReports: async (keyword) => {
    try {
      console.log('🔍 [Pre-Visit] Searching reports:', keyword);
      const response = await preVisitApiClient.get(`/previsit-reports/search?keyword=${encodeURIComponent(keyword)}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ [Pre-Visit] Error searching reports:', error);
      return [];
    }
  },

  // ✅ Get reports by company - GET /previsit-reports/company?companyName=...
  getReportsByCompany: async (companyName) => {
    try {
      console.log('🏢 [Pre-Visit] Fetching reports for company:', companyName);
      const response = await preVisitApiClient.get(`/previsit-reports/company?companyName=${encodeURIComponent(companyName)}`);
      return response.data || [];
    } catch (error) {
      console.error('❌ [Pre-Visit] Error fetching reports by company:', error);
      return [];
    }
  },

  // ✅ Check if email exists - GET /previsit-reports/exists?email=...
  checkEmailExists: async (emailId) => {
    try {
      console.log('📧 [Pre-Visit] Checking email:', emailId);
      const response = await preVisitApiClient.get(`/previsit-reports/exists?email=${encodeURIComponent(emailId)}`);
      console.log('✅ [Pre-Visit] Email exists:', response.data);
      return response.data || false;
    } catch (error) {
      console.error('❌ [Pre-Visit] Error checking email:', error);
      return false;
    }
  },
};

export default preVisitReportService;