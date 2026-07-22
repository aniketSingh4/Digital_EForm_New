// src/components/pm/Step1BasicInfo.jsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { generateServiceReportNo, preloadCounters } from "../../utils/ReportNumberGenerator";

export default function Step1BasicInfo({ formData, setFormData, onNext, onBackToDashboard }) {
    // Initialize report from formData or empty object
    const [report, setReport] = useState(() => {
        if (formData.report && Object.keys(formData.report).length > 0) {
            return formData.report;
        }
        return {};
    });
    
    const [errors, setErrors] = useState({});
    const [showLimitPopup, setShowLimitPopup] = useState(false);
    const [visitCount, setVisitCount] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isLoadingCount, setIsLoadingCount] = useState(false);
    
    // Cache for sensor visit counts
    const sensorCache = useRef(new Map());

    // Get today's date
    const getTodayDate = useCallback(() => {
        return new Date().toISOString().split('T')[0];
    }, []);

    // Function to get live count from backend API
    const getLiveSensorVisitCount = useCallback(async (sensorId) => {
        if (!sensorId) return 0;
        
        // Check cache first
        if (sensorCache.current.has(sensorId)) {
            return sensorCache.current.get(sensorId);
        }
        
        try {
            setIsLoadingCount(true);
            // Fetch from backend API
            const response = await fetch(`https://pm-reports.onrender.com/api/pm_reports/sensor/${sensorId}/count`);
            if (response.ok) {
                const data = await response.json();
                const count = data.count || 0;
                sensorCache.current.set(sensorId, count);
                console.log(`📊 Sensor ${sensorId} has ${count} visits from backend`);
                return count;
            } else {
                // Fallback to localStorage if API fails
                const reports = JSON.parse(localStorage.getItem('pmReports') || '[]');
                const count = reports.filter(r => r.sensorId === sensorId).length;
                sensorCache.current.set(sensorId, count);
                return count;
            }
        } catch (error) {
            console.error("Error getting sensor visit count:", error);
            // Fallback to localStorage
            try {
                const reports = JSON.parse(localStorage.getItem('pmReports') || '[]');
                const count = reports.filter(r => r.sensorId === sensorId).length;
                sensorCache.current.set(sensorId, count);
                return count;
            } catch (e) {
                return 0;
            }
        } finally {
            setIsLoadingCount(false);
        }
    }, []);

    // Initialize component - runs only once
    useEffect(() => {
        console.log("🚀 Initializing Step1BasicInfo...");
        
        // Preload counters
        preloadCounters();

        // Generate report number and set date
        const today = getTodayDate();
        const updatedReport = { ...report };
        let hasChanges = false;

        // Generate Report No if not exists
        if (!updatedReport.serviceReportNo) {
            const newReportNo = generateServiceReportNo();
            updatedReport.serviceReportNo = newReportNo;
            hasChanges = true;
            console.log("📋 Generated Service Report No:", newReportNo);
        }

        // Set default date if not exists
        if (!updatedReport.pmVisitDate) {
            updatedReport.pmVisitDate = today;
            hasChanges = true;
            console.log("📅 Set default date to today:", today);
        }

        if (hasChanges) {
            setReport(updatedReport);
            setFormData(prev => ({
                ...prev,
                report: updatedReport
            }));
        }

        setIsInitialized(true);
        console.log("✅ Initialization complete");
    }, []); // Empty array - runs once

    // Generate service visit number based on sensor ID
    const generateServiceVisitNo = useCallback(async (sensorId) => {
        if (!sensorId) return '';
        
        // Get live count from backend
        const count = await getLiveSensorVisitCount(sensorId);
        
        if (count >= 6) {
            setShowLimitPopup(true);
            return '';
        }
        
        const nextCount = count + 1;
        const paddedCount = String(nextCount).padStart(2, '0');
        const visitNo = `FESPL_${sensorId}_${paddedCount}`;
        
        setVisitCount(nextCount);
        console.log(`🔢 Generated Visit No: ${visitNo} (Visit ${nextCount} of 6)`);
        return visitNo;
    }, [getLiveSensorVisitCount]);

    // Auto-generate Visit No when sensor ID changes
    useEffect(() => {
        if (!isInitialized) return;
        
        const generateVisitNo = async () => {
            if (report.sensorId && report.sensorId.trim()) {
                // Get live count
                const count = await getLiveSensorVisitCount(report.sensorId);
                if (count >= 6) {
                    setShowLimitPopup(true);
                    const updatedReport = { ...report, serviceVisitNo: '' };
                    setReport(updatedReport);
                    setFormData(prev => ({
                        ...prev,
                        report: updatedReport
                    }));
                    return;
                }
                
                const newVisitNo = await generateServiceVisitNo(report.sensorId);
                if (newVisitNo) {
                    const updatedReport = { ...report, serviceVisitNo: newVisitNo };
                    setReport(updatedReport);
                    setFormData(prev => ({
                        ...prev,
                        report: updatedReport
                    }));
                }
            } else {
                const updatedReport = { ...report, serviceVisitNo: '' };
                setReport(updatedReport);
                setFormData(prev => ({
                    ...prev,
                    report: updatedReport
                }));
            }
        };
        
        generateVisitNo();
    }, [report.sensorId, isInitialized]);

    const handleFieldChange = useCallback(async (field, value) => {
        if (field === 'pmVisitDate' && value) {
            const dateObj = new Date(value);
            if (!isNaN(dateObj.getTime())) {
                const formattedDate = dateObj.toISOString().split('T')[0];
                value = formattedDate;
            }
        }

        if (field === 'sensorId' && value) {
            // Check live count
            const count = await getLiveSensorVisitCount(value);
            if (count >= 6) {
                setShowLimitPopup(true);
                return;
            }
        }

        const updatedReport = { ...report, [field]: value };
        setReport(updatedReport);

        setFormData(prev => ({
            ...prev,
            report: updatedReport
        }));
    }, [report, setFormData, getLiveSensorVisitCount]);

    const handleInputChange = useCallback(async (e) => {
        const { name, value } = e.target;
        await handleFieldChange(name, value);

        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    }, [handleFieldChange, errors]);

    const validateForm = useCallback(async () => {
        const newErrors = {};

        if (!report.clientName?.trim()) {
            newErrors.clientName = "Client Name is required";
        }
        if (!report.siteName?.trim()) {
            newErrors.siteName = "Site Name is required";
        }
        if (!report.sensorId?.trim()) {
            newErrors.sensorId = "Sensor ID is required";
        }
        if (!report.pmVisitDate) {
            newErrors.pmVisitDate = "PM Visit Date is required";
        }
        if (!report.engineerName?.trim()) {
            newErrors.engineerName = "Engineer Name is required";
        }

        if (report.sensorId) {
            // Get live count for validation
            const count = await getLiveSensorVisitCount(report.sensorId);
            if (count >= 6) {
                setShowLimitPopup(true);
                return false;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [report, getLiveSensorVisitCount]);

    const handleNext = useCallback(async () => {
        const isValid = await validateForm();
        if (isValid) {
            if (onNext) {
                onNext();
            }
        }
    }, [validateForm, onNext]);

    const closePopup = useCallback(() => {
        setShowLimitPopup(false);
    }, []);

    const handleBackToDashboard = useCallback(() => {
        console.log("🔙 Navigating back to dashboard...");
        
        if (onBackToDashboard && typeof onBackToDashboard === 'function') {
            onBackToDashboard();
        } else {
            if (window.history && window.history.length > 1) {
                window.history.back();
            } else {
                window.location.href = '/dashboard';
            }
        }
    }, [onBackToDashboard]);

    // Get live count for display
    const currentVisitCount = useMemo(() => {
        if (report.sensorId) {
            // Use cached value or 0
            return sensorCache.current.get(report.sensorId) || 0;
        }
        return 0;
    }, [report.sensorId]);
    
    const isLimitReached = currentVisitCount >= 6;
    const todayDate = getTodayDate();

    // Show loading state
    if (!isInitialized || !report.serviceReportNo) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                minHeight: '400px',
                flexDirection: 'column',
                padding: '20px'
            }}>
                <div style={{
                    width: '50px',
                    height: '50px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #4F46E5',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '20px'
                }}></div>
                <p style={{ color: '#6b7280', fontSize: '16px' }}>Generating Report Number...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </div>
        );
    }

    return (
        <div className="step-container">
            {/* Back to Dashboard Button */}
            <div className="top-bar">
                <button 
                    className="back-to-dashboard-btn"
                    onClick={handleBackToDashboard}
                    title="Back to Dashboard"
                    type="button"
                >
                    <span className="back-icon">←</span>
                    <span className="back-text">Back to Dashboard</span>
                </button>
            </div>

            <h2 className="step-title">Basic Information</h2>
            <p className="step-description">
                Enter the basic details for the Preventive Maintenance Service Report
            </p>

            {/* Info Cards for Auto-generated Fields */}
            <div className="info-cards">
                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-icon">📋</span>
                        <span className="info-label">Service Report No</span>
                    </div>
                    <div className="info-card-value">
                        {report.serviceReportNo}
                    </div>
                    {/* <div className="info-card-hint">Auto-generated: PM-YYYY-XXXX</div> */}
                </div>
                <div className="info-card">
                    <div className="info-card-header">
                        <span className="info-icon">🔢</span>
                        <span className="info-label">Service Visit No</span>
                    </div>
                    <div className="info-card-value">
                        {report.serviceVisitNo || (report.sensorId ? 'Limit reached!' : 'Enter sensor ID to generate')}
                    </div>
                    {/* <div className="info-card-hint">
                        Format: FESPL_&#123;sensor_id&#125;_&#123;count&#125; | Max 6 visits
                    </div> */}
                </div>
            </div>

            {/* Visit Limit Warning */}
            {report.sensorId && (
                <div className={`visit-limit-warning ${isLimitReached ? 'limit-reached' : ''}`}>
                    <span className="warning-icon">📊</span>
                    <div className="warning-content">
                        <span className="warning-title">Visit Status: </span>
                        <span className="warning-count">
                            {isLoadingCount ? 'Loading...' : `${currentVisitCount} / 6 visits used`}
                        </span>
                        {isLimitReached && (
                            <span className="warning-text"> ⚠️ Limit Reached! No more visits allowed</span>
                        )}
                        {!isLimitReached && currentVisitCount > 0 && (
                            <span className="warning-text"> ✅ {6 - currentVisitCount} visits remaining</span>
                        )}
                    </div>
                </div>
            )}

            <div className="form-grid">
                {/* Client Name */}
                <div className="form-group">
                    <label className="form-label">
                        Client Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="clientName"
                        value={report.clientName || ""}
                        onChange={handleInputChange}
                        className={`form-control ${errors.clientName ? 'error' : ''}`}
                        placeholder="Enter client name"
                    />
                    {errors.clientName && (
                        <span className="error-message">{errors.clientName}</span>
                    )}
                </div>

                {/* Site Name */}
                <div className="form-group">
                    <label className="form-label">
                        Site Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="siteName"
                        value={report.siteName || ""}
                        onChange={handleInputChange}
                        className={`form-control ${errors.siteName ? 'error' : ''}`}
                        placeholder="Enter site name"
                    />
                    {errors.siteName && (
                        <span className="error-message">{errors.siteName}</span>
                    )}
                </div>

                {/* Engineer Name */}
                <div className="form-group">
                    <label className="form-label">
                        Engineer Name <span className="required">*</span>
                    </label>
                    <input
                        type="text"
                        name="engineerName"
                        value={report.engineerName || ""}
                        onChange={handleInputChange}
                        className={`form-control ${errors.engineerName ? 'error' : ''}`}
                        placeholder="Enter engineer name (e.g., Rahul Sharma)"
                    />
                    {errors.engineerName && (
                        <span className="error-message">{errors.engineerName}</span>
                    )}
                </div>

                {/* Sensor ID - Auto generates Visit No */}
                <div className="form-group">
                    <label className="form-label">
                        Sensor ID <span className="required">*</span>
                        <span className="field-badge">Auto-generates Visit No</span>
                    </label>
                    <input
                        type="text"
                        name="sensorId"
                        value={report.sensorId || ""}
                        onChange={handleInputChange}
                        className={`form-control ${errors.sensorId ? 'error' : ''}`}
                        placeholder="Enter sensor ID (e.g., 001, 733, ABC123...)"
                    />
                    {errors.sensorId && (
                        <span className="error-message">{errors.sensorId}</span>
                    )}
                </div>

                {/* PM Visit Date - Default today */}
                <div className="form-group full-width">
                    <label className="form-label">
                        PM Visit Date <span className="required">*</span>
                        <span className="field-badge">Default: Today</span>
                    </label>
                    <input
                        type="date"
                        name="pmVisitDate"
                        value={report.pmVisitDate || todayDate}
                        onChange={handleInputChange}
                        className={`form-control ${errors.pmVisitDate ? 'error' : ''}`}
                        min="2020-01-01"
                        max="2030-12-31"
                    />
                    {errors.pmVisitDate && (
                        <span className="error-message">{errors.pmVisitDate}</span>
                    )}
                    {/* <small className="help-text">
                        📅 Current date: {todayDate} (You can change this date)
                    </small> */}
                </div>
            </div>

            {/* Limit Reached Popup */}
            {showLimitPopup && (
                <div className="popup-overlay" onClick={closePopup}>
                    <div className="popup-content" onClick={(e) => e.stopPropagation()}>
                        <div className="popup-icon">⚠️</div>
                        <h3 className="popup-title">Visit Limit Reached!</h3>
                        <p className="popup-message">
                            Free PM visit for this sensor limit reached!<br />
                            <strong>Sensor ID: {report.sensorId}</strong><br />
                            <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
                                Maximum 6 visits allowed per sensor.
                            </span><br /><br />
                            <span style={{ fontSize: '14px', color: '#6b7280' }}>
                                Current visits: {currentVisitCount} / 6
                            </span>
                        </p>
                        <div className="popup-actions">
                            <button 
                                className="popup-button primary"
                                onClick={closePopup}
                            >
                                Understood
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
                .step-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 20px;
                }

                .top-bar {
                    display: flex;
                    justify-content: flex-start;
                    margin-bottom: 20px;
                }

                .back-to-dashboard-btn {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background: #f8fafc;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    color: #1a237e;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    text-decoration: none;
                }

                .back-to-dashboard-btn:hover {
                    background: #eef2ff;
                    border-color: #4F46E5;
                    transform: translateX(-2px);
                    box-shadow: 0 2px 8px rgba(79, 70, 229, 0.15);
                }

                .back-to-dashboard-btn:active {
                    transform: scale(0.98);
                }

                .back-icon {
                    font-size: 18px;
                    line-height: 1;
                }

                .back-text {
                    font-size: 14px;
                }

                .step-title {
                    color: #1a237e;
                    font-size: 24px;
                    margin-bottom: 8px;
                }

                .step-description {
                    color: #666;
                    margin-bottom: 30px;
                }

                .info-cards {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin-bottom: 30px;
                }

                .info-card {
                    background: linear-gradient(135deg, #f8fafc, #eef2ff);
                    border: 1px solid #e5e7eb;
                    border-radius: 12px;
                    padding: 16px 20px;
                    transition: all 0.3s ease;
                }

                .info-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                }

                .info-card-header {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 6px;
                }

                .info-icon {
                    font-size: 18px;
                }

                .info-label {
                    font-size: 12px;
                    font-weight: 600;
                    color: #6b7280;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .info-card-value {
                    font-size: 18px;
                    font-weight: 700;
                    color: #1a237e;
                    margin-bottom: 4px;
                    font-family: 'Courier New', monospace;
                }

                .info-card-hint {
                    font-size: 11px;
                    color: #6b7280;
                }

                .visit-limit-warning {
                    background: #f0fdf4;
                    border: 1px solid #bbf7d0;
                    border-radius: 8px;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .visit-limit-warning.limit-reached {
                    background: #fef2f2;
                    border-color: #fecaca;
                }

                .warning-icon {
                    font-size: 20px;
                }

                .warning-content {
                    flex: 1;
                }

                .warning-title {
                    font-weight: 600;
                    color: #166534;
                }

                .visit-limit-warning.limit-reached .warning-title {
                    color: #991b1b;
                }

                .warning-count {
                    font-weight: 500;
                    color: #166534;
                }

                .visit-limit-warning.limit-reached .warning-count {
                    color: #991b1b;
                }

                .warning-text {
                    font-weight: 600;
                    color: #16a34a;
                }

                .visit-limit-warning.limit-reached .warning-text {
                    color: #dc2626;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }

                .full-width {
                    grid-column: 1 / -1;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 6px;
                }

                .form-label {
                    font-weight: 600;
                    color: #333;
                    font-size: 14px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    flex-wrap: wrap;
                }

                .required {
                    color: #ef4444;
                }

                .field-badge {
                    font-size: 10px;
                    padding: 2px 10px;
                    border-radius: 12px;
                    font-weight: 500;
                    background: #dbeafe;
                    color: #1d4ed8;
                }

                .form-control {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #d1d5db;
                    border-radius: 8px;
                    font-size: 14px;
                    transition: all 0.3s ease;
                    background: #fff;
                }

                .form-control:focus {
                    outline: none;
                    border-color: #4F46E5;
                    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }

                .form-control.error {
                    border-color: #ef4444;
                }

                .help-text {
                    font-size: 12px;
                    color: #6b7280;
                    margin-top: 4px;
                }

                .error-message {
                    font-size: 12px;
                    color: #ef4444;
                }

                .popup-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justifyContent: center;
                    z-index: 9999;
                    animation: fadeIn 0.3s ease;
                }

                .popup-content {
                    background: white;
                    border-radius: 16px;
                    padding: 40px;
                    max-width: 420px;
                    width: 90%;
                    text-align: center;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    animation: slideUp 0.3s ease;
                }

                .popup-icon {
                    font-size: 56px;
                    margin-bottom: 16px;
                }

                .popup-title {
                    color: #991b1b;
                    font-size: 24px;
                    margin-bottom: 12px;
                }

                .popup-message {
                    color: #4b5563;
                    line-height: 1.6;
                    margin-bottom: 24px;
                }

                .popup-actions {
                    display: flex;
                    justify-content: center;
                    gap: 12px;
                }

                .popup-button {
                    padding: 10px 24px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                }

                .popup-button.primary {
                    background: #4F46E5;
                    color: white;
                }

                .popup-button.primary:hover {
                    background: #4338ca;
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }

                @media (max-width: 768px) {
                    .info-cards {
                        grid-template-columns: 1fr;
                    }

                    .form-grid {
                        grid-template-columns: 1fr;
                    }

                    .full-width {
                        grid-column: 1;
                    }

                    .popup-content {
                        padding: 30px 20px;
                    }

                    .back-text {
                        display: none;
                    }

                    .back-to-dashboard-btn {
                        padding: 8px 12px;
                    }
                }
            `}</style>
        </div>
    );
}