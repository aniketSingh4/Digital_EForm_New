import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaSpinner } from 'react-icons/fa';
import ProgressBar from "../components/pm/ProgressBar";
import Step1BasicInfo from "../components/pm/Step1BasicInfo";
import Step2Inspection from "../components/pm/Step2Inspection";
import Step3Technical from "../components/pm/Step3Technical";
import Step4Summary from "../components/pm/Step4Summary";
import Step5SignOff from "../components/pm/Step5SignOff";
import Step6Review from "../components/pm/Step6Review";
import "../assets/PMWizard.css";
import "../assets/Step6Reviews.css";
import notificationService from '../services/notificationService';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function PMReportWizard() {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = !!id;

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        report: {},
        inspection: {},
        technical: {},
        summary: {},
        signoff: {},
        review: {},
        checklists: []
    });

    // Store original immutable fields
    const [originalImmutableFields, setOriginalImmutableFields] = useState({
        serviceReportNo: '',
        serviceVisitNo: '',
        sensorId: ''
    });

    // Fetch data for edit mode
    useEffect(() => {
        if (isEditMode && id) {
            fetchReportData();
        }
    }, [isEditMode, id]);

    // NEW: Function to map API checklists to form structure
    const mapChecklistsToForm = (apiChecklists) => {
        if (!apiChecklists || !Array.isArray(apiChecklists)) {
            return [];
        }

        // Map each checklist item to the format expected by the form
        return apiChecklists.map(item => ({
            category: item.category || 'PHYSICAL_INSPECTION',
            itemName: item.itemName || '',
            status: item.status || 'NO',
            remark: item.remark || ''
        }));
    };

    // NEW: Function to populate inspection and technical data from checklists
    const populateStepDataFromChecklists = (checklists) => {
        const inspection = {
            physicalInspection: {},
            powerSupply: {}
        };
        const technical = {
            sensorHealth: {},
            communication: {},
            calibration: {},
            cleaning: {}
        };

        if (!checklists || !Array.isArray(checklists)) {
            return { inspection, technical };
        }

        checklists.forEach(item => {
            const category = item.category;
            const itemName = item.itemName;
            const status = item.status || 'NO';
            const remark = item.remark || '';

            // Map to inspection data
            if (category === 'PHYSICAL_INSPECTION') {
                inspection.physicalInspection[itemName] = { status, remark };
            } else if (category === 'POWER_SUPPLY') {
                inspection.powerSupply[itemName] = { status, remark };
            }
            // Map to technical data
            else if (category === 'SENSOR_HEALTH') {
                technical.sensorHealth[itemName] = { status, remark };
            } else if (category === 'COMMUNICATION') {
                technical.communication[itemName] = { status, remark };
            } else if (category === 'CALIBRATION_PERFORMANCE_VERIFICATION') {
                technical.calibration[itemName] = { status, remark };
            } else if (category === 'CLEANING_ACTIVITY') {
                technical.cleaning[itemName] = { status, remark };
            }
        });

        return { inspection, technical };
    };

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`https://pm-reports.onrender.com/api/pm_reports/${id}`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const data = await response.json();
            
            
            // Store original immutable fields
            setOriginalImmutableFields({
                serviceReportNo: data.serviceReportNo || '',
                serviceVisitNo: data.serviceVisitNo || '',
                sensorId: data.sensorId || ''
            });

            // Transform checklists for the form
            const transformedChecklists = mapChecklistsToForm(data.checklists);
            console.log('📋 Transformed checklists for form:', transformedChecklists);

            // Populate inspection and technical data from checklists
            const { inspection, technical } = populateStepDataFromChecklists(data.checklists);
            console.log('Populated inspection:', inspection);
            console.log('Populated technical:', technical);

            // Populate form data with fetched data
            setFormData({
                report: {
                    serviceReportNo: data.serviceReportNo || '',
                    serviceVisitNo: data.serviceVisitNo || '',
                    clientName: data.clientName || '',
                    siteName: data.siteName || '',
                    sensorId: data.sensorId || '',
                    pmVisitDate: data.pmVisitDate ? data.pmVisitDate.split('T')[0] : '',
                    engineerName: data.engineerName || '',
                },
                inspection: inspection,
                technical: technical,
                summary: {
                    observation: data.observation || '',
                    recommendation: data.recommendation || '',
                    pmStatus: data.summary?.preventiveMaintenanceStatus || data.preventiveMaintenanceStatus || 'SATISFACTORY',
                    siteCondition: data.summary?.siteConditionAfterPm || data.siteConditionAfterPm || 'SYSTEM_OPERATIONAL'
                },
                signoff: {
                    clientRepresentativeName: data.signOff?.clientRepresentativeName || '',
                    designation: data.signOff?.designation || '',
                    clientSignature: data.signOff?.clientSignature || '',
                    clientDate: data.signOff?.clientDate || '',
                    serviceEngineerName: data.signOff?.serviceEngineerName || '',
                    serviceEngineerSignature: data.signOff?.serviceEngineerSignature || '',
                    serviceEngineerDate: data.signOff?.serviceEngineerDate || ''
                },
                review: {},
                checklists: transformedChecklists // Store checklists directly
            });

            console.log('Form data populated successfully');
            console.log('Form checklists:', transformedChecklists.length);
            notificationService.success('Report data loaded successfully', { type: 'REPORT_VIEWED', identifier: id, reportName: data.serviceReportNo || '' });

        } catch (error) {
            console.error('Error fetching report:', error);
            //toast.error('Failed to load report data');
            notificationService.error('Failed to load PM Report');
            navigate('/pm-reports/view-all');
        } finally {
            setLoading(false);
        }
    };

    const nextStep = () => {
        if (step < 6) {
            setStep(step + 1);
        }
    };

    const prevStep = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            
            const reportData = formData.report || {};
            let pmVisitDate = reportData.pmVisitDate;
            if (!pmVisitDate) {
                const today = new Date().toISOString().split('T')[0];
                pmVisitDate = today;
            }

            // Validate required fields
            if (!reportData.clientName?.trim()) {
                throw new Error("Client Name is required");
            }
            if (!reportData.siteName?.trim()) {
                throw new Error("Site Name is required");
            }
            if (!pmVisitDate) {
                throw new Error("PM Visit Date is required");
            }

            // For new reports, validate these fields
            if (!isEditMode) {
                if (!reportData.serviceReportNo?.trim()) {
                    throw new Error("Service Report No is required");
                }
                if (!reportData.sensorId?.trim()) {
                    throw new Error("Sensor ID is required");
                }
            }

            // Build payload with proper structure
            let payload = {
                clientName: reportData.clientName.trim(),
                siteName: reportData.siteName.trim(),
                pmVisitDate: pmVisitDate,
                engineerName: reportData.engineerName || "",
                observation: formData.summary?.observation || "",
                recommendation: formData.summary?.recommendation || "",
                preventiveMaintenanceStatus: formData.summary?.pmStatus || "SATISFACTORY",
                siteConditionAfterPm: formData.summary?.siteCondition || "SYSTEM_OPERATIONAL",
                checklists: formData.checklists || [],
                signOff: {
                    clientRepresentativeName: formData.signoff?.clientRepresentativeName || "",
                    designation: formData.signoff?.designation || "",
                    clientSignature: formData.signoff?.clientSignature || formData.signoff?.clientRepresentativeName || "",
                    clientDate: formData.signoff?.clientDate || new Date().toISOString().split('T')[0],
                    serviceEngineerName: formData.signoff?.serviceEngineerName || "",
                    serviceEngineerSignature: formData.signoff?.serviceEngineerSignature || formData.signoff?.serviceEngineerName || "",
                    serviceEngineerDate: formData.signoff?.serviceEngineerDate || new Date().toISOString().split('T')[0]
                }
            };

            // For edit mode, include immutable fields with original values
            if (isEditMode) {
                payload = {
                    ...payload,
                    serviceReportNo: originalImmutableFields.serviceReportNo || reportData.serviceReportNo?.trim() || "",
                    serviceVisitNo: originalImmutableFields.serviceVisitNo || reportData.serviceVisitNo?.trim() || "",
                    sensorId: originalImmutableFields.sensorId || reportData.sensorId?.trim() || "",
                };
                
                console.log('🔒 Edit Mode - Sending immutable fields with original values:', {
                    serviceReportNo: payload.serviceReportNo,
                    serviceVisitNo: payload.serviceVisitNo,
                    sensorId: payload.sensorId
                });
            } else {
                // For new reports, include all fields
                payload = {
                    ...payload,
                    serviceReportNo: reportData.serviceReportNo.trim(),
                    serviceVisitNo: reportData.serviceVisitNo || "",
                    sensorId: reportData.sensorId.trim(),
                };
            }

            console.log('Final Payload:', payload);
            console.log('Checklists in payload:', payload.checklists?.length || 0);

            let response;
            let url = 'http://localhost:8090/api/pm_reports';
            let method = 'POST';

            if (isEditMode && id) {
                url = `http://localhost:8090/api/pm_reports/${id}`;
                method = 'PUT';
            }

            response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                let errorMessage = `Failed to ${isEditMode ? 'update' : 'save'} report: ${response.status}`;
                try {
                    const errorData = await response.text();
                    if (errorData) {
                        errorMessage = errorData;
                    }
                } catch (e) {
                    // Ignore parsing error
                }
                throw new Error(errorMessage);
            }

            const result = await response.json();
            
            if (isEditMode) {
                notificationService.reportUpdated('PM Report', id);
            } else {
                notificationService.reportCreated('PM Report', result.id);
            }

            // Navigate back to reports list
            setTimeout(() => {
                navigate('/pm-reports/view-all');
            }, 1500);

        } catch (error) {
            console.error("Error submitting report:", error);
            
            let errorMessage = error.message || "An unexpected error occurred";
            
            // Handle specific error cases
            if (errorMessage.includes('409') || errorMessage.includes('already exists')) {
                errorMessage = 'A report with this Service Report Number already exists. Please use a unique number.';
            } else if (errorMessage.includes('400')) {
                errorMessage = 'Invalid data provided. Please check all fields.';
            } else if (errorMessage.includes('500')) {
                errorMessage = 'Server error. Please try again later.';
            }
            
            notificationService.error(errorMessage);
        } finally {
            setSaving(false);
        }
    };

    const handleBackToDashboard = () => {
        navigate("/dashboard");
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
        <div className="wizard-page">
            <div className="wizard-container">
                <div className="wizard-header">
                    <button className="back-btn" onClick={handleBackToDashboard}>
                        <FaArrowLeft /> Back to Dashboard
                    </button>
                    <h1>
                        {isEditMode ? 'Edit' : 'Create'} Preventive Maintenance Report
                    </h1>
                    <p>
                        Digital Installation & PM Visit E-Form System
                    </p>
                    {isEditMode && (
                        <div className="edit-mode-banner" style={{
                            background: '#e3f2fd',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            marginTop: '8px',
                            display: 'inline-block',
                            fontSize: '14px',
                            color: '#0d47a1'
                        }}>
                            ✏️ Editing Mode - 🔒 Service Report No, Visit No, and Sensor ID are locked
                        </div>
                    )}
                </div>

                <ProgressBar step={step} />

                <div className="wizard-body">
                    {step === 1 && (
                        <Step1BasicInfo
                            formData={formData}
                            setFormData={setFormData}
                            isEditMode={isEditMode}
                        />
                    )}

                    {step === 2 && (
                        <Step2Inspection
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {step === 3 && (
                        <Step3Technical
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {step === 4 && (
                        <Step4Summary
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {step === 5 && (
                        <Step5SignOff
                            formData={formData}
                            setFormData={setFormData}
                        />
                    )}

                    {step === 6 && (
                        <Step6Review
                            formData={formData}
                            onEdit={(step) => setStep(step)}
                            onSubmit={handleSubmit}
                            isEditMode={isEditMode}
                            reportId={id}
                            onBackToDashboard={handleBackToDashboard}
                        />
                    )}
                </div>

                <div className="wizard-footer">
                    <button
                        disabled={step === 1}
                        onClick={prevStep}
                    >
                        ← Previous
                    </button>

                    <span>
                        Step {step} of 6
                    </span>

                    {step < 6 ? (
                        <button onClick={nextStep}>
                            Next →
                        </button>
                    ) : (
                        <button 
                            className="submit-btn" 
                            onClick={handleSubmit}
                            disabled={saving}
                        >
                            {saving ? <FaSpinner className="spinning" /> : null}
                            {isEditMode ? 'Update Report' : 'Done'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}