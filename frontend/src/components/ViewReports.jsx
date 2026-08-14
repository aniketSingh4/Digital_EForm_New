// src/components/ViewReports.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    FaArrowLeft,
    FaSearch,
    FaEye,
    FaEdit,
    FaTrash,
    FaFilePdf,
    FaSpinner,
    FaFilter,
    FaChevronLeft,
    FaChevronRight,
    FaTimes,
    FaCheckCircle,
    FaExclamationCircle,
    FaClock,
    FaSync,
    FaPlusCircle,
    FaDownload,
    FaMicrochip,
    FaBuilding,
    FaUser,
    FaMapMarkerAlt,
    FaCalendarAlt,
    FaFileAlt,
    FaUserTie,
    FaSignature,
    FaClipboardList,
    FaTools,
    FaWrench,
    FaSave,
    FaUndo,
    FaPlus,
    FaMinus
} from "react-icons/fa";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "../assets/ViewReports.css";
import { handleEditNavigation } from '../handlers/pmReportEditHandler';
import notificationService from '../services/notificationService';
import { canModifyReports, getAuthHeaders } from '../utils/roles';
import { getCached, setCached, invalidate, LIST_CACHE_TTL } from '../utils/cache';
import { env } from '../config/env';
import { pickPmStatus, pickSiteCondition, pmStatusLabel, siteConditionLabel } from '../utils/pmSummary';

export default function ViewReports() {
    const navigate = useNavigate();
    const { featureId } = useParams();
    const isAdminUser = canModifyReports();
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
    const [usingMockData, setUsingMockData] = useState(false);
    const [totalReports, setTotalReports] = useState(0);
    const [showViewModal, setShowViewModal] = useState(false);
    const [viewingReport, setViewingReport] = useState(null);
    const [generatingPDF, setGeneratingPDF] = useState(false);
    const [selectedReports, setSelectedReports] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [loadingReportDetails, setLoadingReportDetails] = useState(false);
    const [pdfProgress, setPdfProgress] = useState(0);

    // Edit mode states
    const [isEditing, setIsEditing] = useState(false);
    const [editedReport, setEditedReport] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [editError, setEditError] = useState(null);
    const [editSuccess, setEditSuccess] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const reportRef = useRef(null);

    const featureConfig = {
        1: {
            title: "Preventive Maintenance Reports",
            baseUrl: env.PM_SERVICE_URL,
            apiEndpoint: "/api/pm_reports",
            idField: "id",
            dateField: "pmVisitDate",
            nameField: "clientName",
            statusField: "preventiveMaintenanceStatus",
            viewPath: "/pm-report",
            createPath: "/pm-report",
            columns: [
                { key: "serviceReportNo", label: "Report No" },
                { key: "clientName", label: "Client Name" },
                { key: "siteName", label: "Site Name" },
                { key: "pmVisitDate", label: "Visit Date" },
                { key: "sensorId", label: "Sensor ID" },
                { key: "engineerName", label: "Engineer" },
                { key: "siteConditionAfterPm", label: "Site Condition" }
            ]
        },
        2: {
            title: "Pre-Visit Checklists",
            baseUrl: env.PREVISIT_SERVICE_URL,
            apiEndpoint: "/api/pre-visit-checklist",
            idField: "id",
            dateField: "createdDate",
            nameField: "siteName",
            statusField: "status",
            viewPath: "/pre-visit-checklist",
            createPath: "/pre-visit-checklist",
            columns: [
                { key: "checklistNo", label: "Checklist No" },
                { key: "siteName", label: "Site Name" },
                { key: "createdDate", label: "Created Date" },
                { key: "sensorId", label: "Sensor ID" },
                { key: "engineerName", label: "Engineer" }
            ]
        },
        3: {
            title: "Calibration Reports",
            baseUrl: env.CALIBRATION_SERVICE_URL,
            apiEndpoint: "/api/calibration-reports",
            idField: "id",
            dateField: "calibrationDate",
            nameField: "instrumentName",
            statusField: "status",
            viewPath: "/calibration-report",
            createPath: "/calibration-report",
            columns: [
                { key: "calibrationNo", label: "Calibration No" },
                { key: "instrumentName", label: "Instrument Name" },
                { key: "calibrationDate", label: "Calibration Date" },
                { key: "sensorId", label: "Sensor ID" },
                { key: "engineerName", label: "Engineer" }
            ]
        },
        4: {
            title: "Installation & Commissioning Reports",
            baseUrl: env.INSTALLATION_SERVICE_URL,
            apiEndpoint: "/api/installation-reports",
            idField: "id",
            dateField: "installationDate",
            nameField: "projectName",
            statusField: "status",
            viewPath: "/installation-commissioning",
            createPath: "/installation-commissioning",
            columns: [
                { key: "installationNo", label: "Installation No" },
                { key: "projectName", label: "Project Name" },
                { key: "installationDate", label: "Installation Date" },
                { key: "sensorId", label: "Sensor ID" },
                { key: "engineerName", label: "Engineer" }
            ]
        }
    };

    const config = featureConfig[featureId] || featureConfig[1];
    const API_BASE_URL = config.baseUrl;

    // Helper function for status badge
    const getStatusBadge = (status) => {
        const statusMap = {
            'SATISFACTORY': { icon: <FaCheckCircle />, label: 'Satisfactory', class: 'status-satisfactory' },
            'FOLLOW_UP_VISIT_REQUIRED': { icon: <FaClock />, label: 'Follow-up Required', class: 'status-followup' },
            'REQUIRES_ATTENTION': { icon: <FaExclamationCircle />, label: 'Requires Attention', class: 'status-attention' },
            'COMPLETED': { icon: <FaCheckCircle />, label: 'Completed', class: 'status-completed' },
            'PENDING': { icon: <FaClock />, label: 'Pending', class: 'status-pending' },
            'IN_PROGRESS': { icon: <FaSpinner />, label: 'In Progress', class: 'status-progress' }
        };
        return statusMap[status] || { icon: <FaClock />, label: pmStatusLabel(status) || status || 'Unknown', class: 'status-unknown' };
    };

    const getSiteConditionDisplay = (condition) => {
        return siteConditionLabel(condition) || "N/A";
    };

    // Transform summary data - FIXED
    const transformSummaryData = (backendData) => {
        let pmVisitDate = backendData.pmVisitDate || backendData.pmDate || backendData.visitDate || "-";

        if (pmVisitDate && pmVisitDate !== "-") {
            try {
                const dateObj = new Date(pmVisitDate);
                if (!isNaN(dateObj.getTime())) {
                    pmVisitDate = dateObj.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn("Could not parse date:", pmVisitDate);
            }
        }

        const status = pickPmStatus(
            backendData.summary?.preventiveMaintenanceStatus,
            backendData.preventiveMaintenanceStatus
        );
        const condition = pickSiteCondition(
            backendData.summary?.siteConditionAfterPm,
            backendData.siteConditionAfterPm
        );

        // ✅ FIX: Get sensorId from the backend data
        // The API response shows "sensorId": "911" at the root level
        let sensorId = backendData.sensorId || "-";

        // Log for debugging
        //console.log("🔍 Sensor ID from API:", sensorId);
        //console.log("🔍 Full backend data:", backendData);

        return {
            id: backendData.id,
            serviceReportNo: backendData.serviceReportNo || "-",
            serviceVisitNo: backendData.serviceVisitNo || "-",
            clientName: backendData.clientName || "-",
            siteName: backendData.siteName || "-",
            sensorId: sensorId,  // ✅ This should now capture the value
            pmVisitDate: pmVisitDate,
            engineerName: backendData.engineerName || "-",
            preventiveMaintenanceStatus: status,
            siteConditionAfterPm: condition,
            createdAt: backendData.createdAt || new Date().toISOString(),
            observation: backendData.observation || "No observation added",
            recommendation: backendData.recommendation || "No recommendation added",
            checklists: backendData.checklists || [],
            signOff: backendData.signOff || null
        };
    };

    // Transform full details - FIXED
    const transformFullDetails = (backendData) => {
        if (!backendData) {
            return null;
        }

        let pmVisitDate = backendData.pmVisitDate || backendData.pmDate || backendData.visitDate || "-";
        if (pmVisitDate && pmVisitDate !== "-") {
            try {
                const dateObj = new Date(pmVisitDate);
                if (!isNaN(dateObj.getTime())) {
                    pmVisitDate = dateObj.toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn("Could not parse date:", pmVisitDate);
            }
        }

        const status = pickPmStatus(
            backendData.summary?.preventiveMaintenanceStatus,
            backendData.preventiveMaintenanceStatus
        );
        const condition = pickSiteCondition(
            backendData.summary?.siteConditionAfterPm,
            backendData.siteConditionAfterPm
        );

        // ✅ FIX: Get sensorId from multiple possible locations
        let sensorId = "-";
        if (backendData.sensorId) {
            sensorId = backendData.sensorId;
        } else if (backendData.sensor_id) {
            sensorId = backendData.sensor_id;
        } else if (backendData.equipmentDetails && backendData.equipmentDetails.length > 0) {
            const firstEquipment = backendData.equipmentDetails[0];
            if (firstEquipment && firstEquipment.serialNo) {
                sensorId = firstEquipment.serialNo;
            } else if (firstEquipment && firstEquipment.serialNumber) {
                sensorId = firstEquipment.serialNumber;
            }
        }

        let signOffData = backendData.signOff || backendData.signoff || null;
        if (signOffData && typeof signOffData === 'object') {
            if (signOffData.report && typeof signOffData.report === 'object') {
                signOffData = { ...signOffData };
                delete signOffData.report;
            }
        }

        //console.log("🔍 Transforming full details - Sensor ID:", sensorId);

        return {
            id: backendData.id || null,
            serviceReportNo: backendData.serviceReportNo || "-",
            serviceVisitNo: backendData.serviceVisitNo || "-",
            clientName: backendData.clientName || "-",
            siteName: backendData.siteName || "-",
            sensorId: sensorId,  // ✅ Use the fixed sensorId
            pmVisitDate: pmVisitDate,
            engineerName: backendData.engineerName || "-",
            preventiveMaintenanceStatus: status,
            siteConditionAfterPm: condition,
            observation: backendData.observation || "No observation added",
            recommendation: backendData.recommendation || "No recommendation added",
            checklists: backendData.checklists || [],
            signOff: signOffData,
            createdAt: backendData.createdAt || new Date().toISOString(),
            _original: backendData
        };
    };

    // Date formatter
    const formatDate = (date) => {
        if (!date || date === "-" || date === "N/A") return "-";
        try {
            const dateObj = new Date(date);
            if (isNaN(dateObj.getTime())) return date;
            return dateObj.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return date;
        }
    };

    // Data fetching
    useEffect(() => {
        fetchReports();
    }, [featureId]);

    const fetchReports = async (forceRefresh = false) => {
        setLoading(true);
        setError(null);
        setUsingMockData(false);

        const cacheKey = 'pm_reports_list';

        try {
            if (!forceRefresh) {
                const cached = getCached(cacheKey);
                if (cached && Array.isArray(cached)) {
                    setReports(cached);
                    setTotalReports(cached.length);
                    setLoading(false);
                    return;
                }
            }

            const url = `${API_BASE_URL}${config.apiEndpoint}`;
            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders({ Accept: 'application/json' })
            });

            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }

            const data = await response.json();
            let rawReports = [];

            if (Array.isArray(data)) {
                rawReports = data;
            } else if (data && typeof data === 'object') {
                if (data.id !== undefined && data.serviceReportNo !== undefined) {
                    rawReports = [data];
                } else if (data.content && Array.isArray(data.content)) {
                    rawReports = data.content;
                    if (data.totalElements !== undefined) {
                        setTotalReports(data.totalElements);
                    }
                } else if (data.data && Array.isArray(data.data)) {
                    rawReports = data.data;
                } else if (data.reports && Array.isArray(data.reports)) {
                    rawReports = data.reports;
                } else {
                    for (const key in data) {
                        if (Array.isArray(data[key])) {
                            rawReports = data[key];
                            break;
                        }
                    }
                }
            }

            const transformedReports = rawReports.map(transformSummaryData);

            setReports(transformedReports);
            setTotalReports(transformedReports.length);
            setCached(cacheKey, transformedReports, LIST_CACHE_TTL);
            setError(null);
        } catch (err) {
            console.error("❌ Error fetching reports:", err);
            setReports([]);
            setTotalReports(0);
            setError(`⚠️ Could not connect to server. ${err.message || "Please try again."}`);
        } finally {
            setLoading(false);
        }
    };

    const fetchReportDetails = async (reportId) => {
        setLoadingReportDetails(true);
        try {
            const url = `${API_BASE_URL}${config.apiEndpoint}/${reportId}`;
            //console.log("🔍 Fetching report details from:", url);

            const response = await fetch(url, {
                method: 'GET',
                headers: getAuthHeaders({ Accept: 'application/json' })
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch report details: ${response.status}`);
            }

            const data = await response.json();
            //console.log("📥 Raw report details from API:", data);

            const transformed = transformFullDetails(data);
            //console.log("📥 Transformed report details:", transformed);

            return transformed;
        } catch (err) {
            console.error("❌ Error fetching report details:", err);
            const summaryReport = reports.find(r => r.id === reportId);
            if (summaryReport) {
                return transformFullDetails({
                    ...summaryReport,
                    observation: "No observation available",
                    recommendation: "No recommendation available",
                    checklists: summaryReport.checklists || [],
                    signOff: summaryReport.signOff || null
                });
            }
            throw err;
        } finally {
            setLoadingReportDetails(false);
        }
    };

    // Mock data
    const getMockData = () => {
        const mockData = [];
        const clients = ["Reliance Industries Ltd.", "Tata Power", "Adani Green", "NTPC", "Siemens", "BHEL"];
        const sites = ["Jamnagar Refinery", "Mumbai Plant", "Ahmedabad Unit", "Delhi Facility"];
        const engineers = ["Rahul Sharma", "Priya Patel", "Amit Kumar", "Sneha Reddy"];

        for (let i = 1; i <= 8; i++) {
            const day = String((i % 28) + 1).padStart(2, '0');
            const month = String((i % 12) + 1).padStart(2, '0');
            const year = "2026";

            mockData.push({
                id: i,
                serviceReportNo: `PM-2026-${String(i).padStart(4, '0')}`,
                serviceVisitNo: `SV-2026-${String(i).padStart(4, '0')}`,
                clientName: clients[i % clients.length],
                siteName: sites[i % sites.length],
                sensorId: `SENSOR-${String(1000 + i)}`,
                pmVisitDate: `${year}-${month}-${day}`,
                engineerName: engineers[i % engineers.length],
                preventiveMaintenanceStatus: ["SATISFACTORY", "FOLLOW_UP_VISIT_REQUIRED", "REQUIRES_ATTENTION"][i % 3],
                siteConditionAfterPm: ["SYSTEM_OPERATIONAL", "SYSTEM_NOT_OPERATIONAL", "SYSTEM_OPERATIONAL_WITH_OBSERVATION"][i % 3],
                createdAt: new Date().toISOString(),
                observation: "Sensor was operational. Minor dust accumulation found.",
                recommendation: "Replace air filter during next PM visit.",
                checklists: [],
                signOff: null
            });
        }
        return mockData;
    };

    const getMockFullDetails = (reportId) => {
        const report = reports.find(r => r.id === reportId);
        if (!report) return null;

        const mockChecklists = [
            { category: "PHYSICAL_INSPECTION", itemName: "Sensor Enclosure Checked", status: "YES", remark: "No physical damage found." },
            { category: "PHYSICAL_INSPECTION", itemName: "Mounting Structure Checked", status: "YES", remark: "Mounting bolts tightened." },
            { category: "POWER_SUPPLY", itemName: "Input Voltage Checked", status: "YES", remark: "230V AC Stable" },
            { category: "SENSOR_HEALTH", itemName: "PM2.5 Sensor Status Checked", status: "YES", remark: "Reading normal." },
            { category: "SENSOR_HEALTH", itemName: "Temperature Status Checked", status: "YES", remark: "Normal." },
            { category: "COMMUNICATION", itemName: "SIM Card Status Checked", status: "YES", remark: "SIM active." },
            { category: "CALIBRATION_PERFORMANCE_VERIFICATION", itemName: "Sensor Reading Verified", status: "YES", remark: "Matched reference." },
            { category: "CLEANING_ACTIVITY", itemName: "Sensor Chamber Cleaned", status: "YES", remark: "Completed." }
        ];

        return {
            ...report,
            observation: "Sensor was operational. Minor dust accumulation found inside the enclosure.",
            recommendation: "Replace air filter during the next preventive maintenance visit.",
            checklists: mockChecklists,
            signOff: {
                clientRepresentativeName: "Amit Kumar",
                designation: "Plant Manager",
                clientSignature: "Amit Kumar",
                clientDate: "2026-06-27",
                serviceEngineerName: report.engineerName || "Rahul Sharma",
                serviceEngineerSignature: report.engineerName || "Rahul Sharma",
                serviceEngineerDate: "2026-06-27"
            }
        };
    };

    // Filter, sort, pagination
    const filteredReports = reports.filter(report => {
        const searchableFields = [
            report.serviceReportNo,
            report.clientName,
            report.siteName,
            report.engineerName,
            report.sensorId
        ].filter(Boolean);

        const searchMatch = searchTerm === "" ||
            searchableFields.some(field =>
                String(field).toLowerCase().includes(searchTerm.toLowerCase())
            );

        const statusMatch = filterStatus === "ALL" ||
            String(report[config.statusField] || "").toUpperCase() === filterStatus;

        return searchMatch && statusMatch;
    });

    const sortedReports = [...filteredReports].sort((a, b) => {
        if (!sortConfig.key) return 0;
        const aVal = String(a[sortConfig.key] || "").toLowerCase();
        const bVal = String(b[sortConfig.key] || "").toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentReports = sortedReports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedReports.length / itemsPerPage);

    const handleSort = (key) => {
        setSortConfig({
            key,
            direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
        });
    };

    // ========================================
    // PROFESSIONAL PDF GENERATION - OPTIMIZED FOR 3 PAGES
    // ========================================
    const generateProfessionalPDF = async (report) => {
        try {
            setPdfProgress(10);

            let fullDetails = report;

            // Fetch full details if we don't have checklists or signOff
            if (!fullDetails.checklists || fullDetails.checklists.length === 0 || !fullDetails.signOff) {
                //console.log("🔍 Fetching full details for report ID:", report.id);
                if (usingMockData) {
                    fullDetails = getMockFullDetails(report.id);
                } else {
                    fullDetails = await fetchReportDetails(report.id);
                }
            }

            if (!fullDetails) {
                throw new Error("Could not load report details");
            }

            //console.log("🔍 Full details for PDF:", fullDetails);

            setPdfProgress(30);

            // Load images as base64
            const loadImageAsBase64 = async (url) => {
                try {
                    const response = await fetch(url);
                    const blob = await response.blob();
                    return new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.readAsDataURL(blob);
                    });
                } catch (error) {
                    console.error(`Error loading image ${url}:`, error);
                    return null;
                }
            };

            // Load both images
            const [backgroundImage, headerImage] = await Promise.all([
                loadImageAsBase64('/bg-img.webp'),
                loadImageAsBase64('/header.webp')
            ]);

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Function to add background image, header, and footer
            const addPageLayout = (pageNum) => {
                if (backgroundImage) {
                    try {
                        const bgWidth = pageWidth * 0.45;
                        const bgHeight = pageHeight * 0.35;
                        const x = (pageWidth - bgWidth) / 2;
                        const y = (pageHeight - bgHeight) / 2;
                        doc.setGState(new doc.GState({ opacity: 0.15 }));
                        doc.addImage(backgroundImage, 'WEBP', x, y, bgWidth, bgHeight);
                        doc.setGState(new doc.GState({ opacity: 5.0 }));
                    } catch (error) {
                        console.warn('Failed to add background image:', error);
                    }
                }

                if (headerImage) {
                    try {
                        const headerWidth = 55;
                        const headerHeight = 21;
                        const x = pageWidth - headerWidth - 12;
                        const y = 8;
                        doc.addImage(headerImage, 'WEBP', x, y, headerWidth, headerHeight);
                    } catch (error) {
                        console.warn('Failed to add header image:', error);
                    }
                }

                doc.setTextColor(150, 150, 170);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('FESPL/26-27/V01', 15, pageHeight - 10);
                doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
                doc.text('FORM-I', pageWidth - 15, pageHeight - 10, { align: 'right' });
            };

            const statusInfo = getStatusBadge(fullDetails.preventiveMaintenanceStatus);

            const formatPDFDate = (dateStr) => {
                if (!dateStr || dateStr === "-") return "-";
                try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                } catch {
                    return dateStr;
                }
            };

            const getSiteConditionDisplay = (condition) => siteConditionLabel(condition) || "N/A";

            const signOff = fullDetails.signOff || {};
            const clientName = signOff.clientRepresentativeName || fullDetails.clientRepresentativeName || '-';
            const clientDesignation = signOff.designation || fullDetails.designation || '-';
            const clientDate = signOff.clientDate || fullDetails.clientDate || '-';
            const clientSignature = signOff.clientSignature || fullDetails.clientSignature || 'Not signed';
            const engineerName = signOff.serviceEngineerName || fullDetails.serviceEngineerName || '-';
            const engineerDate = signOff.serviceEngineerDate || fullDetails.serviceEngineerDate || '-';
            const engineerSignature = signOff.serviceEngineerSignature || fullDetails.serviceEngineerSignature || 'Not signed';

            let currentPage = 1;
            addPageLayout(currentPage);
            let y = 20; // Reduced top margin for more space

            // === PAGE 1: TITLE AND HEADER ===
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(18); // Reduced font size
            doc.setFont('helvetica', 'bold');
            doc.text('PREVENTIVE MAINTENANCE', 15, y, { align: 'left' });
            y += 7;

            doc.setTextColor(120, 120, 140);
            doc.setFontSize(9); // Reduced font size
            doc.setFont('helvetica', 'normal');
            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
            y += 7;

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 8;

            // Report Info Bar - Compact
            doc.setFillColor(240, 245, 255);
            doc.rect(15, y, pageWidth - 30, 8, 'F');
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text(`Report No: ${fullDetails.serviceReportNo || 'N/A'}`, 20, y + 5);
            doc.setTextColor(100, 100, 120);
            doc.setFont('helvetica', 'normal');
            doc.text(`Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`, pageWidth / 2 - 20, y + 5);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, y + 5, { align: 'right' });
            y += 13;

            // === SECTION 1: Report Details ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 3;
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('1. Report Details', 15, y + 4);
            y += 10;

            const reportDetailsLeft = [
                ['Service Report No', fullDetails.serviceReportNo || '-'],
                ['Client Name', fullDetails.clientName || '-'],
                ['Sensor Id', fullDetails.sensorId || '-'],
                ['Engineer Name', fullDetails.engineerName || '-']
            ];

            const reportDetailsRight = [
                ['Service Visit No', fullDetails.serviceVisitNo || '-'],
                ['Site Name', fullDetails.siteName || '-'],
                ['PM Visit Date', formatPDFDate(fullDetails.pmVisitDate)],
                ['']
            ];

            reportDetailsLeft.forEach(([label, value]) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', 17, y + 3);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                const splitValue = doc.splitTextToSize(value || 'N/A', 60);
                doc.text(splitValue, 65, y + 3);
                y += 7;
            });

            y = y - 28;
            let rightY = y + 3;
            reportDetailsRight.forEach(([label, value]) => {
                if (label) {
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(80, 80, 100);
                    doc.text(label + ':', pageWidth / 2 + 10, rightY);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 50);
                    const splitValue = doc.splitTextToSize(value || 'N/A', 55);
                    doc.text(splitValue, pageWidth / 2 + 55, rightY);
                }
                rightY += 7;
            });
            y = rightY + 3;

            // === SECTION 2: Checklists - GROUPED BY CATEGORY (Compact) ===
            if (fullDetails.checklists && fullDetails.checklists.length > 0) {
                const groupedChecklists = {};
                fullDetails.checklists.forEach(item => {
                    const category = item.category || 'General';
                    if (!groupedChecklists[category]) {
                        groupedChecklists[category] = [];
                    }
                    groupedChecklists[category].push(item);
                });

                const categoryKeys = Object.keys(groupedChecklists);

                for (let catIndex = 0; catIndex < categoryKeys.length; catIndex++) {
                    const category = categoryKeys[catIndex];
                    const items = groupedChecklists[category];

                    // Compact height calculation
                    const tableHeight = 8 + 7 + (items.length * 7) + 3;

                    // Check if we need a new page
                    if (y + tableHeight > pageHeight - 35) {
                        // Only create new page if we're on page 1 or 2 and have more content
                        if (currentPage < 3) {
                            currentPage++;
                            doc.addPage();
                            addPageLayout(currentPage);
                            y = 20;
                            doc.setTextColor(79, 70, 229);
                            doc.setFontSize(16);
                            doc.setFont('helvetica', 'bold');
                            doc.text('PREVENTIVE MAINTENANCE', 15, y, { align: 'left' });
                            y += 7;

                            doc.setTextColor(120, 120, 140);
                            doc.setFontSize(9); // Reduced font size
                            doc.setFont('helvetica', 'normal');
                            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                            y += 7;
                        } else {
                            // If on page 3, fit remaining items in available space by reducing font size
                            // Continue on same page with smaller font
                        }
                    }

                    // Category Header - Compact
                    if (y + 15 > pageHeight - 20) {
                        // Force new page if not enough space
                        if (currentPage < 3) {
                            currentPage++;
                            doc.addPage();
                            addPageLayout(currentPage);
                            y = 20;
                            doc.setTextColor(79, 70, 229);
                            doc.setFontSize(16);
                            doc.setFont('helvetica', 'bold');
                            doc.text('PREVENTIVE MAINTENANCE', 15, y, { align: 'left' });
                            y += 7;

                            doc.setTextColor(120, 120, 140);
                            doc.setFontSize(9); // Reduced font size
                            doc.setFont('helvetica', 'normal');
                            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                            y += 7;
                        }
                    }

                    doc.setDrawColor(79, 70, 229);
                    doc.setLineWidth(0.3);
                    doc.line(15, y, pageWidth - 15, y);
                    y += 2;

                    doc.setTextColor(79, 70, 229);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    const categoryDisplay = category.replace(/_/g, ' ').toUpperCase();
                    doc.text(`2.${catIndex + 1} ${categoryDisplay}`, 15, y + 4);
                    y += 8;

                    // Table Header - Compact
                    doc.setFillColor(79, 70, 229);
                    doc.rect(15, y - 2, pageWidth - 30, 6, 'F');
                    doc.setTextColor(255, 255, 255);
                    doc.setFontSize(6);
                    doc.setFont('helvetica', 'bold');
                    doc.text('#', 17, y + 3);
                    doc.text('Item Name', 30, y + 3);
                    doc.text('Status', pageWidth - 70, y + 3, { align: 'center' });
                    doc.text('Remark', pageWidth - 35, y + 3, { align: 'center' });
                    y += 7;

                    // Table Rows - Compact
                    for (let i = 0; i < items.length; i++) {
                        const item = items[i];

                        // Force page break if needed
                        if (y > pageHeight - 20 && currentPage < 3) {
                            currentPage++;
                            doc.addPage();
                            addPageLayout(currentPage);
                            y = 20;
                            doc.setTextColor(79, 70, 229);
                            doc.setFontSize(16);
                            doc.setFont('helvetica', 'bold');
                            doc.text('PREVENTIVE MAINTENANCE', 15, y, { align: 'left' });
                            y += 7;

                            doc.setTextColor(120, 120, 140);
                            doc.setFontSize(9); // Reduced font size
                            doc.setFont('helvetica', 'normal');
                            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                            y += 7;


                            doc.setTextColor(79, 70, 229);
                            doc.setFontSize(10);
                            doc.setFont('helvetica', 'bold');
                            doc.text(`${categoryDisplay} (Continued)`, 15, y + 4);
                            y += 8;
                            // Table Header on new page
                            doc.setFillColor(79, 70, 229);
                            doc.rect(15, y - 2, pageWidth - 30, 6, 'F');
                            doc.setTextColor(255, 255, 255);
                            doc.setFontSize(6);
                            doc.setFont('helvetica', 'bold');
                            doc.text('#', 17, y + 3);
                            doc.text('Item Name', 30, y + 3);
                            doc.text('Status', pageWidth - 70, y + 3, { align: 'center' });
                            doc.text('Remark', pageWidth - 35, y + 3, { align: 'center' });
                            y += 7;
                        }

                        const statusText = item.status || 'NO';
                        const isYes = statusText.toUpperCase() === 'YES';
                        const statusColor = isYes ? [16, 185, 129] : [239, 68, 68];

                        doc.setFontSize(7);
                        doc.setFont('helvetica', 'normal');
                        doc.setTextColor(30, 30, 50);
                        doc.text(`${i + 1}`, 17, y + 3);

                        const itemName = doc.splitTextToSize(item.itemName || '-', pageWidth - 140);
                        doc.text(itemName, 30, y + 3);

                        // Status Badge - Smaller
                        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                        doc.roundedRect(pageWidth - 75, y, 16, 6, 3, 3, 'F');
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(5);
                        doc.setFont('helvetica', 'bold');
                        doc.text(statusText, pageWidth - 67, y + 4, { align: 'center' });

                        doc.setTextColor(30, 30, 50);
                        doc.setFontSize(6);
                        doc.setFont('helvetica', 'normal');
                        const remark = doc.splitTextToSize(item.remark || '-', 30);
                        doc.text(remark, pageWidth - 45, y + 3);

                        y += 7;
                    }
                    y += 3;
                }
            }

            // === PAGE 2: Observations & Recommendations ===
            currentPage++;
            doc.addPage();
            addPageLayout(currentPage);
            y = 20;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('PREVENTIVE MAINTENANCE', 15, y, { align: 'left' });
            y += 7;

            doc.setTextColor(120, 120, 140);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
            y += 7;

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 8;

            // === SECTION 3: Observation ===
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('3. Observation', 15, y + 4);
            y += 8;

            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(2);
            doc.line(17, y, 17, y + 20);

            doc.setTextColor(30, 30, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const observation = doc.splitTextToSize(fullDetails.observation || 'No observation recorded', pageWidth - 50);
            doc.text(observation, 25, y + 3);
            y += 20 + (observation.length * 2.5);

            // === SECTION 4: Recommendation ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 3;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('4. Recommendation', 15, y + 4);
            y += 8;

            doc.setDrawColor(245, 158, 11);
            doc.setLineWidth(2);
            doc.line(17, y, 17, y + 20);

            doc.setTextColor(30, 30, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const recommendation = doc.splitTextToSize(fullDetails.recommendation || 'No recommendation provided', pageWidth - 50);
            doc.text(recommendation, 25, y + 3);
            y += 20 + (recommendation.length * 2.5);

            // === SECTION 5: PM Summary ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 3;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('5. PM Summary', 15, y + 4);
            y += 10;

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('PM Status:', 17, y + 3);

            const statusLabel = statusInfo.label || 'PENDING';
            doc.setTextColor(30, 30, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(statusLabel, 60, y + 3);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Site Condition:', pageWidth / 2 + 10, y + 3);

            doc.setTextColor(30, 30, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            const siteCondition = getSiteConditionDisplay(fullDetails.siteConditionAfterPm);
            doc.text(siteCondition, pageWidth / 2 + 65, y + 3);

            y += 18;

            // === SECTION 6: Sign-Off ===
            // Check if sign-off fits on current page, if not add page 3
            if (y + 45 > pageHeight - 20) {
                currentPage++;
                doc.addPage();
                addPageLayout(currentPage);
                y = 20;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 3;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('6. Sign-Off', 15, y + 4);
            y += 10;

            // Customer signature box - Compact
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 2, (pageWidth - 45) / 2, 30, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Client Representative', 20, y + 4);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Name:', 20, y + 11);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(clientName, 50, y + 11);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Designation:', 20, y + 17);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(clientDesignation, 55, y + 17);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Date:', 20, y + 23);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(clientDate, 40, y + 23);

            doc.setDrawColor(200, 200, 220);
            doc.setLineWidth(0.3);
            doc.line(20, y + 28, 20 + 70, y + 28);
            doc.setTextColor(150, 150, 170);
            doc.setFontSize(6);
            doc.text('Signature', 55, y + 33, { align: 'center' });

            // Technician signature box - Compact
            doc.setFillColor(248, 250, 252);
            doc.rect(pageWidth / 2 + 7, y - 2, (pageWidth - 45) / 2, 30, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Service Engineer', pageWidth / 2 + 12, y + 4);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Name:', pageWidth / 2 + 12, y + 11);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(engineerName, pageWidth / 2 + 42, y + 11);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(7);
            doc.setFont('helvetica', 'bold');
            doc.text('Date:', pageWidth / 2 + 12, y + 17);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(engineerDate, pageWidth / 2 + 35, y + 17);

            doc.setDrawColor(200, 200, 220);
            doc.setLineWidth(0.3);
            doc.line(pageWidth / 2 + 12, y + 28, pageWidth / 2 + 82, y + 28);
            doc.setTextColor(150, 150, 170);
            doc.setFontSize(6);
            doc.text('Signature', pageWidth / 2 + 47, y + 33, { align: 'center' });

            // Generate filename and save
            const fileName = `PM_Report_${fullDetails.serviceReportNo || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            setPdfProgress(100);
            notificationService.reportDownloaded('PM Report', {
                id: fullDetails.id || report.id,
                reportType: 'PM Report',
                reportName: fullDetails.serviceReportNo || report.serviceReportNo,
                customerName: fullDetails.clientName || report.clientName,
                location: fullDetails.siteName || report.siteName,
            });

        } catch (error) {
            console.error("PDF Generation Error:", error);
            notificationService.error(`Failed to generate PDF: ${error.message}`);
        } finally {
            setPdfProgress(0);
        }
    };

    const generatePDF = async (report) => {
        setGeneratingPDF(true);
        await generateProfessionalPDF(report);
        setGeneratingPDF(false);
    };

    // Bulk PDF Download
    const handleBulkPDFDownload = async () => {
        if (selectedReports.length === 0) {
            alert("Please select at least one report to generate PDF.");
            return;
        }

        let successCount = 0;
        let failedCount = 0;

        for (const report of selectedReports) {
            try {
                await generateProfessionalPDF(report);
                successCount++;
            } catch (error) {
                console.error(`Failed to generate PDF for ${report.serviceReportNo}:`, error);
                failedCount++;
            }
        }

        if (failedCount > 0) {
            notificationService.error(`Generated ${successCount} PDFs. Failed: ${failedCount}.`);
        }
        setSelectedReports([]);
        setSelectAll(false);
    };

    // Select handlers
    const handleSelectAll = () => {
        setSelectAll(!selectAll);
        if (!selectAll) {
            setSelectedReports(currentReports.map(r => r));
        } else {
            setSelectedReports([]);
        }
    };

    const handleSelectSingle = (report) => {
        if (selectedReports.find(r => r.id === report.id)) {
            setSelectedReports(selectedReports.filter(r => r.id !== report.id));
        } else {
            setSelectedReports([...selectedReports, report]);
        }
    };

    // ========================================
    // EDIT MODE HANDLERS
    // ========================================
    const startEditing = (report) => {
        let reportToEdit = { ...report };

        if (viewingReport && viewingReport.id === report.id) {
            reportToEdit = { ...viewingReport };
        }

        if (!reportToEdit.checklists || reportToEdit.checklists.length === 0) {
            if (usingMockData) {
                const fullDetails = getMockFullDetails(report.id);
                if (fullDetails) {
                    reportToEdit = { ...reportToEdit, ...fullDetails };
                }
            }
        }

        setEditedReport(reportToEdit);
        setIsEditing(true);
        setEditError(null);
        setEditSuccess(false);
        setShowEditModal(true);
    };

    const cancelEditing = () => {
        setEditedReport(null);
        setIsEditing(false);
        setShowEditModal(false);
        setEditError(null);
        setEditSuccess(false);
    };

    const handleEditFieldChange = (field, value) => {
        setEditedReport(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleChecklistChange = (index, field, value) => {
        setEditedReport(prev => {
            const updatedChecklists = [...(prev.checklists || [])];
            updatedChecklists[index] = {
                ...updatedChecklists[index],
                [field]: value
            };
            return {
                ...prev,
                checklists: updatedChecklists
            };
        });
    };

    const handleAddChecklistItem = () => {
        setEditedReport(prev => ({
            ...prev,
            checklists: [
                ...(prev.checklists || []),
                { category: "", itemName: "", status: "NO", remark: "" }
            ]
        }));
    };

    const handleRemoveChecklistItem = (index) => {
        setEditedReport(prev => {
            const updatedChecklists = [...(prev.checklists || [])];
            updatedChecklists.splice(index, 1);
            return {
                ...prev,
                checklists: updatedChecklists
            };
        });
    };

    const saveEditedReport = async () => {
        if (!editedReport || !editedReport.id) {
            setEditError("Invalid report data");
            return;
        }

        setIsSaving(true);
        setEditError(null);

        try {
            const payload = {
                ...editedReport,
                preventiveMaintenanceStatus: pickPmStatus(editedReport.preventiveMaintenanceStatus),
                siteConditionAfterPm: pickSiteCondition(editedReport.siteConditionAfterPm),
                summary: {
                    preventiveMaintenanceStatus: pickPmStatus(editedReport.preventiveMaintenanceStatus),
                    siteConditionAfterPm: pickSiteCondition(editedReport.siteConditionAfterPm)
                }
            };
            delete payload._original;

            const url = `${API_BASE_URL}${config.apiEndpoint}/${editedReport.id}`;
            const response = await fetch(url, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`Failed to update report: ${response.status}`);
            }

            const updatedData = await response.json();
            invalidate('pm_reports');
            localStorage.removeItem('dashboard_data');
            localStorage.removeItem('dashboard_timestamp');

            setReports(prevReports =>
                prevReports.map(r =>
                    r.id === updatedData.id ? transformSummaryData(updatedData) : r
                )
            );

            if (viewingReport && viewingReport.id === updatedData.id) {
                setViewingReport(transformFullDetails(updatedData));
            }

            setEditSuccess(true);
            setIsEditing(false);
            setShowEditModal(false);
            setEditedReport(null);

            //alert("✅ Report updated successfully!");
            notificationService.reportUpdated('PM Report', {
                id: updatedData.id,
                reportType: 'PM Report',
                reportName: updatedData.serviceReportNo || editedReport.serviceReportNo,
                customerName: updatedData.clientName || editedReport.clientName,
                location: updatedData.siteName || editedReport.siteName,
            });

        } catch (err) {
            console.error("Error updating report:", err);
            setEditError(`Failed to update report: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Action handlers
    const handleView = async (report) => {
        if (!report || !report.id) {
            notificationService.error("Invalid report data");
            return;
        }

        navigate(`/pm-reports/view/${report.id}`);

        try {
            let fullDetails;
            if (usingMockData) {
                fullDetails = getMockFullDetails(report.id);
            } else {
                fullDetails = await fetchReportDetails(report.id);
            }

            if (fullDetails) {
                setViewingReport(fullDetails);
                setShowViewModal(true);
            } else {
                notificationService.error("Could not load report details. Please try again.");
            }
        } catch (error) {
            console.error("❌ Error loading report details:", error);
            notificationService.error(`Failed to load report details: ${error.message}`);
        }
    };

    const handleEdit = (report) => {
        handleEditNavigation(report, navigate);
    };

    const handleDelete = async (id) => {
        if (usingMockData) {
            setReports(reports.filter(report => report.id !== id));
            setShowDeleteModal(false);
            const demoReport = reports.find((item) => item.id === id) || {};
            notificationService.reportDeletedAction('PM Report', {
                id,
                reportType: 'PM Report',
                reportName: demoReport.serviceReportNo,
                customerName: demoReport.clientName,
                location: demoReport.siteName,
            });
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}${config.apiEndpoint}/${id}`, {
                method: 'DELETE',
                headers: getAuthHeaders()
            });

            if (!response.ok) {
                throw new Error(`Failed to delete report: ${response.status}`);
            }

            invalidate('pm_reports');
            localStorage.removeItem('dashboard_data');
            localStorage.removeItem('dashboard_timestamp');
            setReports(reports.filter(report => report.id !== id));
            setShowDeleteModal(false);
            const deletedReport = reports.find((item) => item.id === id) || {};
            notificationService.reportDeletedAction('PM Report', {
                id,
                reportType: 'PM Report',
                reportName: deletedReport.serviceReportNo,
                customerName: deletedReport.clientName,
                location: deletedReport.siteName,
            });
        } catch (err) {
            console.error("Error deleting report:", err);
            notificationService.error(`Failed to delete report: ${err.message}`);
        }
    };

    if (loading) {
        return (
            <div className="view-reports-container">
                <div className="loading-container">
                    <FaSpinner className="spinner" />
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="view-reports-container">
            {/* Header */}
            <div className="reports-header">
                <button className="back-btn" onClick={() => navigate("/dashboard")}>
                    <FaArrowLeft /> Back to Dashboard
                </button>
                <h1>{config.title}</h1>
                <div className="header-actions">
                    {selectedReports.length > 0 && (
                        <button className="bulk-pdf-btn" onClick={handleBulkPDFDownload}>
                            <FaDownload /> Download PDFs ({selectedReports.length})
                        </button>
                    )}
                    <button className="create-btn" onClick={() => navigate("/pm-reports/new")}>
                        <FaPlusCircle /> Create New
                    </button>
                </div>
            </div>

            {/* Filters and Search */}
            <div className="reports-controls">
                <div className="search-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by Report No, Client, Site..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                    {searchTerm && (
                        <button className="clear-search" onClick={() => setSearchTerm("")}>
                            <FaTimes />
                        </button>
                    )}
                </div>

                <div className="filter-wrapper">
                    <FaFilter className="filter-icon" />
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="filter-select"
                    >
                        <option value="ALL">All Status</option>
                        <option value="SATISFACTORY">Satisfactory</option>
                        <option value="FOLLOW_UP_VISIT_REQUIRED">Follow-up Required</option>
                        <option value="REQUIRES_ATTENTION">Requires Attention</option>
                    </select>
                </div>

                <div className="reports-count">
                    Total: {filteredReports.length} reports
                    {usingMockData && <span className="demo-badge"> (Demo Data)</span>}
                </div>

                <button className="refresh-btn" onClick={fetchReports} title="Refresh">
                    <FaSync />
                </button>
            </div>

            {/* Error Message */}
            {error && (
                <div className={`error-message ${usingMockData ? 'warning' : ''}`}>
                    <FaExclamationCircle />
                    <span>{error}</span>
                    <button onClick={fetchReports}>Retry</button>
                </div>
            )}

            {/* Reports Table */}
            {filteredReports.length === 0 ? (
                <div className="no-reports">
                    <div className="no-reports-icon">📋</div>
                    <h3>No Reports Found</h3>
                    <p>There are no reports to display. Create your first report!</p>
                    <button className="create-first-btn" onClick={() => navigate(config.createPath)}>
                        <FaPlusCircle /> Create Report
                    </button>
                </div>
            ) : (
                <div className="table-wrapper">
                    <table className="reports-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="select-checkbox"
                                    />
                                </th>
                                <th style={{ width: '50px' }}>#</th>
                                {config.columns.map(col => (
                                    <th
                                        key={col.key}
                                        onClick={() => handleSort(col.key)}
                                        className={sortConfig.key === col.key ? 'sorted' : ''}
                                    >
                                        {col.label}
                                        {sortConfig.key === col.key && (
                                            <span className="sort-arrow">
                                                {sortConfig.direction === 'asc' ? '↑' : '↓'}
                                            </span>
                                        )}
                                    </th>
                                ))}
                                <th style={{ width: '200px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentReports.map((report, index) => {
                                const isSelected = selectedReports.find(r => r.id === report.id);
                                return (
                                    <tr key={report.id || index} className={isSelected ? 'selected-row' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => handleSelectSingle(report)}
                                                className="select-checkbox"
                                            />
                                        </td>
                                        <td>{indexOfFirstItem + index + 1}</td>
                                        {config.columns.map(col => (
                                            <td key={col.key}>
                                                {col.key === 'pmVisitDate' || col.key === 'createdDate' || col.key === 'calibrationDate' || col.key === 'installationDate' ? (
                                                    formatDate(report[col.key])
                                                ) : col.key === 'siteConditionAfterPm' ? (
                                                    getSiteConditionDisplay(report[col.key])
                                                ) : (
                                                    report[col.key] || "-"
                                                )}
                                            </td>
                                        ))}
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="action-btn view-btn"
                                                    onClick={() => handleView(report)}
                                                    title="View Details"
                                                >
                                                    <FaEye />
                                                    <span className="btn-label">View</span>
                                                </button>
                                                {isAdminUser && (
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEdit(report)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                    <span className="btn-label">Edit</span>
                                                </button>
                                                )}
                                                <button
                                                    className="action-btn pdf-btn"
                                                    onClick={() => generatePDF(report)}
                                                    title="Generate PDF"
                                                    disabled={generatingPDF}
                                                >
                                                    {generatingPDF ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                                                    <span className="btn-label">PDF</span>
                                                </button>
                                                {isAdminUser && (
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => {
                                                        setSelectedReport(report);
                                                        setShowDeleteModal(true);
                                                    }}
                                                    title="Delete"
                                                >
                                                    <FaTrash />
                                                    <span className="btn-label">Delete</span>
                                                </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="pagination">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="page-btn"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}

            {/* View Modal */}
            {showViewModal && viewingReport && (
                <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
                    <div className="modal-content view-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>
                                <FaClipboardList /> Report Details - {viewingReport.serviceReportNo}
                            </h2>
                            <button className="modal-close" onClick={() => setShowViewModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body view-modal-body">
                            {loadingReportDetails ? (
                                <div className="loading-details">
                                    <FaSpinner className="spinner" />
                                    <p>Loading report details...</p>
                                </div>
                            ) : (
                                <div className="view-report-content" ref={reportRef}>
                                    {/* Basic Info */}
                                    <div className="view-section">
                                        <h3 className="view-section-title">
                                            <FaFileAlt /> Basic Information
                                        </h3>
                                        <div className="view-grid">
                                            <div className="view-item">
                                                <label><FaFileAlt /> Report No</label>
                                                <span>{viewingReport.serviceReportNo || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaFileAlt /> Visit No</label>
                                                <span>{viewingReport.serviceVisitNo || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaBuilding /> Client Name</label>
                                                <span>{viewingReport.clientName || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaMapMarkerAlt /> Site Name</label>
                                                <span>{viewingReport.siteName || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaMicrochip /> Sensor ID</label>
                                                <span>{viewingReport.sensorId || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaCalendarAlt /> Visit Date</label>
                                                <span>{viewingReport.pmVisitDate && viewingReport.pmVisitDate !== "-" ? formatDate(viewingReport.pmVisitDate) : "Not Set"}</span>
                                            </div>
                                            <div className="view-item">
                                                <label><FaUser /> Engineer</label>
                                                <span>{viewingReport.engineerName || '-'}</span>
                                            </div>
                                            <div className="view-item">
                                                <label>Status</label>
                                                <span className={`status-badge ${getStatusBadge(viewingReport.preventiveMaintenanceStatus).class}`}>
                                                    {getStatusBadge(viewingReport.preventiveMaintenanceStatus).icon}
                                                    {getStatusBadge(viewingReport.preventiveMaintenanceStatus).label}
                                                </span>
                                            </div>
                                            <div className="view-item">
                                                <label>Site Condition</label>
                                                <span>{getSiteConditionDisplay(viewingReport.siteConditionAfterPm)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observation */}
                                    <div className="view-section">
                                        <h3 className="view-section-title">📝 Observation</h3>
                                        <p className="view-text">{viewingReport.observation || 'No observation added'}</p>
                                    </div>

                                    {/* Recommendation */}
                                    <div className="view-section">
                                        <h3 className="view-section-title">💡 Recommendation</h3>
                                        <p className="view-text">{viewingReport.recommendation || 'No recommendation added'}</p>
                                    </div>

                                    {/* Checklists */}
                                    {viewingReport.checklists && viewingReport.checklists.length > 0 && (
                                        <div className="view-section">
                                            <h3 className="view-section-title">✅ Checklists ({viewingReport.checklists.length})</h3>
                                            <div className="checklists-full">
                                                <table className="checklists-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Category</th>
                                                            <th>Item Name</th>
                                                            <th>Status</th>
                                                            <th>Remark</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {viewingReport.checklists.map((item, idx) => (
                                                            <tr key={idx}>
                                                                <td>{item.category || '-'}</td>
                                                                <td>{item.itemName || '-'}</td>
                                                                <td>
                                                                    <span className={`checklist-status ${item.status === 'YES' ? 'pass' : 'fail'}`}>
                                                                        {item.status || 'NO'}
                                                                    </span>
                                                                </td>
                                                                <td>{item.remark || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* Sign Off */}
                                    {viewingReport.signOff && (
                                        <div className="view-section">
                                            <h3 className="view-section-title">✍️ Sign-Off</h3>
                                            <div className="view-grid">
                                                <div className="view-item">
                                                    <label>Client Representative</label>
                                                    <span>{viewingReport.signOff.clientRepresentativeName || '-'}</span>
                                                </div>
                                                <div className="view-item">
                                                    <label>Designation</label>
                                                    <span>{viewingReport.signOff.designation || '-'}</span>
                                                </div>
                                                <div className="view-item">
                                                    <label>Client Date</label>
                                                    <span>{viewingReport.signOff.clientDate || '-'}</span>
                                                </div>
                                                <div className="view-item">
                                                    <label>Service Engineer</label>
                                                    <span>{viewingReport.signOff.serviceEngineerName || '-'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowViewModal(false)}>
                                Close
                            </button>
                            {isAdminUser && (
                            <button className="btn-edit" onClick={() => {
                                setShowViewModal(false);
                                handleEdit(viewingReport);
                            }}>
                                <FaEdit /> Edit
                            </button>
                            )}
                            <button className="btn-pdf" onClick={() => {
                                generatePDF(viewingReport);
                            }} disabled={generatingPDF}>
                                <FaFilePdf /> {generatingPDF ? 'Generating...' : 'PDF'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editedReport && (
                <div className="modal-overlay" onClick={() => { }}>
                    <div className="modal-content edit-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div className="modal-header">
                            <h2>
                                <FaEdit /> Edit Report - {editedReport.serviceReportNo}
                            </h2>
                            <button className="modal-close" onClick={cancelEditing}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            {/* Basic Info Fields */}
                            <div className="edit-section" style={{ marginBottom: '20px' }}>
                                <h3 style={{ color: '#1a237e', marginBottom: '10px' }}>📋 Basic Information</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Client Name</label>
                                        <input
                                            value={editedReport.clientName || ''}
                                            onChange={(e) => handleEditFieldChange('clientName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Site Name</label>
                                        <input
                                            value={editedReport.siteName || ''}
                                            onChange={(e) => handleEditFieldChange('siteName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Sensor ID</label>
                                        <input
                                            value={editedReport.sensorId || ''}
                                            onChange={(e) => handleEditFieldChange('sensorId', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Engineer Name</label>
                                        <input
                                            value={editedReport.engineerName || ''}
                                            onChange={(e) => handleEditFieldChange('engineerName', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>PM Visit Date</label>
                                        <input
                                            type="date"
                                            value={editedReport.pmVisitDate || ''}
                                            onChange={(e) => handleEditFieldChange('pmVisitDate', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>PM Status</label>
                                        <select
                                            value={editedReport.preventiveMaintenanceStatus || ''}
                                            onChange={(e) => handleEditFieldChange('preventiveMaintenanceStatus', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        >
                                            <option value="">N/A</option>
                                            <option value="SATISFACTORY">Satisfactory</option>
                                            <option value="FOLLOW_UP_VISIT_REQUIRED">Follow-up Required</option>
                                            <option value="REQUIRES_ATTENTION">Requires Attention</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Site Condition</label>
                                        <select
                                            value={editedReport.siteConditionAfterPm || ''}
                                            onChange={(e) => handleEditFieldChange('siteConditionAfterPm', e.target.value)}
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                        >
                                            <option value="">N/A</option>
                                            <option value="SYSTEM_OPERATIONAL">System Operational</option>
                                            <option value="SYSTEM_NOT_OPERATIONAL">System Not Operational</option>
                                            <option value="SYSTEM_OPERATIONAL_WITH_OBSERVATION">Operational with Observation</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Observation & Recommendation */}
                            <div className="edit-section" style={{ marginBottom: '20px' }}>
                                <h3 style={{ color: '#1a237e', marginBottom: '10px' }}>📝 Observation & Recommendation</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Observation</label>
                                        <textarea
                                            value={editedReport.observation || ''}
                                            onChange={(e) => handleEditFieldChange('observation', e.target.value)}
                                            rows="3"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0', resize: 'vertical' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Recommendation</label>
                                        <textarea
                                            value={editedReport.recommendation || ''}
                                            onChange={(e) => handleEditFieldChange('recommendation', e.target.value)}
                                            rows="3"
                                            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #d0d0d0', resize: 'vertical' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Checklists Section */}
                            <div className="edit-section">
                                <h3 style={{ color: '#1a237e', marginBottom: '10px' }}>
                                    ✅ Checklists ({editedReport.checklists?.length || 0})
                                </h3>
                                <div style={{
                                    maxHeight: '300px',
                                    overflowY: 'auto',
                                    border: '1px solid #e0e0e0',
                                    borderRadius: '8px',
                                    padding: '10px'
                                }}>
                                    {editedReport.checklists && editedReport.checklists.map((item, index) => (
                                        <div key={index} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '1fr 1fr 0.5fr 1fr auto',
                                            gap: '8px',
                                            padding: '8px',
                                            borderBottom: '1px solid #e0e0e0',
                                            alignItems: 'center'
                                        }}>
                                            <input
                                                value={item.category || ''}
                                                onChange={(e) => handleChecklistChange(index, 'category', e.target.value)}
                                                placeholder="Category"
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                            />
                                            <input
                                                value={item.itemName || ''}
                                                onChange={(e) => handleChecklistChange(index, 'itemName', e.target.value)}
                                                placeholder="Item Name"
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                            />
                                            <select
                                                value={item.status || 'NO'}
                                                onChange={(e) => handleChecklistChange(index, 'status', e.target.value)}
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                            >
                                                <option value="YES">YES</option>
                                                <option value="NO">NO</option>
                                            </select>
                                            <input
                                                value={item.remark || ''}
                                                onChange={(e) => handleChecklistChange(index, 'remark', e.target.value)}
                                                placeholder="Remark"
                                                style={{ padding: '6px', borderRadius: '4px', border: '1px solid #d0d0d0' }}
                                            />
                                            <button
                                                onClick={() => handleRemoveChecklistItem(index)}
                                                style={{
                                                    background: '#ef4444',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    cursor: 'pointer',
                                                    fontSize: '12px'
                                                }}
                                            >
                                                <FaMinus />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={handleAddChecklistItem}
                                    style={{
                                        marginTop: '10px',
                                        padding: '8px 16px',
                                        background: '#4F46E5',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        fontSize: '13px'
                                    }}
                                >
                                    <FaPlus /> Add Checklist Item
                                </button>
                            </div>

                            {editError && (
                                <div style={{
                                    marginTop: '10px',
                                    padding: '10px',
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    borderRadius: '4px',
                                    border: '1px solid #fecaca'
                                }}>
                                    ❌ {editError}
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={cancelEditing}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn-save"
                                onClick={saveEditedReport}
                                disabled={isSaving}
                                style={{
                                    padding: '10px 24px',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: isSaving ? 'not-allowed' : 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}
                            >
                                {isSaving ? <FaSpinner className="spinning" /> : <FaSave />}
                                {isSaving ? 'Saving...' : 'Save All Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && selectedReport && (
                <div className="modal-overlay">
                    <div className="modal-content delete-modal">
                        <div className="modal-header">
                            <h2>Confirm Delete</h2>
                            <button className="modal-close" onClick={() => setShowDeleteModal(false)}>
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="delete-icon">🗑️</div>
                            <p>Are you sure you want to delete this report?</p>
                            <div className="report-summary">
                                <p><strong>Report No:</strong> {selectedReport.serviceReportNo || "N/A"}</p>
                                <p><strong>Client:</strong> {selectedReport.clientName || "N/A"}</p>
                                <p><strong>Site:</strong> {selectedReport.siteName || "N/A"}</p>
                            </div>
                            <p className="warning-text">⚠️ This action cannot be undone.</p>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn-delete" onClick={() => handleDelete(selectedReport.id)}>
                                <FaTrash /> Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}