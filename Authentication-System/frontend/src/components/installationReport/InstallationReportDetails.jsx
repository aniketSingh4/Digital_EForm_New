import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import {
    FaArrowLeft,
    FaEdit,
    FaFilePdf,
    FaPrint,
    FaCheckCircle,
    FaTimesCircle,
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
    FaInfoCircle,
    FaFileSignature
} from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import './InstallationReportDetails.css';

const API_BASE_URL = 'http://localhost:8086/api/reports';

const InstallationReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            setReport(response.data);
        } catch (error) {
            toast.error('Error fetching report details');
            notificationService.error('Failed to load Installation Report');
            navigate('/installation-reports');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handlePDF = async () => {
        try {
            setActionLoading('pdf');
            await new Promise(resolve => setTimeout(resolve, 1500));
            notificationService.pdfGenerated(report?.reportNo || 'Installation Report');
            toast.success('PDF generated successfully!');
        } catch (error) {
            notificationService.error('Failed to generate PDF');
            toast.error('Failed to generate PDF');
        } finally {
            setActionLoading(null);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleEdit = () => {
        navigate(`/installation-reports/edit/${id}`);
    };

    const handleBack = () => {
        navigate('/installation-reports');
    };

    if (loading) {
        return (
            <div className="installation-details-loading">
                <div className="loading-spinner"></div>
                <p>Loading report details...</p>
            </div>
        );
    }

    if (!report) {
        return (
            <div className="installation-details-error">
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

    // Split basic info into left and right columns
    const leftInfo = [
        { label: 'Report No', value: report.reportNo },
        { label: 'Company Name', value: report.companyName },
        { label: 'Customer Name', value: report.customerName },
        { label: 'Installed By', value: report.installedBy }
    ];

    const rightInfo = [
        { label: 'Installation Date', value: formatDate(report.date) },
        //{ label: 'Site Name', value: report.siteName },
        { label: 'Site Address', value: report.siteAddress },
        { label: 'Status', value: report.workConfirmation }
    ];

    // Group work activities
    const workActivities = [
        { label: 'Machine Unboxing', value: report.machineUnboxing },
        { label: 'Sensor & Controller Installed', value: report.sensorControllerInstalled },
        { label: 'LED Installed', value: report.ledInstalled },
        { label: 'Wiring & Configuration Done', value: report.wiringInternalConnectionDone },
        { label: 'Basic Functionality Check', value: report.basicFunctionalityCheck },
        { label: 'Stable Power Supply', value: report.stablePowerSupply },
        { label: 'Stable Internet Connection', value: report.stableInternetConnection },
        { label: 'Safety & Maintenance Explained', value: report.safetyMaintenanceExplained }
    ];

    const equipmentItems = report.equipmentDetails || [];

    return (
        <div className="installation-details-container">
            {/* Header */}
            <div className="view-header">
                <div className="header-left">
                    <button className="btn-back" onClick={handleBack}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <div className="header-title">
                        <h1>Installation Report</h1>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-edit" onClick={handleEdit}>
                        <FaEdit /> Edit
                    </button>
                    <button className="btn-pdf" onClick={handlePDF} disabled={actionLoading === 'pdf'}>
                        {actionLoading === 'pdf' ? <FaSpinner className="spinning" /> : <FaFilePdf />} PDF
                    </button>
                    <button className="btn-print" onClick={handlePrint}>
                        <FaPrint /> Print
                    </button>
                </div>
            </div>

            {/* Report Info Bar */}
            <div className="report-info-bar">
                <div className="info-item">
                    <FaCalendarAlt className="info-icon" />
                    <span>Report Date: <strong>{formatDate(report.date)}</strong></span>
                </div>
                <div className="info-item">
                    <FaClock className="info-icon" />
                    <span>Last Updated: <strong>{formatDateTime(report.updatedAt)}</strong></span>
                </div>
            </div>

            {/* Basic Information - Two Column Layout */}
            <div className="basic-info-section">
                <div className="section-header">
                    <h2><FaInfoCircle className="section-icon" /> Basic Information</h2>
                </div>
                <div className="basic-info-grid">
                    <div className="info-column">
                        {leftInfo.map((item, index) => (
                            <div key={index} className="info-row">
                                <span className="info-label">{item.label}</span>
                                <span className="info-value">{item.value || 'N/A'}</span>
                            </div>
                        ))}
                    </div>
                    <div className="info-column">
                        {rightInfo.map((item, index) => (
                            <div key={index} className="info-row">
                                <span className="info-label">{item.label}</span>
                                <span className="info-value">
                                    {item.label === 'Status' ? (
                                        <span className={`status-badge ${item.value ? 'status-success' : 'status-pending'}`}>
                                            {item.value ? <FaCheckCircle /> : <FaClock />}
                                            {item.value ? 'Confirmed' : 'Pending'}
                                        </span>
                                    ) : (
                                        item.value || 'N/A'
                                    )}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Equipment Details */}
            {equipmentItems.length > 0 && (
                <div className="equipment-section">
                    <div className="section-header">
                        <h2><FaMicrochip className="section-icon" /> Equipment Details</h2>
                    </div>
                    <div className="table-responsive">
                        <table className="equipment-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>#</th>
                                    <th>Model No</th>
                                    <th>Serial No</th>
                                    <th style={{ width: '80px' }}>Quantity</th>
                                </tr>
                            </thead>
                            <tbody>
                                {equipmentItems.map((equipment, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{equipment.modelNo || 'N/A'}</td>
                                        <td>{equipment.serialNo || 'N/A'}</td>
                                        <td>{equipment.quantity || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Work Activity */}
            <div className="activity-section">
                <div className="section-header">
                    <h2><FaClipboardCheck className="section-icon" /> Work Activity</h2>
                </div>
                <div className="activity-grid">
                    {workActivities.map((activity, index) => (
                        <div key={index} className={`activity-item ${activity.value ? 'completed' : 'pending'}`}>
                            <span>{activity.label}</span>
                            <span className={`activity-status ${activity.value ? 'status-success' : 'status-pending'}`}>
                                {activity.value ? <FaCheckCircle /> : <FaClock />}
                                {activity.value ? 'Done' : 'Pending'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Remark */}
            {report.remark && (
                <div className="remark-section">
                    <div className="section-header">
                        <h2><FaClipboardCheck className="section-icon" /> Remark</h2>
                    </div>
                    <div className="remark-content">{report.remark}</div>
                </div>
            )}

            {/* Work Confirmation */}
            <div className="confirmation-section">
                <div className="section-header">
                    <h2><FaUserCheck className="section-icon" /> Work Confirmation</h2>
                </div>
                <div className="confirmation-box">
                    <p>I hereby confirm that the above-mentioned equipment have been installed successfully and demonstration has been provided.</p>
                    <div className="confirmation-status">
                        <span className={`status-badge ${report.workConfirmation ? 'status-success' : 'status-pending'}`}>
                            {report.workConfirmation ? <FaCheckCircle /> : <FaTimesCircle />}
                            {report.workConfirmation ? 'Confirmed' : 'Not Confirmed'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Sign-Off */}
            <div className="signoff-section">
                <div className="section-header">
                    <h2><FaFileSignature className="section-icon" /> Sign-Off</h2>
                </div>
                <div className="signoff-grid">
                    <div className="signoff-box customer">
                        <h4>👤 Customer</h4>
                        <div className="signoff-row">
                            <label>Name</label>
                            <span>{report.customerConfirmationName || 'N/A'}</span>
                        </div>
                        <div className="signoff-row">
                            <label>Signature</label>
                            <span className="signature-text">{report.customerSignature || 'Not signed'}</span>
                        </div>
                    </div>
                    <div className="signoff-box engineer">
                        <h4>🔧 Technician</h4>
                        <div className="signoff-row">
                            <label>Name</label>
                            <span>{report.technicianConfirmationName || 'N/A'}</span>
                        </div>
                        <div className="signoff-row">
                            <label>Signature</label>
                            <span className="signature-text">{report.technicianSignature || 'Not signed'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="view-footer">
                <div className="footer-left">
                    <span className="footer-brand">FLOROSENSE ESPL</span>
                </div>
            </div>
        </div>
    );
};

export default InstallationReportDetails;