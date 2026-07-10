import axios from 'axios';

const API_BASE_URL = 'http://localhost:8086/api/reports';

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

export const reportService = {
  // Create new report
  createReport: async (reportData) => {
    try {
      const response = await api.post('/', reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all reports
  getAllReports: async () => {
    try {
      const response = await api.get('/');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get report by ID
  getReportById: async (id) => {
    try {
      const response = await api.get(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get report by Report Number
  getReportByReportNo: async (reportNo) => {
    try {
      const response = await api.get(`/report-number/${reportNo}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update report
  updateReport: async (id, reportData) => {
    try {
      const response = await api.put(`/${id}`, reportData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete report
  deleteReport: async (id) => {
    try {
      const response = await api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Search reports by date range
  searchByDateRange: async (startDate, endDate) => {
    try {
      const response = await api.get(`/search?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get reports by technician
  getReportsByTechnician: async (technicianName) => {
    try {
      const response = await api.get(`/installed-by/${technicianName}`);
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
};

export default InstallationReportService;