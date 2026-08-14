// src/components/pm/Step6Review.js
import React, { useState, useRef } from "react";
import { submitPMReport, submitPMReportWithProgress, mapPMStatus, mapSiteCondition } from "../../api/pmReportService";
// ADDED: Import update function for edit mode
import { updatePMReportWithProgress } from "../../api/pmReportService";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import notificationService from '../../services/notificationService';
import { pmStatusLabel, siteConditionLabel } from "../../utils/pmSummary";

export default function Step6Review({
    formData,
    onEdit,
    onSubmit,
    onBackToDashboard,
    isEditMode = false,
    reportId = null
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [submittedReportNo, setSubmittedReportNo] = useState(null);

    const reportRef = useRef(null);

    const report = formData.report || {};
    const inspection = formData.inspection || {};
    const technical = formData.technical || {};
    const summary = formData.summary || {};
    const signoff = formData.signoff || {};

    const StatusBadge = ({ value }) => {
        return (
            <span
                className={
                    value === "YES" || value === "Yes" || value === "yes"
                        ? "status-badge yes"
                        : value === "NO" || value === "No" || value === "no"
                            ? "status-badge no"
                            : "status-badge pending"
                }
            >
                {value || "-"}
            </span>
        );
    };

    // Helper function to get nested data with proper keys
    const getInspectionValue = (category, itemKey, field) => {
        try {
            const categoryData = inspection[category];
            if (!categoryData) return "-";
            const itemData = categoryData[itemKey];
            if (!itemData) return "-";
            return itemData[field] || "-";
        } catch (e) {
            return "-";
        }
    };

    const getTechnicalValue = (category, itemKey, field) => {
        try {
            const categoryData = technical[category];
            if (!categoryData) return "-";
            const itemData = categoryData[itemKey];
            if (!itemData) return "-";
            return itemData[field] || "-";
        } catch (e) {
            return "-";
        }
    };

    // ========================================
    // TRANSFORM CHECKLISTS HELPER FUNCTION - FIXED
    // ========================================
    const transformChecklists = () => {
        const checklists = [];

        //console.log("🔍 ========== DEBUGGING CHECKLISTS ==========");
        //console.log("🔍 inspection:", inspection);
        //console.log("🔍 technical:", technical);

        // Map frontend section names to backend enum values
        const categoryMap = {
            // Inspection categories
            "physicalInspection": "PHYSICAL_INSPECTION",
            "powerSupply": "POWER_SUPPLY",
            // Technical categories
            "sensorHealth": "SENSOR_HEALTH",
            "communication": "COMMUNICATION",
            "calibration": "CALIBRATION_PERFORMANCE_VERIFICATION",
            "cleaning": "CLEANING_ACTIVITY"
        };

        // Process inspection data
        if (inspection && typeof inspection === 'object') {
            //console.log("✅ Processing inspection data");

            Object.keys(inspection).forEach(section => {
                const sectionData = inspection[section];
                const category = categoryMap[section] || section.toUpperCase();

                //console.log(`  🔍 Processing section: ${section} -> ${category}`);

                if (sectionData && typeof sectionData === 'object') {
                    Object.keys(sectionData).forEach(itemKey => {
                        const item = sectionData[itemKey];

                        if (item && typeof item === 'object') {
                            // Only add if there's a status
                            if (item.status) {
                                checklists.push({
                                    category: category,
                                    itemName: itemKey,
                                    status: item.status.toUpperCase() === 'YES' ? 'YES' : 'NO',
                                    remark: item.remark || ''
                                });
                                //console.log(`    ✅ Added: ${itemKey} - ${item.status}`);
                            }
                        }
                    });
                }
            });
        }

        // Process technical data
        if (technical && typeof technical === 'object') {
            //console.log("✅ Processing technical data");

            Object.keys(technical).forEach(section => {
                const sectionData = technical[section];
                const category = categoryMap[section] || section.toUpperCase();

                //console.log(`  🔍 Processing section: ${section} -> ${category}`);

                if (sectionData && typeof sectionData === 'object') {
                    Object.keys(sectionData).forEach(itemKey => {
                        const item = sectionData[itemKey];

                        if (item && typeof item === 'object') {
                            // Only add if there's a status
                            if (item.status) {
                                checklists.push({
                                    category: category,
                                    itemName: itemKey,
                                    status: item.status.toUpperCase() === 'YES' ? 'YES' : 'NO',
                                    remark: item.remark || ''
                                });
                                //console.log(`    ✅ Added: ${itemKey} - ${item.status}`);
                            }
                        }
                    });
                }
            });
        }

        //console.log("📋 Final Transformed checklists:", checklists);
        //console.log("📊 Total checklists count:", checklists.length);
        //console.log("🔍 ========== END DEBUGGING ==========");

        return checklists;
    };

    // ========================================
    // HANDLE SUBMIT REPORT - MODIFIED WITH EDIT SUPPORT
    // ========================================
    const handleSubmitReport = async () => {
        setIsSubmitting(true);
        setSubmitError(null);
        setSubmitSuccess(false);
        setUploadProgress(0);

        try {
            // Transform checklists
            const checklists = transformChecklists();

            if (!mapPMStatus(summary.pmStatus) || !mapSiteCondition(summary.siteCondition)) {
                throw new Error("Please select Preventive Maintenance Status and Site Condition");
            }

            //console.log("📋 Final checklists for submission:", checklists);

            // Prepare the complete data for submission
            const submitData = {
                serviceReportNo: report.serviceReportNo || "",
                serviceVisitNo: report.serviceVisitNo || "",
                clientName: report.clientName || "",
                siteName: report.siteName || "",
                sensorId: report.sensorId || "",
                pmVisitDate: report.pmVisitDate || "",
                engineerName: report.engineerName || "",
                observation: summary.observation || "",
                recommendation: summary.recommendation || "",
                preventiveMaintenanceStatus: mapPMStatus(summary.pmStatus),
                siteConditionAfterPm: mapSiteCondition(summary.siteCondition),
                summary: {
                    preventiveMaintenanceStatus: mapPMStatus(summary.pmStatus),
                    siteConditionAfterPm: mapSiteCondition(summary.siteCondition)
                },
                checklists: checklists,
                signOff: {
                    serviceEngineerName: signoff.serviceEngineerName || "",
                    serviceEngineerSignature: signoff.serviceEngineerName || "",
                    serviceEngineerDate: new Date().toISOString().split('T')[0],
                    clientRepresentativeName: signoff.clientRepresentativeName || "",
                    designation: signoff.designation || "",
                    clientSignature: signoff.clientRepresentativeName || "",
                    clientDate: new Date().toISOString().split('T')[0]
                }
            };

            
            // ADDED: Check if we're in edit mode
            let result;
            
            // ADDED: Determine if we should update or create
            const shouldUpdate = isEditMode && reportId;
            
            if (shouldUpdate) {
                result = await updatePMReportWithProgress(
                    reportId,
                    submitData,
                    (progress) => {
                        setUploadProgress(progress);
                    }
                );
            } else {
                // CREATE - Use the create function (existing code)
                result = await submitPMReportWithProgress(submitData, (progress) => {
                    setUploadProgress(progress);
                });
            }

            if (result.success) {
                setSubmitSuccess(true);
                setUploadProgress(100);
                setSubmittedReportNo(result.data?.serviceReportNo || report.serviceReportNo);
                setShowSuccessModal(true);

                if (onSubmit) {
                    onSubmit({
                        type: "final",
                        success: true,
                        data: result.data
                        // ADDED: Pass edit mode status
                        , isEditMode: isEditMode
                    });
                }
                // MODIFIED: Different success message for edit vs create
                const reportMeta = {
                    id: result.data?.id || reportId,
                    reportType: 'PM Report',
                    reportName: result.data?.serviceReportNo || report.serviceReportNo,
                    customerName: report.clientName,
                    location: report.siteName,
                    createdBy: localStorage.getItem('userName') || ''
                };
                if (isEditMode) {
                    notificationService.reportUpdated('PM Report', reportMeta);
                } else {
                    notificationService.reportCreated('PM Report', reportMeta);
                }
            } else {
                notificationService.error(result.error || "Failed to submit report");
                setSubmitError(result.error || "Failed to submit report");

                if (onSubmit) {
                    onSubmit({
                        type: "final",
                        success: false,
                        error: result.error
                    });
                }
            }
        } catch (error) {
            //console.error("❌ Submission error:", error);
            notificationService.error(error.message || "An unexpected error occurred");
            setSubmitError(error.message || "An unexpected error occurred");

            if (onSubmit) {
                onSubmit({
                    type: "final",
                    success: false,
                    error: error.message
                });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle modal close and navigate to dashboard
    const handleModalClose = () => {
        setShowSuccessModal(false);
        if (onBackToDashboard) {
            onBackToDashboard();
        }
    };

    // Handle Print
    const handlePrint = () => {
        window.print();
    };

    // ========================================
    // ENHANCED PDF GENERATION
    // ========================================
    const handleGeneratePDF = async () => {
        setIsGeneratingPDF(true);

        try {
            const element = reportRef.current;
            if (!element) {
                throw new Error("Report content not found");
            }

            // Create a clone of the element for PDF generation
            const cloneElement = element.cloneNode(true);

            // Apply enhanced PDF-specific styles
            cloneElement.style.width = '100%';
            cloneElement.style.maxWidth = '1200px';
            cloneElement.style.margin = '0 auto';
            cloneElement.style.padding = '40px';
            cloneElement.style.background = 'white';
            cloneElement.style.fontFamily = 'Arial, sans-serif';
            cloneElement.style.color = '#1a1a2e';
            cloneElement.style.fontSize = '14px';
            cloneElement.style.lineHeight = '1.6';

            // Add to DOM temporarily
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '0';
            tempDiv.style.width = '1200px';
            tempDiv.style.background = 'white';
            tempDiv.style.zIndex = '-9999';
            tempDiv.appendChild(cloneElement);
            document.body.appendChild(tempDiv);

            // Wait for rendering
            await new Promise(resolve => setTimeout(resolve, 500));

            // Generate canvas
            const canvas = await html2canvas(cloneElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                width: 1200,
                height: cloneElement.scrollHeight,
                windowHeight: cloneElement.scrollHeight,
                backgroundColor: '#ffffff',
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.querySelector('[data-pdf-content]');
                    if (clonedElement) {
                        clonedElement.style.display = 'block';
                        clonedElement.style.background = 'white';
                    }
                }
            });

            // Remove temp element
            document.body.removeChild(tempDiv);

            // Calculate PDF dimensions
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Create PDF
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgData = canvas.toDataURL('image/png');

            let heightLeft = imgHeight;
            let position = 0;
            let pageCount = 1;

            // Add first page
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            // Add subsequent pages if content is longer than one page
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                pageCount++;
            }

            // Add page numbers to each page
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.setTextColor(150, 150, 150);
                pdf.text(
                    `Page ${i} of ${pageCount}`,
                    pdf.internal.pageSize.getWidth() / 2,
                    pdf.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );

                // Add footer line
                pdf.setDrawColor(200, 200, 200);
                pdf.setLineWidth(0.5);
                pdf.line(
                    20,
                    pdf.internal.pageSize.getHeight() - 15,
                    pdf.internal.pageSize.getWidth() - 20,
                    pdf.internal.pageSize.getHeight() - 15
                );
            }

            // Save PDF with proper filename
            const fileName = `PM_Report_${report.serviceReportNo || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

            // Call onSubmit with PDF generated
            if (onSubmit) {
                onSubmit({
                    type: "pdf",
                    success: true,
                    fileName: fileName
                });
            }
            notificationService.reportDownloaded('PM Report', {
                id: report.id,
                reportType: 'PM Report',
                reportName: report.serviceReportNo,
                customerName: report.clientName,
                location: report.siteName,
            });

        } catch (error) {
            notificationService.error(error.message || "Failed to generate PDF");
            //console.error("PDF Generation Error:", error);
            //alert(`❌ Failed to generate PDF: ${error.message}`);

            if (onSubmit) {
                onSubmit({
                    type: "pdf",
                    success: false,
                    error: error.message
                });
            }
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    return (
        <div className="review-container">
            {/* ADDED: Edit Mode Banner */}
            {isEditMode && (
                <div className="edit-mode-banner" style={{
                    background: '#e3f2fd',
                    border: '1px solid #2196f3',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                }}>
                    <span style={{ fontSize: '20px' }}>✏️</span>
                    <div>
                        <strong style={{ color: '#0d47a1' }}>Edit Mode</strong>
                        <span style={{ color: '#555', marginLeft: '8px' }}>
                            - Service Report No, Visit No, and Sensor ID are locked and cannot be changed
                        </span>
                    </div>
                </div>
            )}

            {submitSuccess && (
                <div className="alert alert-success">
                    {/* MODIFIED: Dynamic success message */}
                    ✅ {isEditMode ? 'Report updated' : 'Report submitted'} successfully!
                </div>
            )}

            {submitError && !isSubmitting && (
                <div className="alert alert-danger">
                    ❌ Error: {submitError}
                </div>
            )}

            {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                <div className="progress-container">
                    <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                        {uploadProgress}%
                    </div>
                </div>
            )}

            {isGeneratingPDF && (
                <div className="alert alert-info">
                    ⏳ Generating PDF... Please wait.
                </div>
            )}

            {/* Report Content - This will be captured for PDF */}
            <div ref={reportRef} data-pdf-content>
                {/* Header */}
                <div className="review-header" style={{
                    textAlign: 'center',
                    marginBottom: '30px',
                    padding: '20px',
                    background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
                    borderRadius: '10px',
                    color: 'white'
                }}>
                    <h1 style={{
                        color: 'white',
                        marginBottom: '10px',
                        fontSize: '28px',
                        fontWeight: '700',
                        letterSpacing: '1px'
                    }}>
                        PREVENTIVE MAINTENANCE SERVICE REPORT
                    </h1>
                    <p style={{
                        color: 'rgba(255, 255, 255, 0.8)',
                        fontSize: '14px',
                        margin: '0'
                    }}>
                        Digital Installation & PM Visit E-Form System
                    </p>
                    <div style={{
                        marginTop: '10px',
                        padding: '8px 20px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        display: 'inline-block',
                        fontSize: '13px'
                    }}>
                        Report No: {report.serviceReportNo || 'N/A'} | Date: {new Date().toLocaleDateString()}
                        {/* ADDED: Edit mode indicator in header */}
                        {isEditMode && <span style={{ marginLeft: '10px' }}>✏️</span>}
                    </div>
                </div>

                {/* BASIC INFORMATION */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{
                            color: '#1a237e',
                            fontSize: '18px',
                            margin: '0',
                            fontWeight: '600'
                        }}>
                            📋 1. Basic Information
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(1)}
                            style={{
                                padding: '5px 15px',
                                background: '#2196f3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '500'
                            }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        fontSize: '14px'
                    }}>
                        <tbody>
                            <tr>
                                <td style={{
                                    padding: '10px 12px',
                                    border: '1px solid #e0e0e0',
                                    fontWeight: 'bold',
                                    width: '30%',
                                    background: '#f5f5f5'
                                }}>Service Report No</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <strong>{report.serviceReportNo || "-"}</strong>
                                </td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Service Visit No</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.serviceVisitNo || "-"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Client Name</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.clientName || "-"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Site Name</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.siteName || "-"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Sensor ID</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.sensorId || "-"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>PM Visit Date</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.pmVisitDate || report.pmDate || "-"}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Engineer Name</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{report.engineerName || "-"}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* PHYSICAL INSPECTION */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            🔧 2. Physical Inspection
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(2)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Inspection Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Sensor Enclosure Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('physicalInspection', 'Sensor Enclosure Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('physicalInspection', 'Sensor Enclosure Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Mounting Structure Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('physicalInspection', 'Mounting Structure Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('physicalInspection', 'Mounting Structure Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Cable Condition Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('physicalInspection', 'Cable Condition Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('physicalInspection', 'Cable Condition Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Dust and Dirt Cleaned</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('physicalInspection', 'Dust and Dirt Cleaned', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('physicalInspection', 'Dust and Dirt Cleaned', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Water Ingress Signs Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('physicalInspection', 'Water Ingress Signs Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('physicalInspection', 'Water Ingress Signs Checked', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* POWER SUPPLY */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            ⚡ 3. Power Supply Issues
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(3)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Power Supply Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Input Voltage Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('powerSupply', 'Input Voltage Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('powerSupply', 'Input Voltage Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>SMPS Adapter Condition Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('powerSupply', 'SMPS / Adapter Condition Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('powerSupply', 'SMPS / Adapter Condition Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Earthing Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('powerSupply', 'Earthing Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('powerSupply', 'Earthing Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Power Connections Tightened</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getInspectionValue('powerSupply', 'Power Connections Tightened', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getInspectionValue('powerSupply', 'Power Connections Tightened', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* SENSOR HEALTH */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            📊 4. Sensor Health Check
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(4)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Sensor Health Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>PM2.5 Sensor Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('sensorHealth', 'PM2.5 Sensor Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('sensorHealth', 'PM2.5 Sensor Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>PM10 Sensor Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('sensorHealth', 'PM10 Sensor Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('sensorHealth', 'PM10 Sensor Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Temperature Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('sensorHealth', 'Temperature Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('sensorHealth', 'Temperature Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Humidity Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('sensorHealth', 'Humidity Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('sensorHealth', 'Humidity Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Data Accuracy Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('sensorHealth', 'Data Accuracy Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('sensorHealth', 'Data Accuracy Checked', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* COMMUNICATION CHECK */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            📶 5. Communication Check
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(5)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Communication Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>SIM Card Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('communication', 'SIM Card Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('communication', 'SIM Card Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Network Signal Strength Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('communication', 'Network Signal Strength Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('communication', 'Network Signal Strength Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Data Transmission Verified</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('communication', 'Data Transmission Verified', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('communication', 'Data Transmission Verified', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Dashboard Connectivity Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('communication', 'Dashboard Connectivity Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('communication', 'Dashboard Connectivity Checked', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* CALIBRATION */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            🎯 6. Calibration and Performance Verification
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(6)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Calibration Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Sensor Reading Verified</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('calibration', 'Sensor Reading Verified', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('calibration', 'Sensor Reading Verified', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Calibration Status Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('calibration', 'Calibration Status Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('calibration', 'Calibration Status Checked', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Error Logs Reviewed</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('calibration', 'Error Logs Reviewed', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('calibration', 'Error Logs Reviewed', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Firmware Version Checked</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('calibration', 'Firmware Version Checked', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('calibration', 'Firmware Version Checked', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* CLEANING ACTIVITY */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            🧹 7. Cleaning Activity
                        </h2>
                        <button
                            type="button"
                            className="edit-btn"
                            onClick={() => onEdit(7)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr style={{ background: '#e3f2fd' }}>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '45%', fontWeight: '600' }}>Cleaning Item</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', width: '15%', fontWeight: '600' }}>Status</th>
                                <th style={{ padding: '10px 12px', border: '1px solid #e0e0e0', textAlign: 'left', fontWeight: '600' }}>Remark</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Sensor Chamber Cleaned</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('cleaning', 'Sensor Chamber Cleaned', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('cleaning', 'Sensor Chamber Cleaned', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Air Inlet/Outlet Cleaned</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('cleaning', 'Air Inlet / Outlet Cleaned', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('cleaning', 'Air Inlet / Outlet Cleaned', 'remark')}</td>
                            </tr>
                            <tr>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>Enclosure Cleaned</td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                    <StatusBadge value={getTechnicalValue('cleaning', 'Enclosure Cleaned', 'status')} />
                                </td>
                                <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{getTechnicalValue('cleaning', 'Enclosure Cleaned', 'remark')}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* OBSERVATION */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            👁️ 8. Observation
                        </h2>
                        <button
                            className="edit-btn"
                            onClick={() => onEdit(8)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <div className="review-content" style={{
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        borderLeft: '4px solid #1a237e',
                        minHeight: '50px',
                        fontSize: '14px'
                    }}>
                        <p style={{ margin: '0' }}>{summary.observation || "No observation added"}</p>
                    </div>
                </div>

                {/* RECOMMENDATION */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            💡 9. Recommendation
                        </h2>
                        <button
                            className="edit-btn"
                            onClick={() => onEdit(9)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <div className="review-content" style={{
                        padding: '15px',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        borderLeft: '4px solid #1a237e',
                        minHeight: '50px',
                        fontSize: '14px'
                    }}>
                        <p style={{ margin: '0' }}>{summary.recommendation || "No recommendation added"}</p>
                    </div>
                </div>

                {/* PM SUMMARY */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            📈 10. PM Summary
                        </h2>
                        <button
                            className="edit-btn"
                            onClick={() => onEdit(10)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <div className="review-content">
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', width: '30%', background: '#f5f5f5' }}>Site Condition</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{siteConditionLabel(summary.siteCondition) || "N/A"}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', width: '30%', background: '#f5f5f5' }}>PM Status</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            background: summary.pmStatus === 'SATISFACTORY' ? '#d4edda' : '#f8d7da',
                                            color: summary.pmStatus === 'SATISFACTORY' ? '#155724' : '#721c24',
                                            fontWeight: '600',
                                            fontSize: '13px'
                                        }}>
                                            {pmStatusLabel(summary.pmStatus) || "N/A"}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SIGN-OFF */}
                <div className="review-card" style={{
                    marginBottom: '20px',
                    border: '1px solid #e0e0e0',
                    borderRadius: '8px',
                    padding: '20px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                }}>
                    <div className="review-title" style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '15px',
                        borderBottom: '2px solid #1a237e',
                        paddingBottom: '10px'
                    }}>
                        <h2 style={{ color: '#1a237e', fontSize: '18px', margin: '0', fontWeight: '600' }}>
                            ✍️ 11. Sign-Off
                        </h2>
                        <button
                            className="edit-btn"
                            onClick={() => onEdit(11)}
                            style={{ padding: '5px 15px', background: '#2196f3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: '500' }}
                        >
                            ✏️ Edit
                        </button>
                    </div>

                    <div className="review-content">
                        <table className="review-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                            <tbody>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', width: '30%', background: '#f5f5f5' }}>Service Engineer Name</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{signoff.serviceEngineerName || "-"}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Client Representative Name</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{signoff.clientRepresentativeName || "-"}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0', fontWeight: 'bold', background: '#f5f5f5' }}>Designation</td>
                                    <td style={{ padding: '10px 12px', border: '1px solid #e0e0e0' }}>{signoff.designation || "-"}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    marginTop: '30px',
                    paddingTop: '20px',
                    borderTop: '2px solid #e0e0e0',
                    textAlign: 'center',
                    color: '#999',
                    fontSize: '12px'
                }}>
                    <p style={{ margin: '5px 0' }}>This report was generated automatically from the PM Service Report System</p>
                    <p style={{ margin: '5px 0' }}>Generated on: {new Date().toLocaleString()}</p>
                    <p style={{ margin: '5px 0', color: '#666', fontWeight: '600' }}>Digital Installation & PM Visit E-Form System</p>
                </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="footer-actions" style={{
                display: 'flex',
                gap: '10px',
                justifyContent: 'center',
                marginTop: '30px',
                padding: '20px',
                borderTop: '1px solid #ddd',
                flexWrap: 'wrap'
            }}>
                <button
                    className="btn print"
                    onClick={handlePrint}
                    style={{
                        padding: '10px 20px',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease'
                    }}
                    onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                    onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                >
                    🖨️ Print Report
                </button>

                <button
                    className="btn pdf"
                    onClick={handleGeneratePDF}
                    disabled={isGeneratingPDF}
                    style={{
                        padding: '10px 20px',
                        background: isGeneratingPDF ? '#999' : '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isGeneratingPDF ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        opacity: isGeneratingPDF ? 0.6 : 1
                    }}
                >
                    {isGeneratingPDF ? "⏳ Generating..." : "📄 Download PDF"}
                </button>

                <button
                    className="btn submit"
                    onClick={handleSubmitReport}
                    disabled={isSubmitting || submitSuccess}
                    style={{
                        padding: '10px 20px',
                        background: submitSuccess ? '#4CAF50' : (isSubmitting ? '#999' : '#2196f3'),
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: (isSubmitting || submitSuccess) ? 'default' : 'pointer',
                        fontSize: '14px',
                        fontWeight: '500',
                        transition: 'all 0.3s ease',
                        opacity: (isSubmitting || submitSuccess) ? 0.6 : 1
                    }}
                >
                    {/* MODIFIED: Dynamic button text based on edit mode */}
                    {submitSuccess ? "✅ Submitted" : (isSubmitting ? `⏳ ${isEditMode ? 'Updating' : 'Submitting'}... ${uploadProgress}%` : (isEditMode ? "📤 Update Report" : "📤 Submit Report"))}
                </button>
            </div>

            {/* Success Modal - Navigates to Dashboard when clicked */}
            {showSuccessModal && (
                <div className="modal-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    animation: 'fadeIn 0.3s ease'
                }}>
                    <div className="modal-content" style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '40px',
                        maxWidth: '500px',
                        width: '90%',
                        textAlign: 'center',
                        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                        animation: 'slideUp 0.3s ease'
                    }}>
                        <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
                        {/* MODIFIED: Dynamic success message */}
                        <h2 style={{ color: '#1a237e', marginBottom: '12px' }}>
                            {isEditMode ? 'Report Updated Successfully!' : 'Report Submitted Successfully!'}
                        </h2>
                        <p style={{ color: '#4b5563', marginBottom: '8px' }}>
                            {isEditMode 
                                ? 'Your PM Service Report has been updated successfully.'
                                : 'Your PM Service Report has been submitted successfully.'
                            }
                        </p>
                        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
                            Report No: <strong>{submittedReportNo}</strong>
                        </p>
                        <button
                            onClick={handleModalClose}
                            style={{
                                padding: '12px 30px',
                                background: '#4F46E5',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.05)'}
                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                        >
                            Go to Dashboard
                        </button>
                    </div>
                </div>
            )}

            {/* Enhanced Styles */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                .alert {
                    padding: 15px 20px;
                    margin-bottom: 20px;
                    border-radius: 8px;
                    font-weight: 500;
                    border-left: 4px solid transparent;
                }
                .alert-success {
                    background-color: #d4edda;
                    color: #155724;
                    border-color: #28a745;
                }
                .alert-danger {
                    background-color: #f8d7da;
                    color: #721c24;
                    border-color: #dc3545;
                }
                .alert-info {
                    background-color: #cce5ff;
                    color: #004085;
                    border-color: #007bff;
                }
                .btn:disabled {
                    opacity: 0.6;
                    cursor: not-allowed !important;
                }
                .btn:hover:not(:disabled) {
                    transform: scale(1.05);
                }
                .progress-container {
                    width: 100%;
                    background-color: #f0f0f0;
                    border-radius: 8px;
                    margin: 10px 0 20px 0;
                    overflow: hidden;
                    box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
                }
                .progress-bar {
                    height: 30px;
                    background: linear-gradient(90deg, #4CAF50, #45a049);
                    color: white;
                    text-align: center;
                    line-height: 30px;
                    border-radius: 8px;
                    transition: width 0.5s ease;
                    font-size: 13px;
                    font-weight: bold;
                }
                .review-content {
                    padding: 10px 0;
                }
                
                .status-badge {
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 600;
                    display: inline-block;
                }
                .status-badge.yes {
                    background: #d4edda;
                    color: #155724;
                }
                .status-badge.no {
                    background: #f8d7da;
                    color: #721c24;
                }
                .status-badge.pending {
                    background: #fff3cd;
                    color: #856404;
                }
                
                /* Print styles */
                @media print {
                    .btn, .edit-btn, .footer-actions, .alert, .modal-overlay, .edit-mode-banner {
                        display: none !important;
                    }
                    .review-card {
                        break-inside: avoid;
                        page-break-inside: avoid;
                        border: 1px solid #ddd !important;
                        box-shadow: none !important;
                    }
                    .review-container {
                        padding: 20px;
                    }
                    .review-header {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .status-badge {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>
        </div>
    );
}