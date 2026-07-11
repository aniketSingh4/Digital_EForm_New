// src/services/calibrationReportService.js
import axios from 'axios';

const API_URL = '/api/calibration-reports';

export const calibrationReportService = {
    // Create a new report
    async createReport(data) {
        try {
            const response = await axios.post(API_URL, data);
            console.log('✅ API Response:', response.data);
            // ✅ Your API returns the DTO directly in response.data
            return response.data;
        } catch (error) {
            console.error('❌ Error creating report:', error);
            throw error;
        }
    },

    // Update an existing report
    async updateReport(id, data) {
        try {
            const response = await axios.put(`${API_URL}/${id}`, data);
            return response.data;
        } catch (error) {
            console.error('❌ Error updating report:', error);
            throw error;
        }
    },

    // Get a single report by ID
    async getReportById(id) {
        try {
            const response = await axios.get(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching report:', error);
            throw error;
        }
    },

    // Get all reports
    async getAllReports() {
        try {
            const response = await axios.get(API_URL);
            return response.data;
        } catch (error) {
            console.error('❌ Error fetching reports:', error);
            throw error;
        }
    },

    // Delete a report
    async deleteReport(id) {
        try {
            const response = await axios.delete(`${API_URL}/${id}`);
            return response.data;
        } catch (error) {
            console.error('❌ Error deleting report:', error);
            throw error;
        }
    }
};