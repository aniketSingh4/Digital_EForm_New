// src/components/PreVisitReport/PreVisitReportList.jsx
import React, { useState, useEffect } from 'react';
import { FaEye, FaEdit, FaTrash, FaFilePdf, FaSpinner } from 'react-icons/fa';
import preVisitReportService from '../../api/preVisitReportService';
import './PreVisitReportList.css';
import notificationService from '../../services/notificationService';

const PreVisitReportList = ({ onEdit, refreshTrigger }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await preVisitReportService.getAllReports();
      setReports(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      setActionLoading(id);
      await preVisitReportService.deleteReport(id);
      await fetchReports();
      //alert('✅ Report deleted successfully!');
      notificationService.success('Report deleted successfully!');
    } catch (error) {
      //alert('❌ Failed to delete report');
      notificationService.error(error.message || 'Failed to delete report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (report) => {
    // Navigate to view page
    window.location.href = `/previsit/${report.id}`;
  };

  const handlePDF = async (report) => {
    // PDF generation logic
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <FaSpinner className="spinner" />
        <p>Loading reports...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={fetchReports}>Retry</button>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-icon">📋</div>
        <h3>No Reports Found</h3>
        <p>Create your first pre-visit report to get started.</p>
      </div>
    );
  }

  return (
    <div className="pre-visit-list-container">
      <div className="table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th style={{ width: '60px' }}>#</th>
              <th>ID</th>
              <th>Company Name</th>
              <th>Site Person</th>
              <th>Visit Date</th>
              <th>Email</th>
              <th style={{ width: '220px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={report.id}>
                <td>{index + 1}</td>
                <td className="report-id">#{String(report.id).padStart(3, '0')}</td>
                <td className="company-name">{report.companyName || '-'}</td>
                <td>{report.sitePersonName || '-'}</td>
                <td>{formatDate(report.visitDate)}</td>
                <td className="email-cell">{report.emailId || '-'}</td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleView(report)}
                      title="View"
                    >
                      <FaEye />
                      <span className="btn-label">View</span>
                    </button>
                    <button
                      className="action-btn edit-btn"
                      onClick={() => onEdit(report)}
                      title="Edit"
                    >
                      <FaEdit />
                      <span className="btn-label">Edit</span>
                    </button>
                    <button
                      className="action-btn pdf-btn"
                      onClick={() => handlePDF(report)}
                      title="PDF"
                      disabled={actionLoading === `pdf-${report.id}`}
                    >
                      {actionLoading === `pdf-${report.id}` ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                      <span className="btn-label">PDF</span>
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(report.id)}
                      title="Delete"
                      disabled={actionLoading === report.id}
                    >
                      {actionLoading === report.id ? <FaSpinner className="spinning" /> : <FaTrash />}
                      <span className="btn-label">Delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PreVisitReportList;