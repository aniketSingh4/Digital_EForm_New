// src/components/PreVisitReport/PreVisitReportList.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEdit, FaTrash, FaFilePdf, FaSpinner, FaImage, FaCheckCircle } from 'react-icons/fa';
import preVisitReportService from '../../api/preVisitReportService';
import './PreVisitReportList.css';
import notificationService from '../../services/notificationService';

const PreVisitReportList = ({ onEdit, refreshTrigger }) => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [imageCounts, setImageCounts] = useState({});

  useEffect(() => {
    fetchReports();
  }, [refreshTrigger]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const data = await preVisitReportService.getAllReports();
      setReports(data);
      setError(null);
      
      // Fetch image counts for each report
      await fetchAllImageCounts(data);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllImageCounts = async (reportsData) => {
    try {
      const counts = {};
      for (const report of reportsData) {
        try {
          const images = await preVisitReportService.getImagesByReport(report.id);
          counts[report.id] = images ? images.length : 0;
        } catch (error) {
          counts[report.id] = 0;
        }
      }
      setImageCounts(counts);
    } catch (error) {
      console.error('Error fetching image counts:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      setActionLoading(id);
      await preVisitReportService.deleteReport(id);
      await fetchReports();
      const deleted = reports.find((item) => item.id === id) || {};
      notificationService.reportDeletedAction('Pre-Visit Checklist', {
        id,
        reportType: 'Pre-Visit Checklist',
        reportName: deleted.companyName,
        customerName: deleted.customerName || deleted.companyName,
        location: deleted.siteAddress,
      });
    } catch (error) {
      notificationService.error(error.message || 'Failed to delete report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleView = (report) => {
    navigate(`/previsit/${report.id}`);
  };

  const handlePDF = async (report) => {
    // PDF generation logic
    notificationService.info('PDF generation coming soon...');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (report) => {
    if (!report.checklist || report.checklist.length === 0) {
      return <span className="status-badge status-pending">Pending</span>;
    }
    const completed = report.checklist.filter(item => item.status === true).length;
    const total = report.checklist.length;
    if (completed === total) {
      return <span className="status-badge status-complete">Complete</span>;
    } else if (completed > 0) {
      return <span className="status-badge status-progress">In Progress</span>;
    }
    return <span className="status-badge status-pending">Pending</span>;
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
      <div className="list-header">
        <h2>Pre-Visit Reports</h2>
        <span className="report-count">{reports.length} Reports</span>
      </div>

      <div className="table-wrapper">
        <table className="reports-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>S.No</th>
              <th style={{ width: '70px' }}>ID</th>
              <th>Company Name</th>
              <th>Site Person</th>
              <th>Visit Date</th>
              <th>Status</th>
              <th style={{ width: '90px' }}>Images</th>
              <th style={{ width: '240px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report, index) => (
              <tr key={report.id}>
                <td>{index + 1}</td>
                <td className="report-id">#{String(report.id).padStart(3, '0')}</td>
                <td className="company-name">
                  <span className="company-text">{report.companyName || '-'}</span>
                </td>
                <td>{report.sitePersonName || '-'}</td>
                <td>{formatDate(report.visitDate)}</td>
                <td>{getStatusBadge(report)}</td>
                <td>
                  <div className="image-count-badge">
                    <FaImage className="image-icon" />
                    <span>{imageCounts[report.id] || 0}</span>
                    {imageCounts[report.id] > 0 && (
                      <FaCheckCircle className="image-check" />
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn view-btn"
                      onClick={() => handleView(report)}
                      title="View Details"
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