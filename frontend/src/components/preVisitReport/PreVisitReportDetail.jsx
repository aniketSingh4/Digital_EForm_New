// src/components/PreVisitReport/PreVisitReportDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaImage,
  FaDownload,
  FaEye,
  FaTimes,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import preVisitReportService from '../../api/preVisitReportService';
import './PreVisitReportDetail.css';

//Base URL for images (your backend URL)
const IMAGE_BASE_URL = 'https://previsit-reports.onrender.com';

const PreVisitReportDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  useEffect(() => {
    if (id) {
      fetchReportDetails(id);
      fetchReportImages(id);
    }
  }, [id]);

  const fetchReportDetails = async (reportId) => {
    try {
      setLoading(true);
      setError(null);

      const data = await preVisitReportService.getReportById(reportId);

      if (data) {
        setReport(data);
        if (data.siteImages && data.siteImages.length > 0) {
          console.log('Images found in report data:', data.siteImages);
          setImages(data.siteImages);
        }
      } else {
        setError('Report not found');
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      if (err === 'Failed to fetch report' || err?.status === 404) {
        setError('Report not found. It may have been deleted.');
      } else {
        setError('Failed to load report details. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchReportImages = async (reportId) => {
    try {
      setLoadingImages(true);
      console.log('Fetching images for report:', reportId);

      const data = await preVisitReportService.getImagesByReport(reportId);
      console.log('Images fetched from API:', data);

      if (data && data.length > 0) {
        setImages(data);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
      setImages([]);
    } finally {
      setLoadingImages(false);
    }
  };

  //Helper function to get full image URL
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return null;

    // If it's already a full URL, return as is
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }

    // If it starts with '/', prepend base URL
    if (imageUrl.startsWith('/')) {
      return `${IMAGE_BASE_URL}${imageUrl}`;
    }

    // Otherwise, prepend base URL with slash
    return `${IMAGE_BASE_URL}/${imageUrl}`;
  };

  //Handle image load error
  const handleImageError = (imageId) => {
    console.error('Image failed to load for ID:', imageId);
    setImageErrors(prev => ({ ...prev, [imageId]: true }));
  };

  //Get placeholder image
  const getPlaceholderImage = () => {
    return 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect width="300" height="300" fill="%23f3f4f6"/%3E%3Ctext x="150" y="150" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="18"%3ENo Image%3C/text%3E%3C/svg%3E';
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await preVisitReportService.deleteReport(id);
      alert('Report deleted successfully!');
      navigate('/previsit/view-all');
    } catch (error) {
      alert('Failed to delete report');
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await preVisitReportService.deleteImage(imageId);
      setImages(images.filter(img => img.id !== imageId));
      alert('Image deleted successfully!');
    } catch (error) {
      alert('Failed to delete image');
    }
  };

  const handleDownloadImage = (imageUrl, imageName) => {
    const fullUrl = getImageUrl(imageUrl);
    if (!fullUrl) return;

    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = imageName || 'site-image.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openLightbox = (index) => {
    setCurrentImageIndex(index);
    setSelectedImage(images[index]);
    setShowLightbox(true);
  };

  const closeLightbox = () => {
    setShowLightbox(false);
    setSelectedImage(null);
  };

  const navigateImage = (direction) => {
    const newIndex = currentImageIndex + direction;
    if (newIndex >= 0 && newIndex < images.length) {
      setCurrentImageIndex(newIndex);
      setSelectedImage(images[newIndex]);
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

  const getStatusBadge = () => {
    if (!report) return null;
    if (!report.checklist || report.checklist.length === 0) {
      return <span className="status-badge pending">Pending</span>;
    }
    const completed = report.checklist.filter(item => item.status === true).length;
    const total = report.checklist.length;
    if (completed === total) {
      return <span className="status-badge complete">Complete</span>;
    } else if (completed > 0) {
      return <span className="status-badge progress">In Progress</span>;
    }
    return <span className="status-badge pending">Pending</span>;
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
        <button onClick={() => navigate('/previsit/view-all')}>Back to Reports</button>
      </div>
    );
  }

  return (
    <div className="pre-visit-detail-container">
      {/* Lightbox Modal */}
      {showLightbox && selectedImage && (
        <div className="lightbox-overlay" onClick={closeLightbox}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <button className="lightbox-close" onClick={closeLightbox}>
              <FaTimes />
            </button>
            {images.length > 1 && (
              <>
                <button
                  className="lightbox-nav lightbox-prev"
                  onClick={() => navigateImage(-1)}
                >
                  <FaChevronLeft />
                </button>
                <button
                  className="lightbox-nav lightbox-next"
                  onClick={() => navigateImage(1)}
                >
                  <FaChevronRight />
                </button>
              </>
            )}
            <img
              src={getImageUrl(selectedImage.imageUrl)}
              alt={selectedImage.imageName || 'Site image'}
              onError={(e) => {
                console.error('Image failed to load:', selectedImage.imageUrl);
                e.target.src = getPlaceholderImage();
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

      <div className="detail-header">
        <button className="back-btn" onClick={() => navigate('/previsit/view-all')}>
          <FaArrowLeft /> Back to Reports
        </button>
        <div className="header-center">
          <h1>Pre-Visit Report Details</h1>
          {getStatusBadge()}
        </div>
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
        {/* Basic Information */}
        <div className="detail-section">
          <h3>Basic Information</h3>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Report ID</label>
              <span>FESPL_PVR_{String(report.id).padStart(3, '0')}</span>
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

        {/* Checklist */}
        <div className="detail-section">
          <h3>Checklist</h3>
          {report.checklist && report.checklist.length > 0 ? (
            <div className="checklist-detail">
              {report.checklist.map((item, index) => (
                <div key={index} className="checklist-detail-item">
                  <span className="checklist-number">{index + 1}.</span>
                  <span className="checklist-field">{item.fieldName}</span>
                  <span className={`checklist-status ${item.status ? 'yes' : 'no'}`}>
                    {item.status ? 'YES' : 'NO'}
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

        {/* Additional Notes */}
        {report.notedIfAny && (
          <div className="detail-section">
            <h3>Additional Notes</h3>
            <p className="notes-content">{report.notedIfAny}</p>
          </div>
        )}

        {/* Site Images Section */}
        <div className="detail-section">
          <h3>Site Images</h3>
          {loadingImages ? (
            <div className="images-loading">
              <FaSpinner className="spinner" />
              <span>Loading images...</span>
            </div>
          ) : images.length > 0 ? (
            <>
              <div className="images-grid">
                {images.map((image, index) => {

                  const imageUrl = getImageUrl(image.imageUrl);
                  const hasError = imageErrors[image.id];

                  return (
                    <div key={image.id || index} className="image-card">
                      <img
                        src={hasError ? getPlaceholderImage() : imageUrl}
                        alt={image.imageName || 'Site image'}
                        className="image-thumb"
                        onClick={() => !hasError && openLightbox(index)}
                        onError={() => handleImageError(image.id)}
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
                            onClick={() => openLightbox(index)}
                            title="View"
                            disabled={hasError}
                          >
                            <FaEye />
                          </button>
                          <button
                            className="image-action-btn download"
                            onClick={() => handleDownloadImage(image.imageUrl, image.imageName)}
                            title="Download"
                          >
                            <FaDownload />
                          </button>
                          <button
                            className="image-action-btn delete"
                            onClick={() => handleDeleteImage(image.id)}
                            title="Delete"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="images-footer">
                <span>Total: {images.length} image(s)</span>
                {/* <span className="final-count">
                  ⭐ {images.filter(img => img.isFinal).length} final image(s)
                </span> */}
              </div>
            </>
          ) : (
            <div className="no-images">
              <FaImage className="no-images-icon" />
              <p>No images uploaded for this report</p>
            </div>
          )}
        </div>

        {/* Signatures */}
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