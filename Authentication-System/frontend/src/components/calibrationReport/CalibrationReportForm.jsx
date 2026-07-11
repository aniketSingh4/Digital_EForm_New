// src/components/CalibrationReportForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validateCalibrationReport } from "../../utils/calibrationReportValidators";
import { calibrationReportService } from "../../services/calibrationReportService";
import "./CalibrationReportForm.css";

// Summary items for checkbox/radio status
const CALIBRATION_SUMMARY_ITEMS = [
  { id: 1, fieldName: 'Calibration Successful', key: 'calibrationSuccessful' },
  { id: 2, fieldName: 'Calibration Adjustment Performed', key: 'calibrationAdjustmentPerformed' },
  { id: 3, fieldName: 'Sensor Within Acceptable Limits', key: 'sensorWithinAcceptableLimits' },
  { id: 4, fieldName: 'Sensor Requires Replacement', key: 'sensorRequiresReplacement' },
];

// ✅ Default declaration text
const DEFAULT_DECLARATION = `The calibration activity was carried out using a calibrated reference instrument traceable to applicable
standards. The readings recorded above represent the observed values before and after calibration. Any
observations and recommendations have been documented for necessary action.`;

// ✅ Helper function to get today's date in YYYY-MM-DD format
const getTodayDate = () => {
  return new Date().toISOString().split('T')[0];
};

// ✅ Helper function to calculate date 90 days from today
const getDatePlus90Days = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  date.setDate(date.getDate() + 90);
  return date.toISOString().split('T')[0];
};

// ✅ Default form data - defined outside component
const DEFAULT_FORM_DATA = {
  reportDate: getTodayDate(),
  clientName: '',
  siteName: '',
  siteAddress: '',
  sensorId: '',
  modelNo: '',
  serialNo: '',
  calibrationDate: getTodayDate(),
  calibrationDueDate: getDatePlus90Days(getTodayDate()),
  masterRefInstrument: {
    refSerialNo: '',
    calibrationCertificateNo: '',
    certificateValidity: getDatePlus90Days(getTodayDate())
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
  declaration: DEFAULT_DECLARATION,
  engineerDetails: {
    engineerName: '',
    signature: '',
    date: getTodayDate()
  }
};

const CalibrationReportForm = ({ onSuccess, onCancel, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id || isEdit;

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Load data for edit mode
  useEffect(() => {
    if (isEditMode && id) {
      fetchReportData();
    }
  }, [id, isEditMode]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      setApiError(null);
      const data = await calibrationReportService.getReportById(id);

      console.log('📥 Fetched report data:', data);

      if (!data) {
        toast.error('Report data not found');
        navigate('/calibration-reports');
        return;
      }

      const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
          const date = new Date(dateStr);
          if (isNaN(date.getTime())) return '';
          return date.toISOString().split('T')[0];
        } catch (e) {
          return '';
        }
      };

      setFormData({
        reportDate: formatDate(data.reportDate) || getTodayDate(),
        clientName: data.clientName || '',
        siteName: data.siteName || '',
        siteAddress: data.siteAddress || '',
        sensorId: data.sensorId || '',
        modelNo: data.modelNo || '',
        serialNo: data.serialNo || '',
        calibrationDate: formatDate(data.calibrationDate) || getTodayDate(),
        calibrationDueDate: formatDate(data.calibrationDueDate) || getDatePlus90Days(getTodayDate()),
        masterRefInstrument: {
          refSerialNo: data.masterRefInstrument?.refSerialNo || '',
          calibrationCertificateNo: data.masterRefInstrument?.calibrationCertificateNo || '',
          certificateValidity: formatDate(data.masterRefInstrument?.certificateValidity) || getDatePlus90Days(getTodayDate())
        },
        readingBeforeCalibration: {
          pm25Value: data.readingBeforeCalibration?.pm25Value || '',
          pm10Value: data.readingBeforeCalibration?.pm10Value || '',
          temp: data.readingBeforeCalibration?.temp || '',
          humidity: data.readingBeforeCalibration?.humidity || ''
        },
        readingAfterCalibration: {
          pm25Value: data.readingAfterCalibration?.pm25Value || '',
          pm10Value: data.readingAfterCalibration?.pm10Value || '',
          temp: data.readingAfterCalibration?.temp || '',
          humidity: data.readingAfterCalibration?.humidity || ''
        },
        calibrationSummary: {
          calibrationSuccessful: data.calibrationSummary?.calibrationSuccessful || false,
          calibrationAdjustmentPerformed: data.calibrationSummary?.calibrationAdjustmentPerformed || false,
          sensorWithinAcceptableLimits: data.calibrationSummary?.sensorWithinAcceptableLimits || false,
          sensorRequiresReplacement: data.calibrationSummary?.sensorRequiresReplacement || false
        },
        remarks: data.remarks || '',
        declaration: data.declaration || DEFAULT_DECLARATION,
        engineerDetails: {
          engineerName: data.engineerDetails?.engineerName || '',
          signature: data.engineerDetails?.signature || '',
          date: formatDate(data.engineerDetails?.date) || getTodayDate()
        }
      });
    } catch (error) {
      console.error('Error fetching report:', error);
      toast.error('Failed to load report data');
      navigate('/calibration-reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

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

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

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
      const dueDate = getDatePlus90Days(date);
      setFormData(prev => ({
        ...prev,
        calibrationDate: date,
        calibrationDueDate: dueDate,
        masterRefInstrument: {
          ...prev.masterRefInstrument,
          certificateValidity: dueDate
        }
      }));
    } else {
      const today = getTodayDate();
      const dueDate = getDatePlus90Days(today);
      setFormData(prev => ({
        ...prev,
        calibrationDate: '',
        calibrationDueDate: '',
        masterRefInstrument: {
          ...prev.masterRefInstrument,
          certificateValidity: ''
        }
      }));
    }
  };

  const handleReportDateChange = (e) => {
    const date = e.target.value;
    setFormData(prev => ({
      ...prev,
      reportDate: date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setApiError(null);

    // ✅ Use formData directly with fallback
    const data = formData || DEFAULT_FORM_DATA;

    const submitData = {
      reportDate: data.reportDate || getTodayDate(),
      clientName: data.clientName || '',
      siteName: data.siteName || '',
      siteAddress: data.siteAddress || '',
      sensorId: data.sensorId || '',
      modelNo: data.modelNo || '',
      serialNo: data.serialNo || '',
      calibrationDate: data.calibrationDate || getTodayDate(),
      calibrationDueDate: data.calibrationDueDate || getDatePlus90Days(getTodayDate()),
      masterRefInstrument: {
        refSerialNo: data.masterRefInstrument?.refSerialNo || '',
        calibrationCertificateNo: data.masterRefInstrument?.calibrationCertificateNo || '',
        certificateValidity: data.masterRefInstrument?.certificateValidity || getDatePlus90Days(getTodayDate())
      },
      readingBeforeCalibration: {
        pm25Value: data.readingBeforeCalibration?.pm25Value || '',
        pm10Value: data.readingBeforeCalibration?.pm10Value || '',
        temp: data.readingBeforeCalibration?.temp || '',
        humidity: data.readingBeforeCalibration?.humidity || ''
      },
      readingAfterCalibration: {
        pm25Value: data.readingAfterCalibration?.pm25Value || '',
        pm10Value: data.readingAfterCalibration?.pm10Value || '',
        temp: data.readingAfterCalibration?.temp || '',
        humidity: data.readingAfterCalibration?.humidity || ''
      },
      calibrationSummary: {
        calibrationSuccessful: data.calibrationSummary?.calibrationSuccessful || false,
        calibrationAdjustmentPerformed: data.calibrationSummary?.calibrationAdjustmentPerformed || false,
        sensorWithinAcceptableLimits: data.calibrationSummary?.sensorWithinAcceptableLimits || false,
        sensorRequiresReplacement: data.calibrationSummary?.sensorRequiresReplacement || false
      },
      remarks: data.remarks || '',
      declaration: data.declaration || DEFAULT_DECLARATION,
      engineerDetails: {
        engineerName: data.engineerDetails?.engineerName || '',
        signature: data.engineerDetails?.signature || '',
        date: data.engineerDetails?.date || getTodayDate()
      }
    };

    console.log('📤 Submitting calibration report:', JSON.stringify(submitData, null, 2));

    const validation = validateCalibrationReport(submitData);
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

    try {
      let response;
      if (isEditMode && id) {
        response = await calibrationReportService.updateReport(id, submitData);
        toast.success('Report updated successfully!');
      } else {
        response = await calibrationReportService.createReport(submitData);
        toast.success('Report created successfully!');
      }

      console.log('✅ Response received:', response);

      // ✅ Response is the DTO directly
      const reportData = response;

      if (!reportData) {
        console.warn('⚠️ No response data received');
        setSubmitStatus({
          type: 'success',
          message: isEditMode ? 'Report updated successfully!' : 'Report created successfully!'
        });
        setTimeout(() => {
          if (onSuccess) {
            onSuccess(submitData);
          } else {
            navigate('/calibration-reports');
          }
        }, 1500);
        setIsSubmitting(false);
        return;
      }

      console.log('✅ Report date from response:', reportData.reportDate);

      setSubmitStatus({
        type: 'success',
        message: isEditMode ? 'Report updated successfully!' : 'Report created successfully!'
      });

      if (!isEditMode) {
        setTimeout(() => {
          setFormData(DEFAULT_FORM_DATA);
        }, 2000);
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(reportData);
        } else {
          navigate('/calibration-reports');
        }
      }, 1500);

    } catch (error) {
      console.error('❌ Error saving report:', error);
      console.error('❌ Error details:', error.response?.data);

      let errorMessage = 'Failed to save report. Please try again.';
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        }
      }

      setApiError(errorMessage);
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

  // ✅ CRITICAL FIX: Use a safe reference for rendering
  const f = formData && typeof formData === 'object' ? formData : DEFAULT_FORM_DATA;

  return (
    <div className="calibration-report-form">
      <h2>{isEditMode ? 'Edit Calibration Report' : 'New Calibration Report'}</h2>

      {submitStatus && (
        <div className={`status-message ${submitStatus.type}`}>
          {submitStatus.message}
        </div>
      )}

      {apiError && (
        <div className="api-error-message">
          <strong>Server Error:</strong> {apiError}
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
                value={f.reportDate || ''}
                onChange={handleReportDateChange}
                className={errors.reportDate ? 'error' : ''}
              />
              {errors.reportDate && <span className="field-error">{errors.reportDate}</span>}
            </div>

            <div className="form-group">
              <label>Client Name <span className="required">*</span></label>
              <input
                type="text"
                name="clientName"
                value={f.clientName || ''}
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
                value={f.siteName || ''}
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
                value={f.siteAddress || ''}
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
                value={f.sensorId || ''}
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
                value={f.modelNo || ''}
                onChange={handleInputChange}
                placeholder="Enter model number"
                className={errors.modelNo ? 'error' : ''}
              />
              {errors.modelNo && <span className="field-error">{errors.modelNo}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Serial No <span className="required">*</span></label>
              <input
                type="text"
                name="serialNo"
                value={f.serialNo || ''}
                onChange={handleInputChange}
                placeholder="Enter serial number"
                className={errors.serialNo ? 'error' : ''}
              />
              {errors.serialNo && <span className="field-error">{errors.serialNo}</span>}
            </div>

            <div className="form-group">
              <label>Calibration Date <span className="required">*</span></label>
              <input
                type="date"
                name="calibrationDate"
                value={f.calibrationDate || ''}
                onChange={handleCalibrationDateChange}
                className={errors.calibrationDate ? 'error' : ''}
              />
              {errors.calibrationDate && <span className="field-error">{errors.calibrationDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Calibration Due Date</label>
              <input
                type="date"
                name="calibrationDueDate"
                value={f.calibrationDueDate || ''}
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
                value={f.masterRefInstrument?.refSerialNo || ''}
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
                value={f.masterRefInstrument?.calibrationCertificateNo || ''}
                onChange={handleInputChange}
                placeholder="Enter certificate number"
                className={errors['masterRefInstrument.calibrationCertificateNo'] ? 'error' : ''}
              />
              {errors['masterRefInstrument.calibrationCertificateNo'] && <span className="field-error">{errors['masterRefInstrument.calibrationCertificateNo']}</span>}
            </div>

            <div className="form-group">
              <label>Certificate Validity <span className="required">*</span></label>
              <input
                type="date"
                name="masterRefInstrument.certificateValidity"
                value={f.masterRefInstrument?.certificateValidity || ''}
                onChange={handleInputChange}
                className={errors['masterRefInstrument.certificateValidity'] ? 'error' : ''}
              />
              {errors['masterRefInstrument.certificateValidity'] && <span className="field-error">{errors['masterRefInstrument.certificateValidity']}</span>}
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Auto-set to 90 days from calibration date
              </small>
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
                  value={f.readingBeforeCalibration?.pm25Value || ''}
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
                  value={f.readingBeforeCalibration?.pm10Value || ''}
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
                  value={f.readingBeforeCalibration?.temp || ''}
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
                  value={f.readingBeforeCalibration?.humidity || ''}
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
                  value={f.readingAfterCalibration?.pm25Value || ''}
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
                  value={f.readingAfterCalibration?.pm10Value || ''}
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
                  value={f.readingAfterCalibration?.temp || ''}
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
                  value={f.readingAfterCalibration?.humidity || ''}
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
                    checked={f.calibrationSummary?.[item.key] || false}
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
              value={f.remarks || ''}
              onChange={handleInputChange}
              placeholder="Enter any additional remarks..."
              rows="3"
            />
          </div>
        </div>

        {/* Declaration Section */}
        <div className="form-section declaration">
          <h3>Declaration</h3>
          <div className="form-group">
            <label>Declaration Statement</label>
            <textarea
              name="declaration"
              value={f.declaration || DEFAULT_DECLARATION}
              onChange={handleInputChange}
              rows="4"
              style={{ backgroundColor: '#f9fafb' }}
            />
            <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
              Default declaration is automatically included
            </small>
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
                value={f.engineerDetails?.engineerName || ''}
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
                value={f.engineerDetails?.signature || ''}
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
                value={f.engineerDetails?.date || ''}
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