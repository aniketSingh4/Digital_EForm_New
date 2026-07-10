import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
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

    // Fetch data for edit mode
    useEffect(() => {
        if (isEditMode && id) {
            fetchReportData();
        }
    }, [isEditMode, id]);

    const fetchReportData = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8090/api/pm_reports/${id}`, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const data = await response.json();
            
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
                inspection: {
                    // Inspection data if any
                },
                technical: {
                    // Technical data if any
                },
                summary: {
                    observation: data.observation || '',
                    recommendation: data.recommendation || '',
                    pmStatus: data.preventiveMaintenanceStatus || 'SATISFACTORY',
                    siteCondition: data.siteConditionAfterPm || 'SYSTEM_OPERATIONAL'
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
                checklists: data.checklists || []
            });

            toast.success('Report data loaded successfully');

        } catch (error) {
            console.error('Error fetching report:', error);
            toast.error('Failed to load report data');
            notificationService.error('Failed to load PM Report');
            navigate('/view-reports/1');
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

            // Validate all required fields
            if (!reportData.serviceReportNo) {
                throw new Error("Service Report No is missing");
            }
            if (!reportData.clientName) {
                throw new Error("Client Name is missing");
            }
            if (!reportData.siteName) {
                throw new Error("Site Name is missing");
            }
            if (!reportData.sensorId) {
                throw new Error("Sensor ID is missing");
            }
            if (!pmVisitDate) {
                throw new Error("PM Visit Date is missing");
            }

            // Prepare payload
            const payload = {
                serviceReportNo: reportData.serviceReportNo.trim(),
                serviceVisitNo: reportData.serviceVisitNo || "",
                clientName: reportData.clientName.trim(),
                siteName: reportData.siteName.trim(),
                sensorId: reportData.sensorId.trim(),
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
                const errorData = await response.text();
                throw new Error(`Failed to ${isEditMode ? 'update' : 'save'} report: ${response.status}`);
            }

            const result = await response.json();
            
            if (isEditMode) {
                notificationService.reportUpdated('PM Report', id);
                toast.success('✅ Report updated successfully!');
            } else {
                notificationService.reportCreated('PM Report', result.id);
                toast.success('✅ Report created successfully!');
            }

            // Navigate back to reports list
            setTimeout(() => {
                navigate('/view-reports/1');
            }, 1500);

        } catch (error) {
            console.error("Error submitting report:", error);
            notificationService.error(error.message || "An unexpected error occurred");
            toast.error(`❌ ${error.message}`);
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
                            saving={saving}
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
                            {isEditMode ? 'Update Report' : 'Submit Report'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}