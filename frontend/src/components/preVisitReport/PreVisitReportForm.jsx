import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { validatePreVisitReport, validateEmail } from "../../utils/preVisitReportValidation";
import preVisitReportService from "../../api/preVisitReportService";
import "./PreVisitReport.css";
import notificationService from '../../services/notificationService';
import { toast } from 'react-toastify';
import { FaSpinner, FaFileImage, FaTrash, FaUpload } from 'react-icons/fa';
import { getAuthHeaders } from '../../utils/roles';
import { invalidate } from '../../utils/cache';
import { env } from '../../config/env';

const CHECKLIST_ITEMS = [
  { id: 1, fieldName: 'Confirm Availability of Stabilized power supply (230 V)' },
  { id: 2, fieldName: 'Verify Controller Mounting Structure (Wall/Pole)' },
  { id: 3, fieldName: 'Verify Sensor Placement Location' },
  { id: 4, fieldName: 'Inform Client Regarding internet connectivity requirement' },
  { id: 5, fieldName: 'Confirm LED Installation Location' },
  { id: 6, fieldName: 'Discuss Client Scope of Work' },
];

const API_BASE_URL = env.PREVISIT_REPORTS_URL;

const PreVisitReportForm = ({ onSuccess, onCancel, initialData, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id || isEdit;

  const [formData, setFormData] = useState({
    visitDate: new Date().toISOString().split('T')[0],
    companyName: '',
    siteAddress: '',
    sitePersonName: '',
    contactNo: '',
    emailId: '',
    inspectedBy: '',
    notedIfAny: '',
    customerName: '',
    customerSignature: '',
    technicianName: '',
    technicianSignature: '',
    checklist: CHECKLIST_ITEMS.map(item => ({
      fieldName: item.fieldName,
      status: null,
      remark: '',
      displayName: item.fieldName
    }))
  });

  // Image states
  const [imageFiles, setImageFiles] = useState([]);
  const [imageFileNames, setImageFileNames] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [emailExists, setEmailExists] = useState(false);
  const [loading, setLoading] = useState(false);
  const [originalEmail, setOriginalEmail] = useState('');

  // Fetch data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchReportData();
    } else if (initialData && isEdit) {
      loadInitialData(initialData);
    }
  }, [id, isEditMode, initialData]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      const data = await response.json();
      //console.log('📥 Fetched report data for edit:', data);

      setOriginalEmail(data.emailId || '');
      loadInitialData(data);
      
      // ✅ Load existing images if any
      if (data.siteImages && data.siteImages.length > 0) {
        setUploadedImages(data.siteImages);
      }
      
      toast.success('Report data loaded successfully');

    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report data');
      notificationService.error('Failed to load Pre-Visit Report');
      navigate('/previsit/view-all');
    } finally {
      setLoading(false);
    }
  };

  const loadInitialData = (data) => {
    const checklist = CHECKLIST_ITEMS.map((item, index) => {
      const apiItem = data.checklist?.find(c =>
        c.fieldName === item.fieldName ||
        c.fieldName?.toLowerCase() === item.fieldName?.toLowerCase()
      );

      return {
        fieldName: item.fieldName,
        status: apiItem?.status !== undefined ? apiItem.status : null,
        remark: apiItem?.remark || '',
        displayName: item.fieldName
      };
    });

    setFormData({
      visitDate: data.visitDate || new Date().toISOString().split('T')[0],
      companyName: data.companyName || '',
      siteAddress: data.siteAddress || '',
      sitePersonName: data.sitePersonName || '',
      contactNo: data.contactNo || '',
      emailId: data.emailId || '',
      inspectedBy: data.inspectedBy || '',
      notedIfAny: data.notedIfAny || '',
      customerName: data.customerName || '',
      customerSignature: data.customerSignature || '',
      technicianName: data.technicianName || '',
      technicianSignature: data.technicianSignature || '',
      checklist: checklist
    });
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Limit to 10 images
    if (imageFiles.length + files.length > 10) {
      toast.warning('Maximum 10 images allowed');
      e.target.value = '';
      return;
    }

    // Check file sizes (max 5MB each)
    const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.warning('Some images exceed 5MB limit. Please compress them and try again.');
      e.target.value = '';
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    setImageFileNames(prev => [...prev, ...files.map(file => file.name)]);

    e.target.value = '';
    toast.success(`${files.length} image(s) selected`);
  };

  // Remove image from selection
  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageFileNames(prev => prev.filter((_, i) => i !== index));
  };

  // Clear all images
  const clearAllImages = () => {
    setImageFiles([]);
    setImageFileNames([]);
    toast.info('All images cleared');
  };

  // Email check effect
  useEffect(() => {
    const checkEmail = async () => {
      const currentEmail = formData.emailId;

      if (!currentEmail || !validateEmail(currentEmail)) {
        setEmailExists(false);
        return;
      }

      if (isEditMode && originalEmail && currentEmail === originalEmail) {
        setEmailExists(false);
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.emailId;
          return newErrors;
        });
        return;
      }

      try {
        const exists = await preVisitReportService.checkEmailExists(currentEmail, isEditMode ? id : null);
        setEmailExists(exists);
        if (exists) {
          setErrors(prev => ({
            ...prev,
            emailId: 'This email is already registered'
          }));
        } else {
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors.emailId;
            return newErrors;
          });
        }
      } catch (error) {
        console.error('Error checking email:', error);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.emailId, originalEmail, isEditMode, id]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleChecklistChange = (index, field, value) => {
    const updatedChecklist = [...formData.checklist];
    updatedChecklist[index] = {
      ...updatedChecklist[index],
      [field]: value
    };
    setFormData(prev => ({
      ...prev,
      checklist: updatedChecklist
    }));
    const errorKey = `checklist_${index}_status`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  };

  // ✅ FIXED: Submit handler with correct image upload
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    const validation = validatePreVisitReport(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      setSubmitStatus({
        type: 'error',
        message: 'Please fix all errors before submitting'
      });
      const firstError = document.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (emailExists && formData.emailId !== originalEmail) {
      setSubmitStatus({
        type: 'error',
        message: 'Email already exists. Please use a different email.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Step 1: Create/Update the report
      const payload = {
        companyName: formData.companyName.trim(),
        siteAddress: formData.siteAddress.trim(),
        sitePersonName: formData.sitePersonName.trim(),
        contactNo: formData.contactNo.trim(),
        emailId: formData.emailId.trim(),
        inspectedBy: formData.inspectedBy.trim(),
        visitDate: formData.visitDate,
        checklist: formData.checklist.map(item => ({
          fieldName: item.fieldName,
          status: item.status || false,
          remark: item.remark || ''
        })),
        notedIfAny: formData.notedIfAny.trim(),
        customerName: formData.customerName.trim(),
        customerSignature: formData.customerSignature.trim(),
        technicianName: formData.technicianName.trim(),
        technicianSignature: formData.technicianSignature.trim()
      };

      //console.log('📦 Report Payload:', payload);

      let reportResponse;

      if (isEditMode && id) {
        reportResponse = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      } else {
        reportResponse = await fetch(API_BASE_URL, {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify(payload)
        });
      }

      if (!reportResponse.ok) {
        let errorMessage = `Failed to ${isEditMode ? 'update' : 'save'} report: ${reportResponse.status}`;
        try {
          const errorData = await reportResponse.text();
          if (errorData) errorMessage = errorData;
        } catch (e) { }
        throw new Error(errorMessage);
      }

      const reportResult = await reportResponse.json();
      const reportId = reportResult.id;
      invalidate('previsit_reports');
      localStorage.removeItem('dashboard_data');
      localStorage.removeItem('dashboard_timestamp');

      // ✅ Step 2: Upload images using FormData (bulk upload)
      if (imageFiles.length > 0) {
        //console.log(`📸 Uploading ${imageFiles.length} images for report ${reportId}`);
        
        // ✅ Create FormData with all files
        const imageFormData = new FormData();
        imageFiles.forEach(file => {
          imageFormData.append('files', file);
        });
        imageFormData.append('isFinal', 'false');
        imageFormData.append('description', 'Site installation images');

        try {
          // ✅ Use the correct endpoint: ${API_BASE_URL}/images/upload/${reportId}
          const uploadResponse = await fetch(
            `${API_BASE_URL}/images/upload/${reportId}`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${localStorage.getItem('token') || ''}`
              },
              body: imageFormData
            }
          );

          if (uploadResponse.ok) {
            const uploadedData = await uploadResponse.json();
            //console.log('✅ All images uploaded successfully:', uploadedData);
            setUploadedImages(uploadedData);
            toast.success(`✅ ${imageFiles.length} images uploaded successfully!`);
            
            // ✅ Clear image files after successful upload
            setImageFiles([]);
            setImageFileNames([]);
          } else {
            const errorText = await uploadResponse.text();
            console.error('❌ Image upload failed:', errorText);
            
            // ✅ Fallback: Try individual uploads
            toast.warning('Bulk upload failed, trying individual uploads...');
            let uploadSuccess = 0;
            let uploadFailed = 0;

            for (let i = 0; i < imageFiles.length; i++) {
              const singleFormData = new FormData();
              singleFormData.append('files', imageFiles[i]);
              singleFormData.append('isFinal', 'false');
              singleFormData.append('description', 'Site installation images');

              try {
                const singleResponse = await fetch(
                  `${API_BASE_URL}/images/upload/${reportId}`,
                  {
                    method: 'POST',
                    headers: {
                      Authorization: `Bearer ${localStorage.getItem('token') || ''}`
                    },
                    body: singleFormData
                  }
                );

                if (singleResponse.ok) {
                  const data = await singleResponse.json();
                  setUploadedImages(prev => [...prev, ...data]);
                  uploadSuccess++;
                } else {
                  uploadFailed++;
                  console.warn(`❌ Failed to upload image ${i + 1}`);
                }
              } catch (error) {
                uploadFailed++;
                console.error(`❌ Error uploading image ${i + 1}:`, error);
              }
            }

            if (uploadSuccess > 0) {
              toast.success(`${uploadSuccess} images uploaded successfully`);
              setImageFiles([]);
              setImageFileNames([]);
            }
            
            if (uploadFailed > 0) {
              toast.warning(`${uploadFailed} images failed to upload`);
            }
          }
        } catch (error) {
          console.error('❌ Error uploading images:', error);
          toast.error('Failed to upload images. Please try again.');
        }
      }

      setSubmitStatus({
        type: 'success',
        message: isEditMode ? 'Report updated successfully!' : 'Report created successfully!'
      });

      notificationService.success(isEditMode ? 'Report updated successfully!' : 'Report created successfully!');

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(reportResult);
        }
        if (!isEditMode) {
          setFormData({
            visitDate: new Date().toISOString().split('T')[0],
            companyName: '',
            siteAddress: '',
            sitePersonName: '',
            contactNo: '',
            emailId: '',
            inspectedBy: '',
            notedIfAny: '',
            customerName: '',
            customerSignature: '',
            technicianName: '',
            technicianSignature: '',
            checklist: CHECKLIST_ITEMS.map(item => ({
              fieldName: item.fieldName,
              status: null,
              remark: '',
              displayName: item.fieldName
            }))
          });
          setImageFiles([]);
          setImageFileNames([]);
          setEmailExists(false);
          setOriginalEmail('');
        } else {
          navigate('/previsit/view-all');
        }
        setSubmitStatus(null);
      }, 2000);

    } catch (error) {
      console.error('Error saving report:', error);

      let errorMessage = error.message || 'Failed to save report. Please try again.';

      if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
        errorMessage = 'A report with this data already exists. Please check your entries.';
      } else if (errorMessage.includes('400')) {
        errorMessage = 'Invalid data provided. Please check all fields.';
      } else if (errorMessage.includes('500')) {
        errorMessage = 'Server error. Please try again later.';
      }

      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
      notificationService.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/previsit/view-all');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading report data...</p>
      </div>
    );
  }

  return (
    <div className="pre-visit-form-container">
      <div className="form-header">
        <button className="btn-back" onClick={handleBack}>
          ← Back
        </button>
        <h2>{isEditMode ? 'Edit Pre-Visit Report' : 'New Pre-Visit Report'}</h2>
        <p>{isEditMode ? 'Update the details of the pre-visit report.' : 'Fill in the details below to create a new pre-visit report.'}</p>
        {isEditMode && (
          <div className="edit-mode-banner">
            ✏️ Editing Mode - Report ID: FESPL_PVR_{id}
          </div>
        )}
      </div>

      {submitStatus && (
        <div className={`status-message ${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="pre-visit-form">
        {/* Basic Details */}
        <div className="form-section">
          <div className="section-title">
            <span className="section-icon"></span>
            <h3>Basic Details</h3>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Visit Date <span className="required">*</span></label>
              <input
                type="date"
                name="visitDate"
                value={formData.visitDate}
                onChange={handleInputChange}
                className={errors.visitDate ? 'error' : ''}
              />
              {errors.visitDate && <span className="field-error">{errors.visitDate}</span>}
            </div>

            <div className="form-group">
              <label>Company Name <span className="required">*</span></label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                className={errors.companyName ? 'error' : ''}
              />
              {errors.companyName && <span className="field-error">{errors.companyName}</span>}
            </div>

            <div className="form-group full-width">
              <label>Site Address <span className="required">*</span></label>
              <input
                type="text"
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleInputChange}
                placeholder="Enter site address"
                className={errors.siteAddress ? 'error' : ''}
              />
              {errors.siteAddress && <span className="field-error">{errors.siteAddress}</span>}
            </div>

            <div className="form-group">
              <label>Site Person Name <span className="required">*</span></label>
              <input
                type="text"
                name="sitePersonName"
                value={formData.sitePersonName}
                onChange={handleInputChange}
                placeholder="Enter site person name"
                className={errors.sitePersonName ? 'error' : ''}
              />
              {errors.sitePersonName && <span className="field-error">{errors.sitePersonName}</span>}
            </div>

            <div className="form-group">
              <label>Contact No <span className="required">*</span></label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                placeholder="Enter phone number"
                className={errors.contactNo ? 'error' : ''}
              />
              {errors.contactNo && <span className="field-error">{errors.contactNo}</span>}
            </div>

            <div className="form-group">
              <label>Email ID <span className="required">*</span></label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="Enter email address"
                className={errors.emailId ? 'error' : ''}
              />
              {errors.emailId && <span className="field-error">{errors.emailId}</span>}
              {emailExists && formData.emailId !== originalEmail && (
                <span className="field-error">Email already registered</span>
              )}
              {isEditMode && formData.emailId === originalEmail && (
                <span className="field-info">✓ Current email (unchanged)</span>
              )}
            </div>

            <div className="form-group">
              <label>Inspected By <span className="required">*</span></label>
              <input
                type="text"
                name="inspectedBy"
                value={formData.inspectedBy}
                onChange={handleInputChange}
                placeholder="Enter inspector name"
                className={errors.inspectedBy ? 'error' : ''}
              />
              {errors.inspectedBy && <span className="field-error">{errors.inspectedBy}</span>}
            </div>
          </div>
        </div>

        {/* Checklist */}
        <div className="form-section">
          <div className="section-title">
            <span className="section-icon"></span>
            <h3>Checklist <span className="required">*</span></h3>
          </div>

          <div className="checklist-container">
            {formData.checklist.map((item, index) => (
              <div key={index} className="checklist-item">
                <div className="checklist-label">
                  <span className="checklist-number">{index + 1}.</span>
                  <span className="checklist-text">{item.fieldName}</span>
                  <span className="required">*</span>
                </div>
                <div className="checklist-controls">
                  <div className="status-options">
                    <label className={`status-option ${item.status === true ? 'selected-yes' : ''}`}>
                      <input
                        type="radio"
                        name={`checklist_${index}_status`}
                        value="true"
                        checked={item.status === true}
                        onChange={() => handleChecklistChange(index, 'status', true)}
                      />
                      <span>Yes</span>
                    </label>
                    <label className={`status-option ${item.status === false ? 'selected-no' : ''}`}>
                      <input
                        type="radio"
                        name={`checklist_${index}_status`}
                        value="false"
                        checked={item.status === false}
                        onChange={() => handleChecklistChange(index, 'status', false)}
                      />
                      <span>No</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="Remark (optional)"
                    value={item.remark || ''}
                    onChange={(e) => handleChecklistChange(index, 'remark', e.target.value)}
                    className="remark-input"
                  />
                </div>
                {errors[`checklist_${index}_status`] && (
                  <span className="field-error">{errors[`checklist_${index}_status`]}</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Notes */}
        <div className="form-section">
          <div className="section-title">
            <span className="section-icon"></span>
            <h3>Additional Notes</h3>
          </div>

          <div className="form-group">
            <textarea
              name="notedIfAny"
              value={formData.notedIfAny}
              onChange={handleInputChange}
              placeholder="Enter any additional notes..."
              rows="4"
              className="notes-textarea"
            />
          </div>
        </div>

        {/* Site Images Section */}
        <div className="form-section">
          <div className="section-title">
            <span className="section-icon">📸</span>
            <h3>Site Images <span className="optional">(Optional)</span></h3>
            <span className="image-hint">(Uploaded automatically on submit)</span>
          </div>

          <div className="image-upload-wrapper">
            {/* File Selection */}
            <div className="image-upload-dropzone">
              <input
                id="imageUploadInput"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageSelect}
                className="image-file-input"
              />
              <label htmlFor="imageUploadInput" className="image-upload-label">
                <FaUpload className="upload-icon" />
                <span>Click to select site images</span>
                <span className="upload-subtext">JPG, PNG, GIF (Max 5MB each, max 10 images)</span>
              </label>
            </div>

            {/* File Names List */}
            {imageFileNames.length > 0 && (
              <div className="file-list-container">
                <div className="file-list-header">
                  <span className="file-list-title">
                    <FaFileImage className="file-icon" />
                    {imageFileNames.length} file(s) selected
                  </span>
                  <button
                    type="button"
                    className="clear-files-btn"
                    onClick={clearAllImages}
                  >
                    Clear All
                  </button>
                </div>
                <ul className="file-list">
                  {imageFileNames.map((fileName, index) => (
                    <li key={index} className="file-item">
                      <span className="file-name">
                        <FaFileImage className="file-item-icon" />
                        {fileName}
                      </span>
                      <button
                        type="button"
                        className="remove-file-btn"
                        onClick={() => removeImage(index)}
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Signatures */}
        <div className="form-section">
          <div className="section-title">
            <span className="section-icon"></span>
            <h3>Signatures</h3>
          </div>

          <div className="signature-grid">
            <div className="signature-block">
              <h4 className="signature-title">👤 Customer</h4>
              <div className="form-group">
                <label>Customer Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  className={errors.customerName ? 'error' : ''}
                />
                {errors.customerName && <span className="field-error">{errors.customerName}</span>}
              </div>
              <div className="form-group">
                <label>Customer Signature <span className="required">*</span></label>
                <input
                  type="text"
                  name="customerSignature"
                  value={formData.customerSignature}
                  onChange={handleInputChange}
                  placeholder="Enter customer signature"
                  className={errors.customerSignature ? 'error' : ''}
                />
                {errors.customerSignature && <span className="field-error">{errors.customerSignature}</span>}
              </div>
            </div>

            <div className="signature-block">
              <h4 className="signature-title">🔧 Technician</h4>
              <div className="form-group">
                <label>Technician Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="technicianName"
                  value={formData.technicianName}
                  onChange={handleInputChange}
                  placeholder="Enter technician name"
                  className={errors.technicianName ? 'error' : ''}
                />
                {errors.technicianName && <span className="field-error">{errors.technicianName}</span>}
              </div>
              <div className="form-group">
                <label>Technician Signature <span className="required">*</span></label>
                <input
                  type="text"
                  name="technicianSignature"
                  value={formData.technicianSignature}
                  onChange={handleInputChange}
                  placeholder="Enter technician signature"
                  className={errors.technicianSignature ? 'error' : ''}
                />
                {errors.technicianSignature && <span className="field-error">{errors.technicianSignature}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleBack}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || (emailExists && formData.emailId !== originalEmail)}
            className="btn-submit"
          >
            {isSubmitting ? (
              <>
                <FaSpinner className="spinning" />
                {imageFiles.length > 0 ? 'Uploading Images...' : 'Saving...'}
              </>
            ) : (
              isEditMode ? 'Update Report' : 'Submit Report'
            )}
          </button>
        </div>
      </form>

      <style>{`
        .edit-mode-banner {
          background: #e3f2fd;
          border: 1px solid #2196f3;
          border-radius: 6px;
          padding: 8px 16px;
          margin: 10px 0;
          color: #0d47a1;
          font-size: 14px;
          font-weight: 500;
          display: inline-block;
        }
        .btn-back {
          background: none;
          border: none;
          color: #4F46E5;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 0;
          margin-bottom: 8px;
        }
        .btn-back:hover {
          color: #4338CA;
          text-decoration: underline;
        }
        .form-header {
          margin-bottom: 24px;
        }
        .form-header h2 {
          margin: 8px 0 4px 0;
        }
        .form-header p {
          margin: 0;
          color: #6b7280;
        }
        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 50vh;
        }
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #4F46E5;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .field-info {
          color: #059669;
          font-size: 12px;
          margin-top: 4px;
          display: block;
        }
        .optional {
          color: #6b7280;
          font-size: 14px;
          font-weight: 400;
        }
        .image-hint {
          color: #94a3b8;
          font-size: 12px;
          font-weight: 400;
          margin-left: 8px;
        }
        .spinning {
          animation: spin 1s linear infinite;
          margin-right: 8px;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default PreVisitReportForm;