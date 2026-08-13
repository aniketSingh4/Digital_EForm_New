// src/hooks/usePreVisitReports.js
import { useState, useCallback } from 'react';
import preVisitReportService from '../api/preVisitReportService';

export const usePreVisitReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchReports = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preVisitReportService.getAllReports({ forceRefresh });
      setReports(data);
      setTotalCount(data.length);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Search reports
  const searchReports = useCallback(async (keyword) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preVisitReportService.searchReports(keyword);
      setReports(data);
      setTotalCount(data.length);
    } catch (err) {
      console.error('Error searching reports:', err);
      setError('Failed to search reports');
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Delete report
  const deleteReport = useCallback(async (id) => {
    try {
      await preVisitReportService.deleteReport(id);
      // Refresh the list after deletion
      await fetchReports(true);
      return true;
    } catch (err) {
      console.error('Error deleting report:', err);
      throw err;
    }
  }, [fetchReports]);

  // ✅ Get report by ID
  const getReportById = useCallback(async (id) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preVisitReportService.getReportById(id);
      return data;
    } catch (err) {
      console.error('Error fetching report:', err);
      setError('Failed to fetch report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Create report
  const createReport = useCallback(async (reportData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preVisitReportService.createReport(reportData);
      await fetchReports(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error creating report:', err);
      setError('Failed to create report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  // ✅ Update report
  const updateReport = useCallback(async (id, reportData) => {
    try {
      setLoading(true);
      setError(null);
      const data = await preVisitReportService.updateReport(id, reportData);
      await fetchReports(); // Refresh the list
      return data;
    } catch (err) {
      console.error('Error updating report:', err);
      setError('Failed to update report');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchReports]);

  return {
    reports,
    loading,
    error,
    totalCount,
    fetchReports,
    searchReports,
    deleteReport,
    getReportById,
    createReport,
    updateReport
  };
};