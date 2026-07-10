import axios from 'axios';

const API_BASE_URL = 'http://localhost:8087/api';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor for authentication
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('📤 API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', error.response?.data || error.message);
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const API_URL = '/calibration-reports';

// Named export
export const calibrationReportService = {
  // Get all calibration reports
  getAllReports: async () => {
    try {
      console.log('📊 Fetching all reports...');
      const response = await axiosInstance.get(API_URL);
      return response.data;
    } catch (error) {
      console.error('❌ Error fetching reports:', error);
      throw error;
    }
  },

  // Get calibration report by ID
  getReportById: async (id) => {
    try {
      console.log(`🔍 Fetching report with ID: ${id}`);
      if (!id) {
        throw new Error('Report ID is required');
      }
      const response = await axiosInstance.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`❌ Error fetching report ${id}:`, error);
      throw error;
    }
  },

  // Create new calibration report
  createReport: async (data) => {
    try {
      console.log('📝 Creating new report:', data);
      const response = await axiosInstance.post(API_URL, data);
      console.log('✅ Report created:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Error creating report:', error.response?.data || error.message);
      throw error;
    }
  },

  // Update calibration report
  updateReport: async (id, data) => {
    try {
      console.log(`📝 Updating report ${id}:`, data);
      if (!id) {
        throw new Error('Report ID is required for update');
      }
      const response = await axiosInstance.put(`${API_URL}/${id}`, data);
      console.log('✅ Report updated:', response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ Error updating report ${id}:`, error.response?.data || error.message);
      throw error;
    }
  },

  // Delete calibration report
  deleteReport: async (id) => {
    try {
      console.log(`🗑️ Deleting report ${id}`);
      if (!id) {
        throw new Error('Report ID is required for deletion');
      }
      const response = await axiosInstance.delete(`${API_URL}/${id}`);
      console.log('✅ Report deleted');
      return response.data;
    } catch (error) {
      console.error(`❌ Error deleting report ${id}:`, error);
      throw error;
    }
  },

  // Get reports by client name
  getReportsByClient: async (clientName) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/client/${clientName}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get report count
  getReportCount: async () => {
    try {
      const response = await axiosInstance.get(`${API_URL}/count`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get reports by date range
  getReportsByDateRange: async (startDate, endDate) => {
    try {
      const response = await axiosInstance.get(`${API_URL}/search?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};

// Default export (for backward compatibility)
export default calibrationReportService;