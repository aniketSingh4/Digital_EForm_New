// src/pages/PreVisitReportModule.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import PreVisitReportForm from '../components/PreVisitReport/PreVisitReportForm';
import '../assets/PreVisitReportModule.css';

const PreVisitReportModule = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [isFormMode, setIsFormMode] = useState(false);
  const [editingReport, setEditingReport] = useState(null);

  useEffect(() => {
    console.log("PreVisitReportModule - Location:", location.pathname);
    
    if (location.pathname.includes('/new')) {
      console.log("New report mode");
      setIsFormMode(true);
      setEditingReport(null);
    } else if (id && location.pathname.includes('/edit')) {
      console.log("Edit report mode - ID:", id);
      setIsFormMode(true);
    } else if (id) {
      console.log("View report mode - ID:", id);
      setIsFormMode(false);
    } else {
      console.log("List view mode");
      setIsFormMode(false);
    }
  }, [location, id]);

  const handleFormSuccess = () => {
    setIsFormMode(false);
    setEditingReport(null);
    navigate('/previsit');
  };

  const handleCancel = () => {
    setIsFormMode(false);
    setEditingReport(null);
    navigate('/previsit');
  };

  // View mode - showing report details
  if (id && !location.pathname.includes('/edit')) {
    return (
      <div className="pre-visit-module">
        <div className="module-header">
          <button className="btn-back" onClick={() => navigate('/previsit')}>
            ← Back to Reports
          </button>
          <h2>Report Details</h2>
        </div>
        <div className="report-detail-view">
          <p>Viewing report ID: {id}</p>
          {/* Add your report detail view here */}
        </div>
      </div>
    );
  }

  // Form mode - render the form with proper styling
  if (isFormMode) {
    return (
      <div className="pre-visit-form-page">
        <PreVisitReportForm
          onSuccess={handleFormSuccess}
          onCancel={handleCancel}
          initialData={editingReport}
          isEdit={!!editingReport}
        />
      </div>
    );
  }

  // Fallback - should not reach here normally
  return (
    <div className="pre-visit-module">
      <div className="module-header">
        <div className="header-left">
          <h2>Pre-Visit Checklist</h2>
          <span className="subtitle">Create and manage pre-visit inspection reports</span>
        </div>
        <button 
          className="btn-primary"
          onClick={() => navigate('/previsit/new')}
        >
          + New Report
        </button>
      </div>
      <p>Loading...</p>
    </div>
  );
};

export default PreVisitReportModule;