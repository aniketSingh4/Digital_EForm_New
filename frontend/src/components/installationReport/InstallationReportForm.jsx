import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import { FaImage, FaUpload, FaTrash } from 'react-icons/fa';
import './InstallationReportForm.css';
import notificationService from '../../services/notificationService';
import { getAuthHeaders } from '../../utils/roles';
import { invalidate } from '../../utils/cache';
import { env } from '../../config/env';

const API_BASE_URL = env.INSTALLATION_REPORTS_URL;

const authConfig = () => ({ headers: getAuthHeaders() });

const InstallationReportForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [generatedReportNo, setGeneratedReportNo] = useState('');
  const [showOthersText, setShowOthersText] = useState(false);
  
  // Image states
  const [imageFiles, setImageFiles] = useState([]);
  const [imageFileNames, setImageFileNames] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 16),
    installedBy: '',
    companyName: '',
    siteAddress: '',
    customerName: '',
    contactNo: '',
    emailId: '',
    equipmentDetails: [
      {
        modelNo: '',
        serialNo: '',
        quantity: 1,
      },
    ],
    machineUnboxing: false,
    sensorControllerInstalled: false,
    ledInstalled: false,
    wiringInternalConnectionDone: false,
    basicFunctionalityCheck: false,
    stablePowerSupply: false,
    stableInternetConnection: false,
    safetyMaintenanceExplained: false,
    workActivityOthers: '',
    remark: '',
    workConfirmation: false,
    customerConfirmationName: '',
    customerSignature: '',
    technicianConfirmationName: '',
    technicianSignature: '',
  });

  // Fetch report number on component mount
  useEffect(() => {
    generateReportNumber();
    if (isEditMode) {
      fetchReportData();
    }
  }, [isEditMode, id]);

  //Check if others text exists on load
  useEffect(() => {
    if (formData.workActivityOthers && formData.workActivityOthers.trim() !== '') {
      setShowOthersText(true);
    }
  }, [formData.workActivityOthers]);

  const generateReportNumber = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/generate-report-number`, authConfig());
      setGeneratedReportNo(response.data);
    } catch (error) {
      console.error('Error generating report number:', error);
      const month = new Date().toLocaleString('default', { month: 'short' });
      const year = new Date().getFullYear();
      const seq = Math.floor(Math.random() * 1000);
      setGeneratedReportNo(`FESPL_${month}_${year}_${String(seq).padStart(3, '0')}`);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/${id}`, authConfig());
      const data = response.data;
      const formattedDate = data.date ? data.date.slice(0, 16) : '';
      
      //Ensure equipmentDetails has only modelNo, serialNo, quantity
      const equipmentDetails = data.equipmentDetails && data.equipmentDetails.length > 0 
        ? data.equipmentDetails.map(item => ({
            modelNo: item.modelNo || item.modelNumber || '',
            serialNo: item.serialNo || item.serialNumber || '',
            quantity: item.quantity || 1,
          }))
        : [{ modelNo: '', serialNo: '', quantity: 1 }];
      
      setFormData({
        ...data,
        date: formattedDate,
        equipmentDetails: equipmentDetails,
      });
      
      //Set others text visibility
      if (data.workActivityOthers && data.workActivityOthers.trim() !== '') {
        setShowOthersText(true);
      }
      
      // Load existing images if any
      if (data.siteImages && data.siteImages.length > 0) {
        setExistingImages(data.siteImages);
      }
    } catch (error) {
      notificationService.error('Failed to fetch report data');
      navigate('/installation-reports');
    } finally {
      setLoading(false);
    }
  };

  // Image handlers
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (imageFiles.length + files.length > 10) {
      notificationService.warning('Maximum 10 images allowed');
      e.target.value = '';
      return;
    }

    setImageFiles(prev => [...prev, ...files]);
    setImageFileNames(prev => [...prev, ...files.map(file => file.name)]);
    e.target.value = '';
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImageFileNames(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllImages = () => {
    setImageFiles([]);
    setImageFileNames([]);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleEquipmentChange = (index, field, value) => {
    const updatedEquipment = [...formData.equipmentDetails];
    updatedEquipment[index] = {
      ...updatedEquipment[index],
      [field]: value,
    };
    setFormData({
      ...formData,
      equipmentDetails: updatedEquipment,
    });
  };

  const addEquipmentRow = () => {
    setFormData({
      ...formData,
      equipmentDetails: [
        ...formData.equipmentDetails,
        {
          modelNo: '',
          serialNo: '',
          quantity: 1,
        },
      ],
    });
  };

  const removeEquipmentRow = (index) => {
    if (formData.equipmentDetails.length > 1) {
      const updatedEquipment = formData.equipmentDetails.filter((_, i) => i !== index);
      setFormData({
        ...formData,
        equipmentDetails: updatedEquipment,
      });
    } else {
      notificationService.warning('At least one equipment detail is required');
    }
  };

  //Handle Others checkbox
  const handleOthersChange = (e) => {
    const checked = e.target.checked;
    setShowOthersText(checked);
    if (!checked) {
      setFormData({ ...formData, workActivityOthers: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerName || !formData.installedBy || !formData.companyName) {
      notificationService.error('Please fill in all required fields');
      return;
    }

    // Validate equipment details
    for (const equipment of formData.equipmentDetails) {
      if (!equipment.modelNo || !equipment.serialNo) {
        notificationService.error('Please fill in all equipment details (Model No and Serial No are required)');
        return;
      }
    }

    try {
      setLoading(true);
      setUploadingImages(true);

      const submitData = {
        ...formData,
        workConfirmation: formData.workConfirmation === true,
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_BASE_URL}/${id}`, submitData, authConfig());
        notificationService.reportUpdated('Installation & Commissioning Report', {
          id: response.data?.id || id,
          reportType: 'Installation & Commissioning Report',
          reportName: response.data?.reportNo || generatedReportNo,
          customerName: formData.customerName || formData.companyName,
          location: formData.siteAddress,
          createdBy: localStorage.getItem('userName') || ''
        });
      } else {
        response = await axios.post(API_BASE_URL, submitData, authConfig());
        notificationService.reportCreated('Installation & Commissioning Report', {
          id: response.data?.id,
          reportType: 'Installation & Commissioning Report',
          reportName: response.data?.reportNo || generatedReportNo,
          customerName: formData.customerName || formData.companyName,
          location: formData.siteAddress,
          createdBy: localStorage.getItem('userName') || ''
        });
      }

      const reportId = response.data.id;
      invalidate('installation_reports');
      localStorage.removeItem('dashboard_data');
      localStorage.removeItem('dashboard_timestamp');

      // Upload images after report is created/updated
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach(file => {
          formData.append('files', file);
        });
        formData.append('isFinal', 'false');
        formData.append('description', 'Site installation images');

        await axios.post(`${API_BASE_URL}/images/upload/${reportId}`, formData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
          },
        });
        
        notificationService.success(`${imageFiles.length} image(s) uploaded successfully!`);
      }

      navigate('/installation-reports');
    } catch (error) {
      console.error('Error saving report:', error);
      notificationService.error(error.response?.data?.message || 'Error saving report');
    } finally {
      setLoading(false);
      setUploadingImages(false);
    }
  };

  const handleCancel = () => {
    navigate('/installation-reports');
  };

  if (loading && isEditMode) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="report-form-container">
      <div className="form-header">
        <h2>{isEditMode ? 'Edit Installation Report' : 'New Installation Report'}</h2>
        <div className="report-number">
          <strong>Report No:</strong> {generatedReportNo}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="report-form">
        <input type="hidden" name="reportNo" value={generatedReportNo} />

        {/* Installation Details */}
        <div className="form-section">
          <h3>Installation Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Date & Time *</label>
              <input
                type="datetime-local"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label>Installed By (Technician Name) *</label>
              <input
                type="text"
                name="installedBy"
                value={formData.installedBy}
                onChange={handleInputChange}
                placeholder="Enter technician name"
                required
              />
            </div>
          </div>
        </div>

        {/* Company and Customer Details */}
        <div className="form-section">
          <h3>Company & Customer Details</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="Enter company name"
                required
              />
            </div>
            <div className="form-group">
              <label>Site Address *</label>
              <input
                type="text"
                name="siteAddress"
                value={formData.siteAddress}
                onChange={handleInputChange}
                placeholder="Enter site address"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-group">
              <label>Contact Number *</label>
              <input
                type="tel"
                name="contactNo"
                value={formData.contactNo}
                onChange={handleInputChange}
                placeholder="Enter contact number"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group full-width">
              <label>Email ID *</label>
              <input
                type="email"
                name="emailId"
                value={formData.emailId}
                onChange={handleInputChange}
                placeholder="Enter email address"
                required
              />
            </div>
          </div>
        </div>

        {/*Equipment Details - Only Model No, Serial No, Quantity */}
        <div className="form-section">
          <div className="section-header">
            <h3>Equipment Details</h3>
            <button
              type="button"
              className="btn-add-equipment"
              onClick={addEquipmentRow}
            >
              + Add Equipment
            </button>
          </div>
          
          {formData.equipmentDetails.map((equipment, index) => (
            <div key={index} className="equipment-row">
              <div className="equipment-row-header">
                <span className="equipment-number">Equipment #{index + 1}</span>
                {formData.equipmentDetails.length > 1 && (
                  <button
                    type="button"
                    className="btn-remove-equipment"
                    onClick={() => removeEquipmentRow(index)}
                  >
                    × Remove
                  </button>
                )}
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Model No *</label>
                  <input
                    type="text"
                    value={equipment.modelNo}
                    onChange={(e) =>
                      handleEquipmentChange(index, 'modelNo', e.target.value)
                    }
                    placeholder="Enter model number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Serial No *</label>
                  <input
                    type="text"
                    value={equipment.serialNo}
                    onChange={(e) =>
                      handleEquipmentChange(index, 'serialNo', e.target.value)
                    }
                    placeholder="Enter serial number"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    value={equipment.quantity}
                    onChange={(e) =>
                      handleEquipmentChange(index, 'quantity', parseInt(e.target.value) || 1)
                    }
                    min="1"
                    required
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Work Activity */}
        <div className="form-section">
          <h3>Work Activity</h3>
          <div className="checkbox-grid">
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="machineUnboxing"
                  checked={formData.machineUnboxing}
                  onChange={handleInputChange}
                />
                Machine Unboxing
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="sensorControllerInstalled"
                  checked={formData.sensorControllerInstalled}
                  onChange={handleInputChange}
                />
                Sensor & Controller Installed
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="ledInstalled"
                  checked={formData.ledInstalled}
                  onChange={handleInputChange}
                />
                LED Installed
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="wiringInternalConnectionDone"
                  checked={formData.wiringInternalConnectionDone}
                  onChange={handleInputChange}
                />
                Wiring, Internal Connection and Configuration Done
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="basicFunctionalityCheck"
                  checked={formData.basicFunctionalityCheck}
                  onChange={handleInputChange}
                />
                Basic Functionality Check
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="stablePowerSupply"
                  checked={formData.stablePowerSupply}
                  onChange={handleInputChange}
                />
                Stable Power Supply Provided by client
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="stableInternetConnection"
                  checked={formData.stableInternetConnection}
                  onChange={handleInputChange}
                />
                Stable Internet Connection provided by client
              </label>
            </div>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="safetyMaintenanceExplained"
                  checked={formData.safetyMaintenanceExplained}
                  onChange={handleInputChange}
                />
                Safety and Maintenance Instruction Explained
              </label>
            </div>
            
            {/*Others Work Activity - Text box appears only when checked */}
            <div className="checkbox-item checkbox-others">
              <label>
                <input
                  type="checkbox"
                  checked={showOthersText}
                  onChange={handleOthersChange}
                />
                Others
              </label>
              {showOthersText && (
                <div className="others-text-area">
                  <textarea
                    placeholder="Please specify other work activities..."
                    value={formData.workActivityOthers || ''}
                    onChange={(e) => setFormData({ ...formData, workActivityOthers: e.target.value })}
                    rows="2"
                    className="others-text-input"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Remark */}
        <div className="form-section">
          <h3>Remark</h3>
          <div className="form-group full-width">
            <textarea
              name="remark"
              value={formData.remark}
              onChange={handleInputChange}
              placeholder="Enter any remarks or additional information..."
              rows="4"
            />
          </div>
        </div>

        {/* Site Images Section */}
        <div className="form-section">
          <h3>Site Images <span className="optional">(Optional)</span></h3>
          
          {/* Existing Images */}
          {existingImages.length > 0 && (
            <div className="existing-images">
              <span className="existing-images-label">Existing Images:</span>
              <div className="image-file-list">
                {existingImages.map((image, index) => (
                  <div key={image.id || index} className="file-item existing">
                    <span className="file-name">
                      <FaImage className="file-item-icon" />
                      {image.imageName || 'Image'}
                    </span>
                    <span className="file-status">✓ Uploaded</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Image Upload */}
          <div className="image-upload-wrapper">
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

            {imageFileNames.length > 0 && (
              <div className="file-list-container">
                <div className="file-list-header">
                  <span className="file-list-title">
                    <FaImage className="file-icon" />
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
                        <FaImage className="file-item-icon" />
                        <span className="file-text">{fileName}</span>
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

        {/* Work Confirmation */}
        <div className="form-section confirmation-section">
          <h3>Work Confirmation</h3>
          <div className="confirmation-text">
            <p>
              I hereby confirm that the above-mentioned equipment have been installed successfully 
              and demonstration has been provided.
            </p>
            <div className="checkbox-item">
              <label>
                <input
                  type="checkbox"
                  name="workConfirmation"
                  checked={formData.workConfirmation}
                  onChange={handleInputChange}
                />
                I confirm the above statement
              </label>
            </div>
          </div>
        </div>

        {/* Customer & Technician Confirmation */}
        <div className="form-section">
          <h3>Customer & Technician Confirmation</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Customer Name *</label>
              <input
                type="text"
                name="customerConfirmationName"
                value={formData.customerConfirmationName}
                onChange={handleInputChange}
                placeholder="Enter customer name"
                required
              />
            </div>
            <div className="form-group">
              <label>Customer Signature</label>
              <input
                type="text"
                name="customerSignature"
                value={formData.customerSignature}
                onChange={handleInputChange}
                placeholder="Customer signature"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Technician Name *</label>
              <input
                type="text"
                name="technicianConfirmationName"
                value={formData.technicianConfirmationName}
                onChange={handleInputChange}
                placeholder="Enter technician name"
                required
              />
            </div>
            <div className="form-group">
              <label>Technician Signature</label>
              <input
                type="text"
                name="technicianSignature"
                value={formData.technicianSignature}
                onChange={handleInputChange}
                placeholder="Technician signature"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? (uploadingImages ? 'Uploading Images...' : 'Saving...') : isEditMode ? 'Update Report' : 'Save Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstallationReportForm;