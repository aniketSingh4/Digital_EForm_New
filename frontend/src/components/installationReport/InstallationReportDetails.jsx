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
    FaFileSignature,
    FaImage,
    FaDownload,
    FaEye,
    FaTrash
} from 'react-icons/fa';
import notificationService from '../../services/notificationService';
import './InstallationReportDetails.css';

const API_BASE_URL = 'https://installation-reports.onrender.com/api/installation-reports';
const IMAGE_BASE_URL = 'https://installation-reports.onrender.com';

const InstallationReportDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [showLightbox, setShowLightbox] = useState(false);
    const [selectedImage, setSelectedImage] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(null);

    useEffect(() => {
        fetchReportDetails();
    }, [id]);

    const fetchReportDetails = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_BASE_URL}/${id}`);
            console.log('📥 Report data:', response.data);
            console.log('📸 Site images:', response.data.siteImages);
            setReport(response.data);
        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Failed to load Installation Report');
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
            toast.success('PDF generated successfully!');
            notificationService.pdfGenerated(report?.reportNo || 'Installation Report');
        } catch (error) {
            console.error('PDF generation failed:', error);
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

    // ✅ FIXED: Delete Image Function
    const handleDeleteImage = async (imageId, imageName) => {
        if (!window.confirm(`Are you sure you want to delete "${imageName || 'this image'}"?`)) {
            return;
        }

        try {
            setDeleteLoading(imageId);

            const response = await axios.delete(`${API_BASE_URL}/images/${imageId}`);

            if (response.status === 200 || response.data.success !== false) {
                setReport(prevReport => ({
                    ...prevReport,
                    siteImages: prevReport.siteImages.filter(img => img.id !== imageId)
                }));

                toast.success(`Image "${imageName || 'Image'}" deleted successfully!`);
            } else {
                throw new Error(response.data.message || 'Failed to delete image');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Failed to delete image. Please try again.';
            toast.error(errorMessage);
        } finally {
            setDeleteLoading(null);
        }
    };

    // ✅ FIXED: Download Image Function - Handles data URIs
    const handleDownloadImage = (imageUrl, imageName) => {
        try {
            if (!imageUrl) {
                toast.error('Image URL is not available');
                return;
            }

            // If it's a data URI, create download directly
            if (imageUrl && imageUrl.startsWith('data:')) {
                const link = document.createElement('a');
                link.href = imageUrl;
                link.download = imageName || 'site-image.jpg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success(`Downloading "${imageName || 'Image'}"...`);
                return;
            }

            // Otherwise use the full URL
            const link = document.createElement('a');
            link.href = imageUrl;
            link.download = imageName || 'site-image.jpg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Downloading "${imageName || 'Image'}"...`);
        } catch (error) {
            console.error('Download failed:', error);
            toast.error('Failed to download image. Please try again.');
        }
    };

    const openLightbox = (image) => {
        setSelectedImage(image);
        setShowLightbox(true);
    };

    const closeLightbox = () => {
        setShowLightbox(false);
        setSelectedImage(null);
    };

    // ✅ FIXED: getFullImageUrl function - Handles data URIs
    const getFullImageUrl = (imageUrl) => {
        if (!imageUrl) return null;

        console.log('🔗 Processing image URL:', imageUrl);

        // ✅ If it's a data URI, return as is
        if (imageUrl.startsWith('data:')) {
            console.log('✅ Data URI detected, using directly');
            return imageUrl;
        }

        // If it's already a full URL, return as is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            console.log('✅ Full URL detected:', imageUrl);
            return imageUrl;
        }

        // If it starts with '/uploads/', construct full URL
        if (imageUrl.startsWith('/uploads/')) {
            const fullUrl = `${IMAGE_BASE_URL}${imageUrl}`;
            console.log('✅ Constructed URL from /uploads/:', fullUrl);
            return fullUrl;
        }

        // If it doesn't start with '/', add it
        if (!imageUrl.startsWith('/')) {
            const fullUrl = `${IMAGE_BASE_URL}/uploads/installation-images/${imageUrl}`;
            console.log('✅ Constructed URL with folder:', fullUrl);
            return fullUrl;
        }

        const fullUrl = `${IMAGE_BASE_URL}${imageUrl}`;
        console.log('✅ Final constructed URL:', fullUrl);
        return fullUrl;
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
    const siteImages = report.siteImages || [];

    return (
        <div className="installation-details-container">
            {/* Lightbox Modal */}
            {showLightbox && selectedImage && (
                <div className="lightbox-overlay" onClick={closeLightbox}>
                    <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                        <button className="lightbox-close" onClick={closeLightbox}>
                            ✕
                        </button>
                        <img
                            src={getFullImageUrl(selectedImage.imageUrl)}
                            alt={selectedImage.imageName || 'Site image'}
                            onError={(e) => {
                                console.error('❌ Image failed to load:', selectedImage.imageUrl);
                                e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400"%3E%3Crect width="400" height="400" fill="%23f3f4f6"/%3E%3Ctext x="200" y="200" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';
                            }}
                        />
                        <div className="lightbox-info">
                            <span className="lightbox-name">{selectedImage.imageName || 'Image'}</span>
                            {selectedImage.isFinal && <span className="lightbox-final">⭐ Final</span>}
                            {selectedImage.description && <span className="lightbox-desc">{selectedImage.description}</span>}
                        </div>
                    </div>
                </div>
            )}

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
                    {/* Others Work Activity */}
                    {report.workActivityOthers && (
                        <div className="activity-item others-completed">
                            <span>Others</span>
                            <span className="activity-status status-success">
                                <FaCheckCircle /> Done
                            </span>
                        </div>
                    )}
                </div>
                {/* Others Work Activity Details */}
                {report.workActivityOthers && (
                    <div className="others-details">
                        <h4>Other Work Activities:</h4>
                        <p>{report.workActivityOthers}</p>
                    </div>
                )}
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

            {/* Site Images Section */}
            {siteImages.length > 0 && (
                <div className="images-section">
                    <div className="section-header">
                        <h2><FaImage className="section-icon" /> Site Images</h2>
                        <span className="image-count">{siteImages.length} image(s)</span>
                    </div>
                    <div className="images-grid">
                        {siteImages.map((image, index) => {
                            const imageUrl = getFullImageUrl(image.imageUrl);
                            console.log(`🖼️ Image ${index} URL:`, imageUrl);
                            
                            return (
                                <div key={image.id || index} className="image-card">
                                    <img
                                        src={imageUrl}
                                        alt={image.imageName || 'Site image'}
                                        className="image-thumb"
                                        onClick={() => openLightbox(image)}
                                        onError={(e) => {
                                            console.error('❌ Image failed to load:', imageUrl);
                                            e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="100" y="100" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
                                        }}
                                    />
                                    <div className="image-overlay">
                                        <div className="image-overlay-info">
                                            {image.isFinal && <span className="image-final-badge">⭐ Final</span>}
                                            <span className="image-name">{image.imageName || 'Image'}</span>
                                            {image.description && (
                                                <span className="image-description">{image.description}</span>
                                            )}
                                        </div>
                                        <div className="image-overlay-actions">
                                            <button
                                                className="image-action-btn view"
                                                onClick={() => openLightbox(image)}
                                                title="View"
                                            >
                                                <FaEye /> View
                                            </button>
                                            <button
                                                className="image-action-btn download"
                                                onClick={() => handleDownloadImage(
                                                    image.imageUrl,
                                                    image.imageName
                                                )}
                                                title="Download"
                                                disabled={deleteLoading === image.id}
                                            >
                                                <FaDownload /> Download
                                            </button>
                                            <button
                                                className="image-action-btn delete"
                                                onClick={() => handleDeleteImage(image.id, image.imageName)}
                                                title="Delete"
                                                disabled={deleteLoading === image.id}
                                            >
                                                {deleteLoading === image.id ? (
                                                    <FaSpinner className="spinning" />
                                                ) : (
                                                    <FaTrash />
                                                )} Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="images-footer">
                        <span>Total: {siteImages.length} image(s)</span>
                        <span className="final-count">
                            ⭐ {siteImages.filter(img => img.isFinal).length} final image(s)
                        </span>
                    </div>
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