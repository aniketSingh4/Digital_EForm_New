import React from 'react';
import './PreVisitReport.css';

const PreVisitReportItem = ({ report, onDelete, onEdit }) => {
  const getStatusBadge = (status) => {
    if (status === true) return <span className="badge success">Yes</span>;
    if (status === false) return <span className="badge danger">No</span>;
    return <span className="badge unknown">Not Set</span>;
  };

  return (
    <div className="report-card">
      <div className="report-header">
        <h3>{report.companyName || 'N/A'}</h3>
        <div className="report-actions">
          <button className="btn-edit" onClick={() => onEdit(report)}>Edit</button>
          <button className="btn-delete" onClick={() => onDelete(report.id)}>Delete</button>
        </div>
      </div>

      <div className="report-body">
        <div className="report-details">
          <p><strong>Date:</strong> {report.visitDate || 'N/A'}</p>
          <p><strong>Site:</strong> {report.siteAddress || 'N/A'}</p>
          <p><strong>Contact:</strong> {report.sitePersonName || 'N/A'} ({report.contactNo || 'N/A'})</p>
          <p><strong>Email:</strong> {report.emailId || 'N/A'}</p>
          <p><strong>Inspected By:</strong> {report.inspectedBy || 'N/A'}</p>
        </div>

        <div className="report-checklist">
          <h4>Checklist Status</h4>
          {report.checklist && report.checklist.length > 0 ? (
            <ul>
              {report.checklist.slice(0, 3).map((item, index) => (
                <li key={index}>
                  <span className="checklist-field">{item.fieldName.substring(0, 30)}...</span>
                  {getStatusBadge(item.status)}
                </li>
              ))}
              {report.checklist.length > 3 && (
                <li className="more-items">+{report.checklist.length - 3} more items</li>
              )}
            </ul>
          ) : (
            <p>No checklist items</p>
          )}
        </div>

        {report.notedIfAny && (
          <div className="report-notes">
            <strong>Notes:</strong> {report.notedIfAny}
          </div>
        )}

        <div className="report-footer">
          <span className="report-id">ID: {report.id}</span>
          <span className="report-date">Created: {report.createdAt || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default PreVisitReportItem;