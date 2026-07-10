import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validateCalibrationReport } from "../../utils/calibrationReportValidators";
import {calibrationReportService} from "../../services/calibrationReportService";
import "./CalibrationReportForm.css";

// Summary items for checkbox/radio status
const CALIBRATION_SUMMARY_ITEMS = [
  { id: 1, fieldName: 'Calibration Successful', key: 'calibrationSuccessful' },
  { id: 2, fieldName: 'Calibration Adjustment Performed', key: 'calibrationAdjustmentPerformed' },
  { id: 3, fieldName: 'Sensor Within Acceptable Limits', key: 'sensorWithinAcceptableLimits' },
  { id: 4, fieldName: 'Sensor Requires Replacement', key: 'sensorRequiresReplacement' },
];

const CalibrationReportForm = ({ onSuccess, onCancel, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id || isEdit;

  const [formData, setFormData] = useState({
    reportDate: new Date().toISOString().split('T')[0],
    clientName: '',
    siteName: '',
    siteAddress: '',
    sensorId: '',
    modelNo: '',
    calibrationDate: new Date().toISOString().split('T')[0],
    calibrationDueDate: '',
    masterRefInstrument: {
      refSerialNo: '',
      calibrationCertificateNo: '',
      certificateValidity: ''
    },
    readingBeforeCalibration: {
      pm25Value: '',
      pm10Value: '',
      temp: '',
      humidity: ''
    },
    readingAfterCalibration: {
      pm25Value: '',
      pm10Value: '',
      temp: '',
      humidity: ''
    },
    calibrationSummary: {
      calibrationSuccessful: false,
      calibrationAdjustmentPerformed: false,
      sensorWithinAcceptableLimits: false,
      sensorRequiresReplacement: false
    },
    remarks: '',
    engineerDetails: {
      engineerName: '',
      signature: '',
      date: new Date().toISOString().split('T')[0]
    }
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchReportData();
    }
  }, [id, isEditMode]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await calibrationReportService.getReportById(id);
      
      // Format dates
      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        return new Date(dateStr).toISOString().split('T')[0];
      };

      setFormData({
        reportDate: formatDate(data.reportDate),
        clientName: data.clientName || '',
        siteName: data.siteName || '',
        siteAddress: data.siteAddress || '',
        sensorId: data.sensorId || '',
        modelNo: data.modelNo || '',
        calibrationDate: formatDate(data.calibrationDate),
        calibrationDueDate: formatDate(data.calibrationDueDate),
        masterRefInstrument: data.masterRefInstrument || { refSerialNo: '', calibrationCertificateNo: '', certificateValidity: '' },
        readingBeforeCalibration: data.readingBeforeCalibration || { pm25Value: '', pm10Value: '', temp: '', humidity: '' },
        readingAfterCalibration: data.readingAfterCalibration || { pm25Value: '', pm10Value: '', temp: '', humidity: '' },
        calibrationSummary: data.calibrationSummary || {
          calibrationSuccessful: false,
          calibrationAdjustmentPerformed: false,
          sensorWithinAcceptableLimits: false,
          sensorRequiresReplacement: false
        },
        remarks: data.remarks || '',
        engineerDetails: data.engineerDetails || { engineerName: '', signature: '', date: new Date().toISOString().split('T')[0] }
      });
    } catch (error) {
      toast.error('Failed to load report data');
      navigate('/calibration-reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Handle nested fields (e.g., masterRefInstrument.refSerialNo)
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Handle nested object fields (for summary checkboxes)
  const handleSummaryChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      calibrationSummary: {
        ...prev.calibrationSummary,
        [key]: value
      }
    }));
  };

  const handleCalibrationDateChange = (e) => {
    const date = e.target.value;
    if (date) {
      const dueDate = new Date(date);
      dueDate.setDate(dueDate.getDate() + 90);
      setFormData(prev => ({
        ...prev,
        calibrationDate: date,
        calibrationDueDate: dueDate.toISOString().split('T')[0]
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        calibrationDate: '',
        calibrationDueDate: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    // Prepare data for submission
    const submitData = {
      reportDate: formData.reportDate,
      clientName: formData.clientName,
      siteName: formData.siteName,
      siteAddress: formData.siteAddress,
      sensorId: formData.sensorId,
      modelNo: formData.modelNo,
      calibrationDate: formData.calibrationDate,
      calibrationDueDate: formData.calibrationDueDate,
      masterRefInstrument: formData.masterRefInstrument,
      readingBeforeCalibration: formData.readingBeforeCalibration,
      readingAfterCalibration: formData.readingAfterCalibration,
      calibrationSummary: formData.calibrationSummary,
      remarks: formData.remarks,
      engineerDetails: formData.engineerDetails
    };

    // Validate
    const validation = validateCalibrationReport(submitData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      setIsSubmitting(false);
      setSubmitStatus({
        type: 'error',
        message: 'Please fix all errors before submitting'
      });
      
      // Scroll to first error
      const firstError = document.querySelector('.field-error');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      let response;
      if (isEditMode && id) {
        response = await calibrationReportService.updateReport(id, submitData);
        toast.success('Report updated successfully!');
      } else {
        response = await calibrationReportService.createReport(submitData);
        toast.success('Report created successfully!');
      }

      setSubmitStatus({
        type: 'success',
        message: isEditMode ? 'Report updated successfully!' : 'Report created successfully!'
      });

      // Reset form if not edit mode
      if (!isEditMode) {
        setTimeout(() => {
          setFormData({
            reportDate: new Date().toISOString().split('T')[0],
            clientName: '',
            siteName: '',
            siteAddress: '',
            sensorId: '',
            modelNo: '',
            calibrationDate: new Date().toISOString().split('T')[0],
            calibrationDueDate: '',
            masterRefInstrument: { refSerialNo: '', calibrationCertificateNo: '', certificateValidity: '' },
            readingBeforeCalibration: { pm25Value: '', pm10Value: '', temp: '', humidity: '' },
            readingAfterCalibration: { pm25Value: '', pm10Value: '', temp: '', humidity: '' },
            calibrationSummary: {
              calibrationSuccessful: false,
              calibrationAdjustmentPerformed: false,
              sensorWithinAcceptableLimits: false,
              sensorRequiresReplacement: false
            },
            remarks: '',
            engineerDetails: { engineerName: '', signature: '', date: new Date().toISOString().split('T')[0] }
          });
        }, 2000);
      }

      // Navigate back after success
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response);
        } else {
          navigate('/calibration-reports');
        }
      }, 1500);

    } catch (error) {
      console.error('Error saving report:', error);
      const errorMessage = error.response?.data?.message || 'Failed to save report. Please try again.';
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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
    <div className="calibration-report-form">
      <h2>{isEditMode ? 'Edit Calibration Report' : 'New Calibration Report'}</h2>

      {submitStatus && (
        <div className={`status-message ${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Report Header */}
        <div className="form-section">
          <h3>Report Header</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Report Date <span className="required">*</span></label>
              <input
                type="date"
                name="reportDate"
                value={formData.reportDate}
                onChange={handleInputChange}
                className={errors.reportDate ? 'error' : ''}
              />
              {errors.reportDate && <span className="field-error">{errors.reportDate}</span>}
            </div>

            <div className="form-group">
              <label>Client Name <span className="required">*</span></label>
              <input
                type="text"
                name="clientName"
                value={formData.clientName}
                onChange={handleInputChange}
                placeholder="Enter client name"
                className={errors.clientName ? 'error' : ''}
              />
              {errors.clientName && <span className="field-error">{errors.clientName}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Site Name <span className="required">*</span></label>
              <input
                type="text"
                name="siteName"
                value={formData.siteName}
                onChange={handleInputChange}
                placeholder="Enter site name"
                className={errors.siteName ? 'error' : ''}
              />
              {errors.siteName && <span className="field-error">{errors.siteName}</span>}
            </div>

            <div className="form-group">
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
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Sensor ID <span className="required">*</span></label>
              <input
                type="text"
                name="sensorId"
                value={formData.sensorId}
                onChange={handleInputChange}
                placeholder="Enter sensor ID"
                className={errors.sensorId ? 'error' : ''}
              />
              {errors.sensorId && <span className="field-error">{errors.sensorId}</span>}
            </div>

            <div className="form-group">
              <label>Model No <span className="required">*</span></label>
              <input
                type="text"
                name="modelNo"
                value={formData.modelNo}
                onChange={handleInputChange}
                placeholder="Enter model number"
                className={errors.modelNo ? 'error' : ''}
              />
              {errors.modelNo && <span className="field-error">{errors.modelNo}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Calibration Date <span className="required">*</span></label>
              <input
                type="date"
                name="calibrationDate"
                value={formData.calibrationDate}
                onChange={handleCalibrationDateChange}
                className={errors.calibrationDate ? 'error' : ''}
              />
              {errors.calibrationDate && <span className="field-error">{errors.calibrationDate}</span>}
            </div>

            <div className="form-group">
              <label>Calibration Due Date</label>
              <input
                type="date"
                name="calibrationDueDate"
                value={formData.calibrationDueDate}
                readOnly
                className="readonly"
              />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Auto-calculated: 90 days after calibration date
              </small>
            </div>
          </div>
        </div>

        {/* Master Reference Instrument */}
        <div className="form-section">
          <h3>Master Reference Instrument Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Ref Serial No <span className="required">*</span></label>
              <input
                type="text"
                name="masterRefInstrument.refSerialNo"
                value={formData.masterRefInstrument.refSerialNo}
                onChange={handleInputChange}
                placeholder="Enter reference serial number"
                className={errors['masterRefInstrument.refSerialNo'] ? 'error' : ''}
              />
              {errors['masterRefInstrument.refSerialNo'] && <span className="field-error">{errors['masterRefInstrument.refSerialNo']}</span>}
            </div>

            <div className="form-group">
              <label>Calibration Certificate No <span className="required">*</span></label>
              <input
                type="text"
                name="masterRefInstrument.calibrationCertificateNo"
                value={formData.masterRefInstrument.calibrationCertificateNo}
                onChange={handleInputChange}
                placeholder="Enter certificate number"
                className={errors['masterRefInstrument.calibrationCertificateNo'] ? 'error' : ''}
              />
              {errors['masterRefInstrument.calibrationCertificateNo'] && <span className="field-error">{errors['masterRefInstrument.calibrationCertificateNo']}</span>}
            </div>

            <div className="form-group">
              <label>Certificate Validity <span className="required">*</span></label>
              <input
                type="text"
                name="masterRefInstrument.certificateValidity"
                value={formData.masterRefInstrument.certificateValidity}
                onChange={handleInputChange}
                placeholder="Enter certificate validity"
                className={errors['masterRefInstrument.certificateValidity'] ? 'error' : ''}
              />
              {errors['masterRefInstrument.certificateValidity'] && <span className="field-error">{errors['masterRefInstrument.certificateValidity']}</span>}
            </div>
          </div>
        </div>

        {/* Readings */}
        <div className="form-section">
          <h3>Readings</h3>

          <div className="readings-grid">
            <div className="reading-group before">
              <h4>Before Calibration</h4>
              <div className="form-group">
                <label>PM2.5 Value <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  name="readingBeforeCalibration.pm25Value"
                  value={formData.readingBeforeCalibration.pm25Value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={errors['readingBeforeCalibration.pm25Value'] ? 'error' : ''}
                />
                {errors['readingBeforeCalibration.pm25Value'] && <span className="field-error">{errors['readingBeforeCalibration.pm25Value']}</span>}
              </div>
              <div className="form-group">
                <label>PM10 Value <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  name="readingBeforeCalibration.pm10Value"
                  value={formData.readingBeforeCalibration.pm10Value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={errors['readingBeforeCalibration.pm10Value'] ? 'error' : ''}
                />
                {errors['readingBeforeCalibration.pm10Value'] && <span className="field-error">{errors['readingBeforeCalibration.pm10Value']}</span>}
              </div>
              <div className="form-group">
                <label>Temp (°C) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="readingBeforeCalibration.temp"
                  value={formData.readingBeforeCalibration.temp}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  className={errors['readingBeforeCalibration.temp'] ? 'error' : ''}
                />
                {errors['readingBeforeCalibration.temp'] && <span className="field-error">{errors['readingBeforeCalibration.temp']}</span>}
              </div>
              <div className="form-group">
                <label>Humidity (%) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="readingBeforeCalibration.humidity"
                  value={formData.readingBeforeCalibration.humidity}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  className={errors['readingBeforeCalibration.humidity'] ? 'error' : ''}
                />
                {errors['readingBeforeCalibration.humidity'] && <span className="field-error">{errors['readingBeforeCalibration.humidity']}</span>}
              </div>
            </div>

            <div className="reading-group after">
              <h4>After Calibration</h4>
              <div className="form-group">
                <label>PM2.5 Value <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  name="readingAfterCalibration.pm25Value"
                  value={formData.readingAfterCalibration.pm25Value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={errors['readingAfterCalibration.pm25Value'] ? 'error' : ''}
                />
                {errors['readingAfterCalibration.pm25Value'] && <span className="field-error">{errors['readingAfterCalibration.pm25Value']}</span>}
              </div>
              <div className="form-group">
                <label>PM10 Value <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  name="readingAfterCalibration.pm10Value"
                  value={formData.readingAfterCalibration.pm10Value}
                  onChange={handleInputChange}
                  placeholder="0.00"
                  className={errors['readingAfterCalibration.pm10Value'] ? 'error' : ''}
                />
                {errors['readingAfterCalibration.pm10Value'] && <span className="field-error">{errors['readingAfterCalibration.pm10Value']}</span>}
              </div>
              <div className="form-group">
                <label>Temp (°C) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="readingAfterCalibration.temp"
                  value={formData.readingAfterCalibration.temp}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  className={errors['readingAfterCalibration.temp'] ? 'error' : ''}
                />
                {errors['readingAfterCalibration.temp'] && <span className="field-error">{errors['readingAfterCalibration.temp']}</span>}
              </div>
              <div className="form-group">
                <label>Humidity (%) <span className="required">*</span></label>
                <input
                  type="number"
                  step="0.1"
                  name="readingAfterCalibration.humidity"
                  value={formData.readingAfterCalibration.humidity}
                  onChange={handleInputChange}
                  placeholder="0.0"
                  className={errors['readingAfterCalibration.humidity'] ? 'error' : ''}
                />
                {errors['readingAfterCalibration.humidity'] && <span className="field-error">{errors['readingAfterCalibration.humidity']}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Calibration Summary */}
        <div className="form-section">
          <h3>Calibration Summary <span className="required">*</span></h3>

          <div className="summary-grid">
            {CALIBRATION_SUMMARY_ITEMS.map((item) => (
              <div key={item.id} className="summary-item">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.calibrationSummary[item.key] || false}
                    onChange={(e) => handleSummaryChange(item.key, e.target.checked)}
                  />
                  <span>{item.fieldName}</span>
                </label>
              </div>
            ))}
          </div>
          {errors.calibrationSummary && <span className="field-error">{errors.calibrationSummary}</span>}
        </div>

        {/* Remarks */}
        <div className="form-section">
          <h3>Remarks</h3>
          <div className="form-group">
            <label>Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              placeholder="Enter any additional remarks..."
              rows="3"
            />
          </div>
        </div>

        {/* Declaration */}
        <div className="form-section declaration">
          <h3>Declaration</h3>
          <div className="declaration-text">
            The calibration activity was carried out using a calibrated reference instrument traceable to applicable standards.
            The readings recorded above represent the observed values before and after calibration.
            Any observations and recommendations have been documented for necessary action.
          </div>
        </div>

        {/* Engineer Details */}
        <div className="form-section">
          <h3>Engineer Details</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Engineer Name <span className="required">*</span></label>
              <input
                type="text"
                name="engineerDetails.engineerName"
                value={formData.engineerDetails.engineerName}
                onChange={handleInputChange}
                placeholder="Enter engineer name"
                className={errors['engineerDetails.engineerName'] ? 'error' : ''}
              />
              {errors['engineerDetails.engineerName'] && <span className="field-error">{errors['engineerDetails.engineerName']}</span>}
            </div>

            <div className="form-group">
              <label>Signature <span className="required">*</span></label>
              <input
                type="text"
                name="engineerDetails.signature"
                value={formData.engineerDetails.signature}
                onChange={handleInputChange}
                placeholder="Enter signature (text)"
                className={errors['engineerDetails.signature'] ? 'error' : ''}
              />
              {errors['engineerDetails.signature'] && <span className="field-error">{errors['engineerDetails.signature']}</span>}
            </div>

            <div className="form-group">
              <label>Date <span className="required">*</span></label>
              <input
                type="date"
                name="engineerDetails.date"
                value={formData.engineerDetails.date}
                onChange={handleInputChange}
                className={errors['engineerDetails.date'] ? 'error' : ''}
              />
              {errors['engineerDetails.date'] && <span className="field-error">{errors['engineerDetails.date']}</span>}
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
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : (isEditMode ? 'Update Report' : 'Submit Report')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalibrationReportForm;