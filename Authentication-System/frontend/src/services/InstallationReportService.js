// src/services/calibrationReportService.js
import axios from 'axios';

//FIXED: Use the correct port (8086)
const API_BASE_URL = 'http://localhost:8086/api/installation-reports';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const calibrationReportService = {
  // Create new calibration report
  createReport: async (reportData) => {
    try {
      console.log('📤 Creating report at:', API_BASE_URL);
      const response = await api.post('/', reportData);
      console.log('✅ Report created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Create error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get all calibration reports
  getAllReports: async () => {
    try {
      console.log('📥 Fetching reports from:', API_BASE_URL);
      const response = await api.get('/');
      console.log('📦 Response status:', response.status);
      console.log('📦 Response data:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Fetch error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Get calibration report by ID
  getReportById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get calibration report by Report Number
  getReportByReportNo: async (reportNo) => {
    try {
      const response = await api.get(`/report-number/${reportNo}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update calibration report
  updateReport: async (id, reportData) => {
    try {
      const response = await api.put(`/${id}`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete calibration report
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search calibration reports by date range
  searchByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/search?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get calibration reports by client
  getReportsByClient: async (clientName) => {
    try {
      const response = await api.get(`/client/${clientName}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get calibration reports by sensor
  getReportsBySensor: async (sensorId) => {
    try {
      const response = await api.get(`/sensor/${sensorId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Generate report number
  generateReportNumber: async () => {
    try {
      const response = await api.get('/generate-report-number');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get calibration summary statistics
  getSummaryStats: async () => {
    try {
      const response = await api.get('/summary/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get reports by status
  getReportsByStatus: async (status) => {
    try {
      const response = await api.get(`/status/${status}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Bulk delete reports
  bulkDeleteReports: async (ids) => {
    try {
      const response = await api.post('/bulk-delete', { ids });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export reports to CSV
  exportToCSV: async (filters) => {
    try {
      const response = await api.post('/export/csv', filters, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Export reports to Excel
  exportToExcel: async (filters) => {
    try {
      const response = await api.post('/export/excel', filters, {
        responseType: 'blob',
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default calibrationReportService;