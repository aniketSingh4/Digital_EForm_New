// src/components/PreVisitReport/PreVisitReportDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaEdit, FaTrash, FaSpinner } from 'react-icons/fa';
import preVisitReportService from '../../api/preVisitReportService';
import './PreVisitReportDetail.css';

const PreVisitReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (id) {
      fetchReportDetails(id);
    }
  }, [id]);

  const fetchReportDetails = async (reportId) => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the service method - this will call /previsit-reports/{id}
      const data = await preVisitReportService.getReportById(reportId);
      
      if (data) {
        setReport(data);
      } else {
        setError('Report not found');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      // Check if it's a 404 error
      if (err === 'Failed to fetch report' || err?.status === 404) {
        setError('Report not found. It may have been deleted.');
      } else {
        setError('Failed to load report details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await preVisitReportService.deleteReport(id);
      alert('✅ Report deleted successfully!');
      navigate('/previsit');
    } catch (error) {
      alert('❌ Failed to delete report');
    }
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
      <div className="detail-loading">
        <FaSpinner className="spinner" />
        <p>Loading report details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="detail-error">
        <div className="error-content">
          <p>{error}</p>
          <button onClick={() => fetchReportDetails(id)}>Retry</button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="detail-empty">
        <p>Report not found</p>
        <button onClick={() => navigate('/previsit')}>Back to Reports</button>
      </div>
    );
  }

  return (
    <div className="pre-visit-detail-container">
      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/previsit')}>
          <FaArrowLeft /> Back to Reports
        </button>
        <h1>Pre-Visit Report Details</h1>
        <div className="detail-actions">
          <button className="edit-btn" onClick={() => navigate(`/previsit/edit/${report.id}`)}>
            <FaEdit /> Edit
          </button>
          <button className="delete-btn" onClick={handleDelete}>
            <FaTrash /> Delete
          </button>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Report ID</label>
              <span>#{String(report.id).padStart(3, '0')}</span>
            </div>
            <div className="detail-item">
              <label>Visit Date</label>
              <span>{formatDate(report.visitDate)}</span>
            </div>
            <div className="detail-item">
              <label>Company Name</label>
              <span>{report.companyName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Site Address</label>
              <span>{report.siteAddress || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Site Person Name</label>
              <span>{report.sitePersonName || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Contact No</label>
              <span>{report.contactNo || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Email ID</label>
              <span>{report.emailId || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Inspected By</label>
              <span>{report.inspectedBy || 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h3>Checklist</h3>
          {report.checklist && report.checklist.length > 0 ? (
            <div className="checklist-detail">
              {report.checklist.map((item, index) => (
                <div key={index} className="checklist-detail-item">
                  <span className="checklist-number">{index + 1}.</span>
                  <span className="checklist-field">{item.fieldName}</span>
                  <span className={`checklist-status ${item.status ? 'yes' : 'no'}`}>
                    {item.status ? '✅ YES' : '❌ NO'}
                  </span>
                  {item.remark && (
                    <span className="checklist-remark">Remark: {item.remark}</span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="no-data">No checklist items found</p>
          )}
        </div>

        {report.notedIfAny && (
          <div className="detail-section">
            <h3>Additional Notes</h3>
            <p className="notes-content">{report.notedIfAny}</p>
          </div>
        )}

        <div className="detail-section">
          <h3>Signatures</h3>
          <div className="signature-detail-grid">
            <div className="signature-detail-block">
              <h4>👤 Customer</h4>
              <div className="signature-item">
                <label>Name:</label>
                <span>{report.customerName || 'N/A'}</span>
              </div>
              <div className="signature-item">
                <label>Signature:</label>
                <span>{report.customerSignature || 'N/A'}</span>
              </div>
            </div>
            <div className="signature-detail-block">
              <h4>🔧 Technician</h4>
              <div className="signature-item">
                <label>Name:</label>
                <span>{report.technicianName || 'N/A'}</span>
              </div>
              <div className="signature-item">
                <label>Signature:</label>
                <span>{report.technicianSignature || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreVisitReportDetail;