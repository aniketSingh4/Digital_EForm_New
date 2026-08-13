// src/components/pmReport/PMReportView.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    FaArrowLeft,
    FaEdit,
    FaFilePdf,
    FaPrint,
    FaCheckCircle,
    FaClock,
    FaBuilding,
    FaUser,
    FaEnvelope,
    FaPhone,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaMicrochip,
    FaTools,
    FaClipboardCheck,
    FaUserCheck,
    FaHistory,
    FaSpinner,
    FaFileAlt
} from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import { getAuthHeaders, canModifyReports } from '../../utils/roles';
import './PMReportView.css';

const API_BASE_URL = 'https://pm-reports.onrender.com/api/pm_reports';

const PMReportView = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isAdminUser = canModifyReports();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        if (id) {
            fetchReportDetails();
        }
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/${id}`, {
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report details');
            }

            const data = await response.json();
            //console.log('📥 Raw report data:', data);
            setReport(data);
        } catch (error) {
            console.error('Error fetching report:', error);
            notificationService.error('Failed to load PM Report');
            navigate('/pm-reports/view-all');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return dateString;
            return d.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    // ✅ Helper function to format status text
    const formatStatusText = (status) => {
        if (!status) return 'N/A';
        return status.replace(/_/g, ' ').toLowerCase()
            .replace(/\b\w/g, l => l.toUpperCase());
    };

    // ✅ Helper function to get status badge
    const getStatusBadge = (status) => {
        if (!status) {
            return { label: 'N/A', className: 'status-pending', icon: <FaClock /> };
        }

        const statusMap = {
            'SATISFACTORY': { label: 'Satisfactory', className: 'status-success', icon: <FaCheckCircle /> },
            'FOLLOW_UP_VISIT_REQUIRED': { label: 'Follow-up Required', className: 'status-warning', icon: <FaClock /> },
            'REQUIRES_ATTENTION': { label: 'Requires Attention', className: 'status-danger', icon: <FaClock /> },
            'COMPLETED': { label: 'Completed', className: 'status-success', icon: <FaCheckCircle /> },
            'PENDING': { label: 'Pending', className: 'status-pending', icon: <FaClock /> },
            'SYSTEM_OPERATIONAL': { label: 'System Operational', className: 'status-success', icon: <FaCheckCircle /> },
            'NEEDS_MAINTENANCE': { label: 'Needs Maintenance', className: 'status-warning', icon: <FaClock /> },
            'CRITICAL': { label: 'Critical', className: 'status-danger', icon: <FaClock /> },
            'UNDER_OBSERVATION': { label: 'Under Observation', className: 'status-info', icon: <FaClock /> }
        };
        return statusMap[status] || { label: formatStatusText(status), className: 'status-pending', icon: <FaClock /> };
    };

    const handlePDF = async () => {
        try {
            setActionLoading('pdf');
            // Add PDF generation logic here
            notificationService.pdfGenerated(report?.serviceReportNo || 'PM Report');
        } catch (error) {
            notificationService.error('Failed to generate PDF');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = () => {
        navigate(`/pm-reports/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/pm-reports/view-all');
    };

    if (loading) {
        return (
            <div className="pm-report-view-loading">
                <div className="loading-spinner"></div>
                <p>Loading report details...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="pm-report-view-error">
                <div className="error-content">
                    <div className="error-icon">📄</div>
                    <h3>Report Not Found</h3>
                    <p>The report you are looking for does not exist or has been removed.</p>
                    <button className="btn-primary" onClick={handleBack}>
                        <FaArrowLeft /> Back to Reports
                    </button>
                </div>
            </div>
        );
    }

    // ✅ Get summary data from report
    const summary = report.summary || {};
    const signOff = report.signOff || {};

    // ✅ Get status badges
    const pmStatus = getStatusBadge(summary.preventiveMaintenanceStatus);
    const siteCondition = getStatusBadge(summary.siteConditionAfterPm);

    return (
        <div className="pm-report-view-container">
            {/* Header */}
            <div className="view-header">
                <div className="header-left">
                    <button className="btn-back" onClick={handleBack}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <div className="header-title">
                        <h1>Preventive Maintenance Report</h1>
                        <div className="header-badges">
                            <span className="report-badge">{report.serviceReportNo}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Report Info Bar */}
            <div className="report-info-bar">
                <div className="info-item">
                    <FaCalendarAlt className="info-icon" />
                    <span>Visit Date: <strong>{formatDate(report.pmVisitDate)}</strong></span>
                </div>
                <div className="info-item">
                    <FaUser className="info-icon" />
                    <span>Engineer: <strong>{report.engineerName || 'N/A'}</strong></span>
                </div>
            </div>

            {/* Details Grid */}
            <div className="details-grid">
                {/* Basic Information */}
                <div className="detail-card">
                    <div className="card-header">
                        <FaFileAlt className="card-icon" />
                        <h3>Basic Information</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-row">
                            <span className="label">Report No</span>
                            <span className="value">{report.serviceReportNo || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Visit No</span>
                            <span className="value">{report.serviceVisitNo || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Client Name</span>
                            <span className="value">{report.clientName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Site Name</span>
                            <span className="value">{report.siteName || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Sensor ID</span>
                            <span className="value">{report.sensorId || 'N/A'}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Visit Date</span>
                            <span className="value">{formatDate(report.pmVisitDate)}</span>
                        </div>
                        <div className="detail-row">
                            <span className="label">Engineer</span>
                            <span className="value">{report.engineerName || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Observation */}
                <div className="detail-card">
                    <div className="card-header">
                        <FaClipboardCheck className="card-icon" />
                        <h3>Observation</h3>
                    </div>
                    <div className="card-body">
                        <div className="observation-content">
                            {report.observation || 'No observation recorded'}
                        </div>
                    </div>
                </div>

                {/* Recommendation */}
                <div className="detail-card">
                    <div className="card-header">
                        <FaTools className="card-icon" />
                        <h3>Recommendation</h3>
                    </div>
                    <div className="card-body">
                        <div className="recommendation-content">
                            {report.recommendation || 'No recommendation provided'}
                        </div>
                    </div>
                </div>

                {/* ✅ FIXED: Preventive Maintenance */}
                <div className="detail-card">
                    <div className="card-header">
                        <FaClipboardCheck className="card-icon" />
                        <h3>Preventive Maintenance</h3>
                    </div>
                    <div className="card-body">
                        <div className="detail-row">
                            <span className="label">PM Status</span>
                            <span className="value">
                                <span className={`status-badge ${pmStatus.className}`}>
                                    {pmStatus.icon} {pmStatus.label}
                                </span>
                            </span>
                        </div>

                        <div className="detail-row">
                            <span className="label">Site Condition</span>
                            <span className="value">
                                <span className={`status-badge ${siteCondition.className}`}>
                                    {siteCondition.icon} {siteCondition.label}
                                </span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Checklists */}
                {report.checklists && report.checklists.length > 0 && (
                    <div className="detail-card full-width">
                        <div className="card-header">
                            <FaClipboardCheck className="card-icon" />
                            <h3>Preventive Maintenance Elements</h3>
                        </div>
                        <div className="card-body">
                            <div className="table-responsive">
                                <table className="checklist-table">
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Item Name</th>
                                            <th>Status</th>
                                            <th>Remark</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {report.checklists.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.category || '-'}</td>
                                                <td>{item.itemName || '-'}</td>
                                                <td>
                                                    <span className={`checklist-status ${item.status === 'YES' ? 'pass' : 'fail'}`}>
                                                        {item.status || 'NO'}
                                                    </span>
                                                </td>
                                                <td>{item.remark || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sign-Off */}
                <div className="detail-card full-width">
                    <div className="card-header">
                        <FaUserCheck className="card-icon" />
                        <h3>Sign-Off</h3>
                    </div>
                    <div className="card-body">
                        <div className="signoff-grid">
                            <div className="signoff-box">
                                <h4>👤 Client Representative</h4>
                                <div className="detail-row">
                                    <span className="label">Name</span>
                                    <span className="value">{signOff.clientRepresentativeName || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Designation</span>
                                    <span className="value">{signOff.designation || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Date</span>
                                    <span className="value">{formatDate(signOff.clientDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Signature</span>
                                    <span className="value signature-text">{signOff.clientSignature || 'Not signed'}</span>
                                </div>
                            </div>
                            <div className="signoff-box">
                                <h4>🔧 Service Engineer</h4>
                                <div className="detail-row">
                                    <span className="label">Name</span>
                                    <span className="value">{signOff.serviceEngineerName || 'N/A'}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Date</span>
                                    <span className="value">{formatDate(signOff.serviceEngineerDate)}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Signature</span>
                                    <span className="value signature-text">{signOff.serviceEngineerSignature || 'Not signed'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="view-footer">
                <h3 style={{ textAlign: 'center' }}>FLOROSENSE ESPL</h3>
            </div>
        </div>
    );
};

export default PMReportView;