// src/components/CalibrationReportForm.jsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { validateCalibrationReport } from "../../utils/calibrationReportValidators";
import { calibrationReportService } from "../../services/CalibrationReportService";
import "./CalibrationReportForm.css";
import notificationService from "../../services/notificationService";


const CALIBRATION_SUMMARY_ITEMS = [
  { id: 1, fieldName: 'Calibration Successful', key: 'calibrationSuccessful' },
  { id: 2, fieldName: 'Calibration Adjustment Performed', key: 'calibrationAdjustmentPerformed' },
  { id: 3, fieldName: 'Sensor Within Acceptable Limits', key: 'sensorWithinAcceptableLimits' },
  { id: 4, fieldName: 'Sensor Requires Replacement', key: 'sensorRequiresReplacement' },
];

const DEFAULT_DECLARATION = `The calibration activity was carried out using a calibrated reference instrument traceable to applicable standards. The readings recorded above represent the observed values before and after calibration. Any observations and recommendations have been documented for necessary action.`;

const getTodayDate = () => new Date().toISOString().split('T')[0];
const getDatePlus90Days = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  d.setDate(d.getDate() + 90);
  return d.toISOString().split('T')[0];
};

//Generate unique ID with timestamp
const generateUniqueId = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10).replace(/-/g, '');
  const time = now.toTimeString().slice(0, 8).replace(/:/g, '');
  return `${date}${time}`;
};

//Generate Certificate No with sequential count - FESPL_CAL format
const generateCertificateNo = (count) => {
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sequence = String(count).padStart(4, '0');
  return `FESPL_CAL_${datePart}_${sequence}`;
};

//Helper function to generate model number
const generateModelNo = (sensorId) => {
  if (!sensorId) return '';
  return `FESPL_MN_${sensorId}`;
};

//Helper function to generate reference serial number (hidden)
const generateRefSerialNo = (sensorId) => {
  if (!sensorId) return '';
  return `FESPL_RSN_${sensorId}`;
};

//Guaranteed complete default object
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
    certificateValidity: getDatePlus90Days(getTodayDate()),
  },
  readingBeforeCalibration: {
    pm25Value: '',
    pm10Value: '',
    temp: '',
    humidity: '',
  },
  readingAfterCalibration: {
    pm25Value: '',
    pm10Value: '',
    temp: '',
    humidity: '',
  },
  calibrationSummary: {
    calibrationSuccessful: false,
    calibrationAdjustmentPerformed: false,
    sensorWithinAcceptableLimits: false,
    sensorRequiresReplacement: false,
  },
  remarks: '',
  declaration: DEFAULT_DECLARATION,
  engineerDetails: {
    engineerName: '',
    signature: '',
    date: getTodayDate(),
  },
};

const CalibrationReportForm = ({ onSuccess, onCancel, isEdit = false }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id || isEdit;

  const [formData, setFormData] = useState({ ...DEFAULT_FORM_DATA });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [reportCount, setReportCount] = useState(0);

  useEffect(() => {
    if (isEditMode && id) {
      fetchReportData();
    } else {
      fetchReportCount();
    }
  }, [id, isEditMode]);

  const fetchReportCount = async () => {
    try {
      const response = await calibrationReportService.getAllReports();
      if (Array.isArray(response)) {
        setReportCount(response.length);
        //console.log('📊 Current report count:', response.length);
      }
    } catch (error) {
      console.error('❌ Error fetching report count:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const data = await calibrationReportService.getReportById(id);
      if (data) {
        setFormData({
          ...DEFAULT_FORM_DATA,
          ...data,
          masterRefInstrument: { ...DEFAULT_FORM_DATA.masterRefInstrument, ...(data.masterRefInstrument || {}) },
          readingBeforeCalibration: { ...DEFAULT_FORM_DATA.readingBeforeCalibration, ...(data.readingBeforeCalibration || {}) },
          readingAfterCalibration: { ...DEFAULT_FORM_DATA.readingAfterCalibration, ...(data.readingAfterCalibration || {}) },
          calibrationSummary: { ...DEFAULT_FORM_DATA.calibrationSummary, ...(data.calibrationSummary || {}) },
          engineerDetails: { ...DEFAULT_FORM_DATA.engineerDetails, ...(data.engineerDetails || {}) },
        });
      } else {
        //toast.error('Report not found');
        notificationService.error('Report not found');
        navigate('/calibration-reports');
      }
    } catch (error) {
      console.error(error);
      //toast.error('Failed to load report');
      notificationService.error('Failed to load report');
      navigate('/calibration-reports');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const current = prev && typeof prev === 'object' ? prev : { ...DEFAULT_FORM_DATA };

      if (name === 'sensorId') {
        const newModelNo = generateModelNo(val);
        const newRefSerialNo = generateRefSerialNo(val);
        const newCount = reportCount + 1;
        //Generate Certificate No with FESPL_CAL format
        const newCertificateNo = generateCertificateNo(newCount);

        let updated = {
          ...current,
          sensorId: val,
          modelNo: newModelNo,
          serialNo: newCertificateNo,
          masterRefInstrument: {
            ...current.masterRefInstrument,
            refSerialNo: newRefSerialNo,
            calibrationCertificateNo: newCertificateNo,
          }
        };
        return updated;
      }

      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        return {
          ...current,
          [parent]: { ...current[parent], [child]: val },
        };
      } else {
        return {
          ...current,
          [name]: val,
        };
      }
    });

    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const handleSummaryChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      calibrationSummary: { ...prev.calibrationSummary, [key]: value },
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
        masterRefInstrument: { ...prev.masterRefInstrument, certificateValidity: dueDate },
      }));
    }
  };

  const handleReportDateChange = (e) => {
    setFormData(prev => ({ ...prev, reportDate: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);
    setApiError(null);

    if (!formData || typeof formData !== 'object') {
      setSubmitStatus({
        type: 'error',
        message: 'Form data is not initialized. Please refresh the page.'
      });
      setIsSubmitting(false);
      return;
    }

    const sensorId = formData.sensorId || '';
    const nextCount = reportCount + 1;
    //Generate Certificate No with FESPL_CAL format
    const certificateNo = formData.masterRefInstrument?.calibrationCertificateNo || generateCertificateNo(nextCount);

    const submitData = {
      reportDate: formData.reportDate || getTodayDate(),
      clientName: formData.clientName || '',
      siteName: formData.siteName || '',
      siteAddress: formData.siteAddress || '',
      sensorId: sensorId,
      modelNo: formData.modelNo || generateModelNo(sensorId),
      serialNo: certificateNo,
      calibrationDate: formData.calibrationDate || getTodayDate(),
      calibrationDueDate: formData.calibrationDueDate || getDatePlus90Days(getTodayDate()),
      masterRefInstrument: {
        refSerialNo: formData.masterRefInstrument?.refSerialNo || generateRefSerialNo(sensorId),
        calibrationCertificateNo: certificateNo,
        certificateValidity: formData.masterRefInstrument?.certificateValidity || getDatePlus90Days(getTodayDate()),
      },
      readingBeforeCalibration: {
        pm25Value: formData.readingBeforeCalibration?.pm25Value || '',
        pm10Value: formData.readingBeforeCalibration?.pm10Value || '',
        temp: formData.readingBeforeCalibration?.temp || '',
        humidity: formData.readingBeforeCalibration?.humidity || '',
      },
      readingAfterCalibration: {
        pm25Value: formData.readingAfterCalibration?.pm25Value || '',
        pm10Value: formData.readingAfterCalibration?.pm10Value || '',
        temp: formData.readingAfterCalibration?.temp || '',
        humidity: formData.readingAfterCalibration?.humidity || '',
      },
      calibrationSummary: {
        calibrationSuccessful: formData.calibrationSummary?.calibrationSuccessful || false,
        calibrationAdjustmentPerformed: formData.calibrationSummary?.calibrationAdjustmentPerformed || false,
        sensorWithinAcceptableLimits: formData.calibrationSummary?.sensorWithinAcceptableLimits || false,
        sensorRequiresReplacement: formData.calibrationSummary?.sensorRequiresReplacement || false,
      },
      remarks: formData.remarks || '',
      declaration: formData.declaration || DEFAULT_DECLARATION,
      engineerDetails: {
        engineerName: formData.engineerDetails?.engineerName || '',
        signature: formData.engineerDetails?.signature || '',
        date: formData.engineerDetails?.date || getTodayDate(),
      },
    };

    const validationResult = validateCalibrationReport(submitData);
    //console.log('Validation Result:', validationResult);

    if (!validationResult.isValid) {
      const errorMessages = validationResult.errors || {};
      //.log('Validation Errors:', errorMessages);
      setErrors(errorMessages);

      const errorList = Object.entries(errorMessages)
        .map(([field, message]) => `${field}: ${message}`)
        .join('; ');

      setSubmitStatus({
        type: 'error',
        message: `Please fix the following errors: ${errorList}`
      });
      setIsSubmitting(false);
      return;
    }

    try {
      let response;

      if (isEditMode && id) {
        //console.log('Updating report with ID:', id);
        response = await calibrationReportService.updateReport(id, submitData);
        notificationService.success('Report updated successfully!');
      } else {
        //console.log('Creating new report...');
        response = await calibrationReportService.createReport(submitData);
        notificationService.success('Report created successfully!');
        setReportCount(prev => prev + 1);
      }

      //console.log('API Response:', response);

      setSubmitStatus({
        type: 'success',
        message: isEditMode ? 'Report updated successfully!' : 'Report created successfully!'
      });

      if (!isEditMode) {
        setTimeout(() => {
          setFormData({ ...DEFAULT_FORM_DATA });
          fetchReportCount();
        }, 2000);
      }

      setTimeout(() => {
        if (onSuccess) {
          onSuccess(response);
        } else {
          navigate('/calibration-reports');
        }
      }, 1500);

    } catch (error) {
      console.error('Submit error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save report';
      setApiError(errorMessage);
      setSubmitStatus({
        type: 'error',
        message: errorMessage
      });
      notificationService.error(`${errorMessage}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const safe = (formData && typeof formData === 'object') ? formData : { ...DEFAULT_FORM_DATA };

  const reportDate = safe.reportDate || getTodayDate();
  const clientName = safe.clientName || '';
  const siteName = safe.siteName || '';
  const siteAddress = safe.siteAddress || '';
  const sensorId = safe.sensorId || '';
  const modelNo = safe.modelNo || generateModelNo(sensorId);
  const nextCount = reportCount + 1;
  //Generate certificate no with FESPL_CAL format
  const certificateNo = safe.masterRefInstrument?.calibrationCertificateNo || generateCertificateNo(nextCount);
  const calibrationDate = safe.calibrationDate || getTodayDate();
  const calibrationDueDate = safe.calibrationDueDate || getDatePlus90Days(getTodayDate());
  const masterRef = safe.masterRefInstrument || {
    refSerialNo: generateRefSerialNo(sensorId),
    calibrationCertificateNo: certificateNo,
    certificateValidity: getDatePlus90Days(getTodayDate())
  };
  const readingBefore = safe.readingBeforeCalibration || {
    pm25Value: '',
    pm10Value: '',
    temp: '',
    humidity: ''
  };
  const readingAfter = safe.readingAfterCalibration || {
    pm25Value: '',
    pm10Value: '',
    temp: '',
    humidity: ''
  };
  const calibrationSummary = safe.calibrationSummary || {
    calibrationSuccessful: false,
    calibrationAdjustmentPerformed: false,
    sensorWithinAcceptableLimits: false,
    sensorRequiresReplacement: false
  };
  const remarks = safe.remarks || '';
  const declaration = safe.declaration || DEFAULT_DECLARATION;
  const engineer = safe.engineerDetails || {
    engineerName: '',
    signature: '',
    date: getTodayDate()
  };

  return (
    <div className="calibration-report-form">
      <h2>{isEditMode ? 'Edit Calibration Report' : 'New Calibration Report'}</h2>

      {submitStatus && <div className={`status-message ${submitStatus.type}`}>{submitStatus.message}</div>}
      {apiError && <div className="api-error-message"><strong>Server Error:</strong> {apiError}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Details */}
        <div className="form-section">
          <h3>Basic Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Report Date <span className="required">*</span></label>
              <input
                type="date"
                name="reportDate"
                value={reportDate}
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
                value={clientName}
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
                value={siteName}
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
                value={siteAddress}
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
                value={sensorId}
                onChange={handleInputChange}
                placeholder="Enter sensor ID"
                className={errors.sensorId ? 'error' : ''}
              />
              {errors.sensorId && <span className="field-error">{errors.sensorId}</span>}
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Auto-generates Model No, Certificate No & Serial No
              </small>
            </div>
            <div className="form-group">
              <label>Calibration Date <span className="required">*</span></label>
              <input
                type="date"
                name="calibrationDate"
                value={calibrationDate}
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
                value={calibrationDueDate}
                readOnly
                className="readonly"
              />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Auto-calculated: 90 days after calibration date
              </small>
            </div>
          </div>
        </div>

        {/* Certificate Details */}
        <div className="form-section">
          <h3>Certificate Details</h3>
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>Calibration Certificate No <span className="required">*</span></label>
              <input
                type="text"
                name="masterRefInstrument.calibrationCertificateNo"
                value={masterRef.calibrationCertificateNo}
                readOnly
                className="readonly"
                style={{ backgroundColor: '#f3f4f6' }}
              />
              <small style={{ color: '#6b7280', fontSize: '12px', display: 'block', marginTop: '4px' }}>
                Format: FESPL_CAL_YYYYMMDD_XXXX (Auto-generated)
              </small>
              {errors['masterRefInstrument.calibrationCertificateNo'] && <span className="field-error">{errors['masterRefInstrument.calibrationCertificateNo']}</span>}
            </div>
            <div className="form-group">
              <label>Certificate Validity <span className="required">*</span></label>
              <input
                type="date"
                name="masterRefInstrument.certificateValidity"
                value={masterRef.certificateValidity}
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
                  value={readingBefore.pm25Value}
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
                  value={readingBefore.pm10Value}
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
                  value={readingBefore.temp}
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
                  value={readingBefore.humidity}
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
                  value={readingAfter.pm25Value}
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
                  value={readingAfter.pm10Value}
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
                  value={readingAfter.temp}
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
                  value={readingAfter.humidity}
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
                    checked={calibrationSummary[item.key] || false}
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
              value={remarks}
              onChange={handleInputChange}
              placeholder="Enter any additional remarks..."
              rows="3"
            />
          </div>
        </div>

        {/* Declaration */}
        <div className="form-section declaration">
          <h3>Declaration</h3>
          <div className="form-group">
            <label>Declaration Statement</label>
            <textarea
              name="declaration"
              value={declaration}
              onChange={handleInputChange}
              rows="4"
              style={{ backgroundColor: '#f9fafb' }}
            />
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
                value={engineer.engineerName}
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
                value={engineer.signature}
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
                value={engineer.date}
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
            {isSubmitting ? 'Saving...' : isEditMode ? 'Update Report' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CalibrationReportForm;