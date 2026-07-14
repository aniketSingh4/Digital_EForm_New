// src/utils/calibrationReportValidators.js

import { format, addDays, parseISO } from 'date-fns';

export const validateCalibrationReport = (formData) => {
  const errors = {};

  // Debug: Log what we're validating
  console.log('🔍 Validating form data:', formData);

  // Report Header Validations
  if (!formData.reportDate) {
    errors.reportDate = 'Report Date is required';
  }

  if (!formData.clientName?.trim()) {
    errors.clientName = 'Client Name is required';
  }

  if (!formData.siteName?.trim()) {
    errors.siteName = 'Site Name is required';
  }

  if (!formData.siteAddress?.trim()) {
    errors.siteAddress = 'Site Address is required';
  }

  if (!formData.sensorId?.trim()) {
    errors.sensorId = 'Sensor ID is required';
  }

  if (!formData.modelNo?.trim()) {
    errors.modelNo = 'Model No is required';
  }

  if (!formData.calibrationDate) {
    errors.calibrationDate = 'Calibration Date is required';
  }

  // Master Reference Instrument Validations
  if (!formData.masterRefInstrument?.refSerialNo?.trim()) {
    errors['masterRefInstrument.refSerialNo'] = 'Reference Serial No is required';
  }

  if (!formData.masterRefInstrument?.calibrationCertificateNo?.trim()) {
    errors['masterRefInstrument.calibrationCertificateNo'] = 'Calibration Certificate No is required';
  }

  if (!formData.masterRefInstrument?.certificateValidity?.trim()) {
    errors['masterRefInstrument.certificateValidity'] = 'Certificate Validity is required';
  }

  // Reading Before Calibration Validations
  if (!formData.readingBeforeCalibration?.pm25Value && formData.readingBeforeCalibration?.pm25Value !== 0) {
    errors['readingBeforeCalibration.pm25Value'] = 'PM2.5 Value is required';
  } else if (isNaN(Number(formData.readingBeforeCalibration?.pm25Value))) {
    errors['readingBeforeCalibration.pm25Value'] = 'PM2.5 Value must be a number';
  }

  if (!formData.readingBeforeCalibration?.pm10Value && formData.readingBeforeCalibration?.pm10Value !== 0) {
    errors['readingBeforeCalibration.pm10Value'] = 'PM10 Value is required';
  } else if (isNaN(Number(formData.readingBeforeCalibration?.pm10Value))) {
    errors['readingBeforeCalibration.pm10Value'] = 'PM10 Value must be a number';
  }

  if (!formData.readingBeforeCalibration?.temp && formData.readingBeforeCalibration?.temp !== 0) {
    errors['readingBeforeCalibration.temp'] = 'Temperature is required';
  } else if (isNaN(Number(formData.readingBeforeCalibration?.temp))) {
    errors['readingBeforeCalibration.temp'] = 'Temperature must be a number';
  }

  if (!formData.readingBeforeCalibration?.humidity && formData.readingBeforeCalibration?.humidity !== 0) {
    errors['readingBeforeCalibration.humidity'] = 'Humidity is required';
  } else if (isNaN(Number(formData.readingBeforeCalibration?.humidity))) {
    errors['readingBeforeCalibration.humidity'] = 'Humidity must be a number';
  }

  // Reading After Calibration Validations
  if (!formData.readingAfterCalibration?.pm25Value && formData.readingAfterCalibration?.pm25Value !== 0) {
    errors['readingAfterCalibration.pm25Value'] = 'PM2.5 Value is required';
  } else if (isNaN(Number(formData.readingAfterCalibration?.pm25Value))) {
    errors['readingAfterCalibration.pm25Value'] = 'PM2.5 Value must be a number';
  }

  if (!formData.readingAfterCalibration?.pm10Value && formData.readingAfterCalibration?.pm10Value !== 0) {
    errors['readingAfterCalibration.pm10Value'] = 'PM10 Value is required';
  } else if (isNaN(Number(formData.readingAfterCalibration?.pm10Value))) {
    errors['readingAfterCalibration.pm10Value'] = 'PM10 Value must be a number';
  }

  if (!formData.readingAfterCalibration?.temp && formData.readingAfterCalibration?.temp !== 0) {
    errors['readingAfterCalibration.temp'] = 'Temperature is required';
  } else if (isNaN(Number(formData.readingAfterCalibration?.temp))) {
    errors['readingAfterCalibration.temp'] = 'Temperature must be a number';
  }

  if (!formData.readingAfterCalibration?.humidity && formData.readingAfterCalibration?.humidity !== 0) {
    errors['readingAfterCalibration.humidity'] = 'Humidity is required';
  } else if (isNaN(Number(formData.readingAfterCalibration?.humidity))) {
    errors['readingAfterCalibration.humidity'] = 'Humidity must be a number';
  }

  // Engineer Details Validations
  if (!formData.engineerDetails?.engineerName?.trim()) {
    errors['engineerDetails.engineerName'] = 'Engineer Name is required';
  }

  if (!formData.engineerDetails?.signature?.trim()) {
    errors['engineerDetails.signature'] = 'Signature is required';
  }

  if (!formData.engineerDetails?.date) {
    errors['engineerDetails.date'] = 'Date is required';
  }

  // Debug: Log errors found
  console.log('🔍 Validation errors found:', errors);
  console.log('🔍 Number of errors:', Object.keys(errors).length);

  // ✅ FIX: Return an object with isValid and errors properties
  const isValid = Object.keys(errors).length === 0;
  console.log('🔍 Is valid?', isValid);

  return {
    isValid: isValid,
    errors: errors
  };
};

export const calculateCalibrationDueDate = (calibrationDate) => {
  if (!calibrationDate) return null;
  const date = new Date(calibrationDate);
  return addDays(date, 90);
};

export const formatCalibrationDate = (date) => {
  if (!date) return '';
  try {
    return format(new Date(date), 'yyyy-MM-dd');
  } catch {
    return '';
  }
};