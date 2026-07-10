import React, { useState, useEffect } from "react";
import { validatePreVisitReport, validateEmail } from "../../utils/preVisitReportValidation";
import preVisitReportService from "../../api/preVisitReportService";
import "./PreVisitReport.css";
import notificationService from '../../services/notificationService';

const CHECKLIST_ITEMS = [
  { id: 1, fieldName: 'Confirm Availability of Stabilized power supply (230 V)' },
  { id: 2, fieldName: 'Verify Controller Mounting Structure (Wall/Pole)' },
  { id: 3, fieldName: 'Verify Sensor Placement Location' },
  { id: 4, fieldName: 'Inform Client Regarding internet connectivity requirement' },
  { id: 5, fieldName: 'Confirm LED Installation Location' },
  { id: 6, fieldName: 'Discuss Client Scope of Work' },
];

const PreVisitReportForm = ({ onSuccess, onCancel, initialData, isEdit = false }) => {
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

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [emailExists, setEmailExists] = useState(false);

  // Load initial data for edit mode
  useEffect(() => {
    if (initialData && isEdit) {
      setFormData({
        ...initialData,
        visitDate: initialData.visitDate || new Date().toISOString().split('T')[0],
        customerSignature: initialData.customerSignature || '',
        technicianSignature: initialData.technicianSignature || '',
        checklist: initialData.checklist || CHECKLIST_ITEMS.map(item => ({
          fieldName: item.fieldName,
          status: null,
          remark: '',
          displayName: item.fieldName
        }))
      });
    }
  }, [initialData, isEdit]);

  // Check email existence
  useEffect(() => {
    const checkEmail = async () => {
      if (formData.emailId && validateEmail(formData.emailId)) {
        try {
          const exists = await preVisitReportService.checkEmailExists(formData.emailId);
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
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.emailId]);

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

    if (emailExists) {
      setSubmitStatus({
        type: 'error',
        message: 'Email already exists. Please use a different email.'
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let response;
      if (isEdit && initialData?.id) {
        response = await preVisitReportService.updateReport(initialData.id, formData);
        setSubmitStatus({ type: 'success', message: 'Report updated successfully!' });
      } else {
        response = await preVisitReportService.createReport(formData);
        setSubmitStatus({ type: 'success', message: 'Report created successfully!' });
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response);
        }
        if (!isEdit) {
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
          setEmailExists(false);
        }
        setSubmitStatus(null);
      }, 2000);
      notificationService.success(isEdit ? 'Report updated successfully!' : 'Report created successfully!');
    } catch (error) {
      //console.error('Error saving report:', error);
      setSubmitStatus({
        type: 'error',
        message: typeof error === 'string' ? error : 'Failed to save report. Please try again.'
      });
      notificationService.error(error.message || 'Failed to save report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pre-visit-form-container">
      <div className="form-header">
        <h2>{isEdit ? 'Edit Pre-Visit Report' : 'New Pre-Visit Report'}</h2>
        <p>Fill in the details below to create a new pre-visit report.</p>
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
              {emailExists && <span className="field-error">Email already registered</span>}
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
          {onCancel && (
            <button type="button" className="btn-cancel" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={isSubmitting || emailExists} className="btn-submit">
            {isSubmitting ? 'Saving...' : (isEdit ? 'Update Report' : 'Submit Report')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PreVisitReportForm;