// src/services/InstallationReportService.js
import axios from 'axios';
import { getCached, setCached, invalidate, LIST_CACHE_TTL } from '../utils/cache';
import { env } from '../config/env';
import { handleUnauthorizedResponse } from '../utils/authSession';

const LIST_CACHE_KEY = 'installation_reports_list';

const api = axios.create({
  baseURL: env.INSTALLATION_REPORTS_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    handleUnauthorizedResponse(error);
    return Promise.reject(error);
  }
);

export const installationReportService = {
  createReport: async (reportData) => {
    const response = await api.post('', reportData);
    invalidate('installation_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return response.data;
  },

  getAllReports: async (options = {}) => {
    const { forceRefresh = false } = options;
    if (!forceRefresh) {
      const cached = getCached(LIST_CACHE_KEY);
      if (cached) return cached;
    }
    const response = await api.get('');
    const data = response.data;
    setCached(LIST_CACHE_KEY, data, LIST_CACHE_TTL);
    return data;
  },

  getReportById: async (id) => {
    const response = await api.get(`/${id}`);
    return response.data;
  },

  getReportByReportNo: async (reportNo) => {
    const response = await api.get(`/report-number/${reportNo}`);
    return response.data;
  },

  updateReport: async (id, reportData) => {
    const response = await api.put(`/${id}`, reportData);
    invalidate('installation_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return response.data;
  },

  deleteReport: async (id) => {
    const response = await api.delete(`/${id}`);
    invalidate('installation_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return response.data;
  },

  generateReportNumber: async () => {
    const response = await api.get('/generate-report-number');
    return response.data;
  },
};

// Keep legacy export name used by older imports if any
export const calibrationReportService = installationReportService;
export default installationReportService;
