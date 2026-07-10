import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import './InstallationReportForm.css';

const API_BASE_URL = 'http://localhost:8086/api/reports';

const InstallationReportForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [generatedReportNo, setGeneratedReportNo] = useState('');

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

  const generateReportNumber = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/generate-report-number`);
      setGeneratedReportNo(response.data);
    } catch (error) {
      console.error('Error generating report number:', error);
      // Fallback: generate locally
      const month = new Date().toLocaleString('default', { month: 'short' });
      const year = new Date().getFullYear();
      const seq = Math.floor(Math.random() * 1000);
      setGeneratedReportNo(`FESPL_${month}_${year}_${String(seq).padStart(3, '0')}`);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/${id}`);
      const data = response.data;
      // Format date for input
      const formattedDate = data.date ? data.date.slice(0, 16) : '';
      setFormData({
        ...data,
        date: formattedDate,
      });
    } catch (error) {
      toast.error('Error fetching report data');
      navigate('/reports');
    } finally {
      setLoading(false);
    }
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
      toast.warning('At least one equipment detail is required');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.customerName || !formData.installedBy || !formData.companyName) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const submitData = {
        ...formData,
        workConfirmation: formData.workConfirmation === true,
      };

      let response;
      if (isEditMode) {
        response = await axios.put(`${API_BASE_URL}/${id}`, submitData);
        toast.success('Report updated successfully!');
      } else {
        response = await axios.post(API_BASE_URL, submitData);
        toast.success('Report created successfully!');
      }

      navigate('/reports');
    } catch (error) {
      console.error('Error saving report:', error);
      toast.error(error.response?.data?.message || 'Error saving report');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/reports');
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

        {/* Equipment Details */}
        <div className="form-section">
          <h3>Equipment Details</h3>
          {formData.equipmentDetails.map((equipment, index) => (
            <div key={index} className="equipment-row">
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
                <div className="form-group action-buttons">
                  {index === formData.equipmentDetails.length - 1 && (
                    <button
                      type="button"
                      className="btn-add"
                      onClick={addEquipmentRow}
                    >
                      +
                    </button>
                  )}
                  {formData.equipmentDetails.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => removeEquipmentRow(index)}
                    >
                      ×
                    </button>
                  )}
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
            {loading ? 'Saving...' : isEditMode ? 'Update Report' : 'Save Report'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default InstallationReportForm;