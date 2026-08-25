// src/services/CalibrationReportService.js
import axios from 'axios';
import { getCached, setCached, invalidate, LIST_CACHE_TTL } from '../utils/cache';
import { env } from '../config/env';
import { handleUnauthorizedResponse } from '../utils/authSession';
import { formatCalibrationReportNo, formatCalibrationSerialNo } from '../utils/calibrationReportValidators';

const normalizeReport = (report) => {
  if (!report || typeof report !== 'object') return report;
  return {
    ...report,
    reportNo: formatCalibrationReportNo(report.reportNo),
    serialNo: formatCalibrationSerialNo(report.serialNo) || report.serialNo,
  };
};

const normalizeReports = (data) => {
  if (Array.isArray(data)) return data.map(normalizeReport);
  return normalizeReport(data);
};

const LIST_CACHE_KEY = 'calibration_reports_list';

const api = axios.create({
  baseURL: env.CALIBRATION_REPORTS_URL,
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

export const calibrationReportService = {
  async createReport(data) {
    const response = await api.post('', data);
    invalidate('calibration_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return normalizeReport(response.data);
  },

  async updateReport(id, data) {
    const response = await api.put(`/${id}`, data);
    invalidate('calibration_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return normalizeReport(response.data);
  },

  async getReportById(id) {
    const response = await api.get(`/${id}`);
    return normalizeReport(response.data);
  },

  async getAllReports(options = {}) {
    const { forceRefresh = false } = options;
    if (!forceRefresh) {
      const cached = getCached(LIST_CACHE_KEY);
      if (cached) return normalizeReports(cached);
    }
    const response = await api.get('');
    const data = response.data;
    setCached(LIST_CACHE_KEY, data, LIST_CACHE_TTL);
    return normalizeReports(data);
  },

  async deleteReport(id) {
    const response = await api.delete(`/${id}`);
    invalidate('calibration_reports');
    localStorage.removeItem('dashboard_data');
    localStorage.removeItem('dashboard_timestamp');
    return response.data;
  },
};
