import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { calibrationReportService } from "../../services/CalibrationReportService";
import "./ReportView.css";
import notificationService from "../../services/notificationService";

const ReportView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (id) {
            fetchReport();
        }
    }, [id]);

    const fetchReport = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await calibrationReportService.getReportById(id);
            setReport(data);
        } catch (err) {
            setError('Failed to load report details');
            notificationService.error('Failed to fetch report');
            //console.error('Error fetching report:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateStr;
        }
    };

    const getStatusBadge = () => {
        const summary = report?.calibrationSummary;
        if (!summary) {
            return { label: 'Pending', className: 'status-pending' };
        }
        if (summary.calibrationSuccessful) {
            return { label: 'Successful', className: 'status-success' };
        } else if (summary.sensorRequiresReplacement) {
            return { label: 'Needs Replacement', className: 'status-danger' };
        } else if (summary.calibrationAdjustmentPerformed) {
            return { label: 'Adjusted', className: 'status-warning' };
        } else {
            return { label: 'Pending', className: 'status-pending' };
        }
    };

    if (loading) {
        return (
            <div className="report-view-loading">
                <div className="loading-spinner"></div>
                <p>Loading report details...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="report-view-error">
                <div className="error-content">
                    <h3>⚠️ {error}</h3>
                    <button className="btn-retry" onClick={fetchReport}>
                        Retry
                    </button>
                    <button className="btn-back" onClick={() => navigate('/calibration-reports')}>
                        Back to Reports
                    </button>
                </div>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="report-view-not-found">
                <h3>Report not found</h3>
                <button className="btn-back" onClick={() => navigate('/calibration-reports')}>
                    Back to Reports
                </button>
            </div>
        );
    }

    const status = getStatusBadge();
    const masterRef = report.masterRefInstrument || {};
    const before = report.readingBeforeCalibration || {};
    const after = report.readingAfterCalibration || {};
    const summary = report.calibrationSummary || {};
    const engineer = report.engineerDetails || {};

    //Get the certificate number (or report number as fallback)
    const certificateNo = String(masterRef.calibrationCertificateNo || report.reportNo || 'N/A')
        .replace('FLO_CAL_-', 'FLO_CAL_');

    return (
        <div className="report-view-container">
            {/* Header */}
            <div className="report-view-header">
                <div className="header-left">
                    <button className="btn-back" onClick={() => navigate('/calibration-reports')}>
                        <FaArrowLeft /> Back
                    </button>
                    <h1>Calibration Report</h1>
                </div>
            </div>

            {/* Report Details Section */}
            <div className="report-section">
                <div className="section-title">
                    <h2>Report Details</h2>
                    <span className={`status-badge ${status.className}`}>
                        {status.label}
                    </span>
                </div>
                <div className="details-grid">
                    <div className="detail-item">
                        <label>Report No / Certificate No</label>
                        <span className="highlight-value">{certificateNo}</span>
                    </div>
                    <div className="detail-item">
                        <label>Report Date</label>
                        <span>{formatDate(report.reportDate)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Client Name</label>
                        <span>{report.clientName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Site Name</label>
                        <span>{report.siteName || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Site Address</label>
                        <span>{report.siteAddress || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Sensor ID</label>
                        <span>{report.sensorId || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Model No</label>
                        <span>{report.modelNo || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                        <label>Calibration Date</label>
                        <span>{formatDate(report.calibrationDate)}</span>
                    </div>
                    <div className="detail-item">
                        <label>Calibration Due Date</label>
                        <span>{formatDate(report.calibrationDueDate)}</span>
                    </div>
                </div>
            </div>

            {/* Certificate Details Section */}
            <div className="report-section">
                <div className="section-title">
                    <h2>Certificate Details</h2>
                </div>
                <div className="details-grid">
                    <div className="detail-item highlight-item">
                        <label>Certificate No</label>
                        <span className="highlight-value">{certificateNo}</span>
                    </div>
                    <div className="detail-item">
                        <label>Certificate Validity</label>
                        <span>{masterRef.certificateValidity || 'N/A'}</span>
                    </div>
                </div>
                <div className="certificate-note">
                    <small>Note: Report No and Certificate No are the same</small>
                </div>
            </div>

            {/* Readings Section */}
            <div className="report-section">
                <div className="section-title">
                    <h2>Reading Date & Calibration</h2>
                </div>
                <div className="readings-table-container">
                    <table className="readings-table">
                        <thead>
                            <tr>
                                <th>Parameter</th>
                                <th>Before Calibration</th>
                                <th>After Calibration</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>PM2.5 Value</td>
                                <td>{before.pm25Value || '-'}</td>
                                <td>{after.pm25Value || '-'}</td>
                                <td>
                                    {before.pm25Value && after.pm25Value && 
                                        (parseFloat(after.pm25Value) <= parseFloat(before.pm25Value) 
                                            ? 'Improved' 
                                            : 'Changed'
                                        )
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>PM10 Value</td>
                                <td>{before.pm10Value || '-'}</td>
                                <td>{after.pm10Value || '-'}</td>
                                <td>
                                    {before.pm10Value && after.pm10Value && 
                                        (parseFloat(after.pm10Value) <= parseFloat(before.pm10Value) 
                                            ? 'Improved' 
                                            : 'Changed'
                                        )
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>Temp (°C)</td>
                                <td>{before.temp || '-'}</td>
                                <td>{after.temp || '-'}</td>
                                <td>
                                    {before.temp && after.temp && 
                                        (parseFloat(after.temp) <= parseFloat(before.temp) 
                                            ? 'Improved' 
                                            : 'Changed'
                                        )
                                    }
                                </td>
                            </tr>
                            <tr>
                                <td>Humidity (%)</td>
                                <td>{before.humidity || '-'}</td>
                                <td>{after.humidity || '-'}</td>
                                <td>
                                    {before.humidity && after.humidity && 
                                        (parseFloat(after.humidity) <= parseFloat(before.humidity) 
                                            ? 'Improved' 
                                            : 'Changed'
                                        )
                                    }
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Calibration Summary Section */}
            <div className="report-section">
                <div className="section-title">
                    <h2>Calibration Summary</h2>
                </div>
                <div className="summary-grid">
                    <div className={`summary-item ${summary.calibrationSuccessful ? 'success' : 'failed'}`}>
                        <label>Calibration Successful</label>
                        <span>{summary.calibrationSuccessful ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={`summary-item ${summary.calibrationAdjustmentPerformed ? 'adjusted' : 'not-adjusted'}`}>
                        <label>Calibration Adjustment Performed</label>
                        <span>{summary.calibrationAdjustmentPerformed ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={`summary-item ${summary.sensorWithinAcceptableLimits ? 'within-limits' : 'out-of-limits'}`}>
                        <label>Sensor Within Acceptable Limits</label>
                        <span>{summary.sensorWithinAcceptableLimits ? 'Yes' : 'No'}</span>
                    </div>
                    <div className={`summary-item ${summary.sensorRequiresReplacement ? 'needs-replacement' : 'ok'}`}>
                        <label>Sensor Requires Replacement</label>
                        <span>{summary.sensorRequiresReplacement ? 'Yes' : 'No'}</span>
                    </div>
                </div>
            </div>

            {/* Remarks Section */}
            {report.remarks && (
                <div className="report-section">
                    <div className="section-title">
                        <h2>Remarks</h2>
                    </div>
                    <div className="remarks-content">
                        <p>{report.remarks}</p>
                    </div>
                </div>
            )}

            {/* Declaration Section */}
            <div className="report-section">
                <div className="section-title">
                    <h2>Declaration</h2>
                </div>
                <div className="declaration-content">
                    <p>
                        The calibration activity was carried out using a calibrated reference instrument 
                        traceable to applicable standards. The readings recorded above represent the observed 
                        values before and after calibration. Any observations and recommendations have been 
                        documented for necessary action.
                    </p>
                </div>
            </div>

            {/* Sign-Off Section */}
            <div className="report-section signoff-section">
                <div className="section-title">
                    <h2>Sign-Off</h2>
                </div>
                <div className="signoff-grid">
                    <div className="signoff-box">
                        <h3>Calibration Engineer</h3>
                        <div className="signoff-field">
                            <label>Name:</label>
                            <span>{engineer.engineerName || 'N/A'}</span>
                        </div>
                        <div className="signoff-field">
                            <label>Date:</label>
                            <span>{formatDate(engineer.date)}</span>
                        </div>
                        <div className="signoff-field">
                            <label>Signature:</label>
                            <span className="signature-text">{engineer.signature || 'Not signed'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="report-view-footer">
                <button className="btn-back" onClick={() => navigate('/calibration-reports')}>
                    <FaArrowLeft /> Back to Reports
                </button>
            </div>
        </div>
    );
};

export default ReportView;