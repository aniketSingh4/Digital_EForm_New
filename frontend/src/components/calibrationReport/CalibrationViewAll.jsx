import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import {
    FaEye,
    FaEdit,
    FaFilePdf,
    FaTrash,
    FaSearch,
    FaChevronLeft,
    FaChevronRight,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaArrowLeft,
    FaClock,
    FaTimes,
    FaCheckCircle,
    FaSpinner,
    FaSync,
    FaPlusCircle,
    FaTools
} from "react-icons/fa";
import { calibrationReportService } from "../../services/calibrationReportService";
import notificationService from "../../services/notificationService";
import jsPDF from 'jspdf';
import "./CalibrationViewAll.css";

const CalibrationViewAll = () => {
    const navigate = useNavigate();
    const [reports, setReports] = useState([]);
    const [filteredReports, setFilteredReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortField, setSortField] = useState('reportDate');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedReports, setSelectedReports] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [filterOptions, setFilterOptions] = useState({
        status: 'all',
        dateRange: 'all',
        clientName: ''
    });

    const getReportId = (report) => {
        if (!report) return null;
        return report.id || report._id || report.reportId || report.calibrationId || null;
    };

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [reports, searchTerm, filterOptions]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('Fetching reports...');
            let data = await calibrationReportService.getAllReports();

            console.log('Raw API Response:', data);

            // Ensure data is an array
            if (!Array.isArray(data)) {
                console.warn('Data is not an array, converting...');
                if (data && typeof data === 'object') {
                    if (data.data && Array.isArray(data.data)) {
                        data = data.data;
                    } else if (data.reports && Array.isArray(data.reports)) {
                        data = data.reports;
                    } else if (data.results && Array.isArray(data.results)) {
                        data = data.results;
                    } else {
                        data = [data];
                    }
                } else {
                    data = [];
                }
            }

            console.log('Reports fetched:', data.length);

            // Map the data to ensure consistent field names
            const mappedData = data.map(report => ({
                ...report,
                id: report.id || report._id || report.reportId,
                reportNo: report.reportNo || 'N/A',
                clientName: report.clientName || 'N/A',
                siteName: report.siteName || 'N/A',
                sensorId: report.sensorId || 'N/A',
                modelNo: report.modelNo || 'N/A',
                calibrationDate: report.calibrationDate || report.reportDate,
                reportDate: report.reportDate || new Date().toISOString(),
                calibrationSummary: report.calibrationSummary || {
                    calibrationSuccessful: false,
                    sensorRequiresReplacement: false,
                    calibrationAdjustmentPerformed: false,
                    sensorWithinAcceptableLimits: false
                }
            }));

            console.log('Mapped data:', mappedData.length);
            setReports(mappedData);
            setFilteredReports(mappedData);

            if (mappedData.length === 0) {
                notificationService.info('No reports found. Create your first calibration report!');
            }

        } catch (err) {
            console.error('Error fetching reports:', err);
            setError('Failed to load reports. Please try again.');
            notificationService.error('Failed to fetch reports');
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...reports];

        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(report =>
                report.reportNo?.toLowerCase().includes(term) ||
                report.clientName?.toLowerCase().includes(term) ||
                report.siteName?.toLowerCase().includes(term) ||
                report.sensorId?.toLowerCase().includes(term) ||
                report.modelNo?.toLowerCase().includes(term)
            );
        }

        if (filterOptions.status !== 'all') {
            filtered = filtered.filter(report => {
                const summary = report.calibrationSummary;
                switch (filterOptions.status) {
                    case 'successful':
                        return summary?.calibrationSuccessful;
                    case 'needs-replacement':
                        return summary?.sensorRequiresReplacement;
                    case 'adjusted':
                        return summary?.calibrationAdjustmentPerformed;
                    case 'pending':
                        return !summary?.calibrationSuccessful && !summary?.sensorRequiresReplacement;
                    default:
                        return true;
                }
            });
        }

        if (filterOptions.dateRange !== 'all') {
            const now = new Date();
            filtered = filtered.filter(report => {
                const date = new Date(report.calibrationDate);
                switch (filterOptions.dateRange) {
                    case 'today':
                        return date.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return date >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now);
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        return date >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        if (filterOptions.clientName) {
            filtered = filtered.filter(report =>
                report.clientName?.toLowerCase().includes(filterOptions.clientName.toLowerCase())
            );
        }

        setFilteredReports(filtered);
        setCurrentPage(1);
    };

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const getSortIcon = (field) => {
        if (sortField !== field) return <FaSort className="sort-icon" />;
        return sortDirection === 'asc' ?
            <FaSortUp className="sort-icon active" /> :
            <FaSortDown className="sort-icon active" />;
    };

    const handleDelete = async (report) => {
        const reportId = getReportId(report);
        if (!reportId) {
            notificationService.error('Could not find report ID');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete report ${report.reportNo}?`)) return;

        try {
            setActionLoading(reportId);
            await calibrationReportService.deleteReport(reportId);
            setSelectedReports(selectedReports.filter(id => id !== reportId));
            notificationService.reportDeleted('Calibration Report', reportId);
            notificationService.success('Report deleted successfully!');
            fetchReports();
        } catch (error) {
            notificationService.error('Failed to delete Calibration Report');
        } finally {
            setActionLoading(null);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedReports.length === 0) {
            notificationService.warning('Please select at least one report to delete.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedReports.length} selected report(s)?`)) return;

        try {
            setActionLoading('bulk');
            for (const id of selectedReports) {
                await calibrationReportService.deleteReport(id);
            }
            setSelectedReports([]);
            setSelectAll(false);
            notificationService.bulkDeleted(selectedReports.length);
            fetchReports();
        } catch (error) {
            notificationService.error('Failed to delete selected reports');
        } finally {
            setActionLoading(null);
        }
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedReports([]);
        } else {
            const ids = paginatedReports
                .map(report => getReportId(report))
                .filter(id => id !== null);
            setSelectedReports(ids);
        }
        setSelectAll(!selectAll);
    };

    const handleSelect = (report) => {
        const reportId = getReportId(report);
        if (!reportId) return;

        if (selectedReports.includes(reportId)) {
            setSelectedReports(selectedReports.filter(id => id !== reportId));
        } else {
            setSelectedReports([...selectedReports, reportId]);
        }
    };

    const handleView = (report) => {
        const reportId = getReportId(report);
        if (!reportId) {
            notificationService.error('Could not find report ID');
            return;
        }
        navigate(`/calibration-reports/view/${reportId}`);
    };

    const handleEdit = (report) => {
        const reportId = getReportId(report);
        if (!reportId) {
            notificationService.error('Could not find report ID');
            return;
        }
        navigate(`/calibration-reports/edit/${reportId}`);
    };

    const handlePDF = async (report) => {
        const reportId = getReportId(report);
        if (!reportId) {
            notificationService.error('Could not find report ID');
            return;
        }

        try {
            setActionLoading(`pdf-${reportId}`);
           // console.log('Generating PDF for report:', reportId);

            // Fetch full report details - using the same pattern as Previsit
            const response = await fetch(`https://calibration-reports.onrender.com/api/calibration-reports/${reportId}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const fullReport = await response.json();
            //console.log('📄 Full Report Data for PDF:', fullReport);

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Load images as base64 - SAME as working Previsit code
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

            // Load both images - SAME as working Previsit code
            const [backgroundImage, headerImage] = await Promise.all([
                loadImageAsBase64('/bg-img.webp'),
                loadImageAsBase64('/header.webp')
            ]);

            //console.log('📄 Background image loaded:', backgroundImage ? '✅' : '❌');
            //console.log('📄 Header image loaded:', headerImage ? '✅' : '❌');

            // Helper function to safely convert any value to string
            const safeString = (value) => {
                if (value === null || value === undefined) return '-';
                return String(value);
            };

            // Helper function to format date
            const formatDate = (dateStr) => {
                if (!dateStr) return '-';
                try {
                    const d = new Date(dateStr);
                    if (isNaN(d.getTime())) return dateStr;
                    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
                } catch {
                    return dateStr;
                }
            };

            // Function to add background image, header, and footer - SAME as working Previsit code
            const addPageLayout = (pageNum) => {
                // Add Background Image - Centered and Smaller (Watermark style)
                if (backgroundImage) {
                    try {
                        const bgWidth = pageWidth * 0.45;
                        const bgHeight = pageHeight * 0.35;
                        const x = (pageWidth - bgWidth) / 2;
                        const y = (pageHeight - bgHeight) / 2;

                        doc.setGState(new doc.GState({ opacity: 0.5 }));
                        doc.addImage(backgroundImage, 'WEBP', x, y, bgWidth, bgHeight);
                        doc.setGState(new doc.GState({ opacity: 5.0 }));
                    } catch (error) {
                        console.warn('Failed to add background image:', error);
                    }
                }

                // Add Header Image - Top Right Side
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

                // Add Version ID in Footer (bottom left)
                doc.setTextColor(150, 150, 170);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text('FESPL/26-27/V01', 15, pageHeight - 10);

                // Add Pagination in Footer (bottom center)
                doc.setTextColor(150, 150, 170);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

                // Add FORM-III in Footer (bottom right)
                doc.setTextColor(150, 150, 170);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('FORM-III', pageWidth - 15, pageHeight - 10, { align: 'right' });
            };

            let currentPage = 1;

            // Add initial page layout
            addPageLayout(currentPage);
            let y = 25;

            // === PAGE 1: TITLE AND HEADER ===
            // Main Title - Left Aligned
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
            y += 8;

            // Subtitle
            doc.setTextColor(120, 120, 140);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
            y += 8;

            // Decorative line
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 10;

            // Report Info Bar
            doc.setFillColor(240, 245, 255);
            doc.rect(15, y, pageWidth - 30, 9, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`Report No: ${safeString(fullReport.reportNo)}`, 20, y + 6);

            doc.setTextColor(100, 100, 120);
            doc.setFont('helvetica', 'normal');
            doc.text(`Report Date: ${formatDate(fullReport.reportDate)}`, pageWidth / 2 - 30, y + 6);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

            y += 15;

            // ===== SECTION 1: Report Details =====
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.3);
            doc.line(14, y, pageWidth - 14, y);
            y += 3;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('1. Report Details', 14, y + 4);
            y += 9;

            // Two column layout with consistent spacing
            const leftLabels = ['Report No', 'Client Name', 'Site Name', 'Site Address'];
            const leftValues = [
                safeString(fullReport.reportNo),
                safeString(fullReport.clientName),
                safeString(fullReport.siteName),
                safeString(fullReport.siteAddress)
            ];

            const rightLabels = ['Report Date', 'Calibration Date', 'Calibration Due Date', 'Sensor ID'];
            const rightValues = [
                formatDate(fullReport.reportDate),
                formatDate(fullReport.calibrationDate),
                formatDate(fullReport.calibrationDueDate),
                safeString(fullReport.sensorId)
            ];

            // Left column - aligned properly
            leftLabels.forEach((label, index) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', 16, y + 3);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                const splitVal = doc.splitTextToSize(leftValues[index] || '-', 55);
                doc.text(splitVal, 50, y + 3);
                y += 7;
            });

            // Right column - aligned properly
            let rightY = y - (leftLabels.length * 7);
            rightLabels.forEach((label, index) => {
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', pageWidth / 2 + 8, rightY + 3);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                const splitVal = doc.splitTextToSize(rightValues[index] || '-', 50);
                doc.text(splitVal, pageWidth / 2 + 45, rightY + 3);
                rightY += 7;
            });

            y = Math.max(y, rightY) + 5;

            // === SECTION 2: Master Reference Instrument ===
            if (y > pageHeight - 40) {
                currentPage++;
                doc.addPage();
                addPageLayout(currentPage);
                y = 25;
                // Re-add title on new page
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
                y += 8;

                // Subtitle
                doc.setTextColor(120, 120, 140);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                y += 8;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('2. Certificate Details', 15, y + 5);
            y += 11;

            const masterRef = fullReport.masterRefInstrument || {};
            const masterDetails = [
                //['Ref Serial No', safeString(masterRef.refSerialNo)],
                ['Calibration Certificate No', safeString(masterRef.calibrationCertificateNo)],
                ['Certificate Validity', safeString(masterRef.certificateValidity)]
            ];

            masterDetails.forEach(([label, value]) => {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', 17, y + 4);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                doc.text(value || 'N/A', 83, y + 4);
                y += 8;
            });

            y += 5;

            // === SECTION 3: Readings ===
            if (y > pageHeight - 80) {
                currentPage++;
                doc.addPage();
                addPageLayout(currentPage);
                y = 25;
                // Re-add title on new page
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
                y += 8;

                // Subtitle
                doc.setTextColor(120, 120, 140);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                y += 8;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('3. Readings', 15, y + 5);
            y += 11;

            // Readings Table Header
            doc.setFillColor(79, 70, 229);
            doc.rect(15, y - 2, pageWidth - 30, 7, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('Parameter', 17, y + 4);
            doc.text('Before Calibration', 65, y + 4);
            doc.text('After Calibration', 115, y + 4);
            doc.text('Status', pageWidth - 25, y + 4, { align: 'center' });
            y += 9;

            const before = fullReport.readingBeforeCalibration || {};
            const after = fullReport.readingAfterCalibration || {};

            const readingData = [
                { param: 'PM2.5 Value', before: safeString(before.pm25Value), after: safeString(after.pm25Value) },
                { param: 'PM10 Value', before: safeString(before.pm10Value), after: safeString(after.pm10Value) },
                { param: 'Temp (°C)', before: safeString(before.temp), after: safeString(after.temp) },
                { param: 'Humidity (%)', before: safeString(before.humidity), after: safeString(after.humidity) }
            ];

            readingData.forEach((item, index) => {

                // Parameter
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(30, 30, 50);
                doc.text(item.param, 17, y + 4);

                // Before Calibration
                doc.setFont('helvetica', 'normal');
                doc.text(item.before, 65, y + 4);

                // After Calibration
                doc.text(item.after, 115, y + 4);

                // Status indicator
                const beforeNum = parseFloat(item.before);
                const afterNum = parseFloat(item.after);
                let status = '—';
                let statusColor = [150, 150, 170];

                if (!isNaN(beforeNum) && !isNaN(afterNum)) {
                    if (afterNum <= beforeNum) {
                        status = 'Improved';
                        statusColor = [16, 185, 129];
                    } else {
                        status = 'Changed';
                        statusColor = [245, 158, 11];
                    }
                }

                doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
                doc.text(status, pageWidth - 25, y + 4, { align: 'center' });

                y += 9;
            });

            y += 5;

            // === PAGE 2: Calibration Summary ===
            currentPage++;
            doc.addPage();
            addPageLayout(currentPage);
            y = 25;

            // Re-add title on new page
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
            y += 8;

            // Subtitle
            doc.setTextColor(120, 120, 140);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
            y += 8;

            // === SECTION 4: Calibration Summary ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('4. Calibration Summary', 15, y + 5);
            y += 11;

            const summary = fullReport.calibrationSummary || {};

            const summaryData = [
                { label: 'Calibration Successful', value: summary.calibrationSuccessful ? 'Yes' : 'No' },
                { label: 'Calibration Adjustment Performed', value: summary.calibrationAdjustmentPerformed ? 'Yes' : 'No' },
                { label: 'Sensor Within Acceptable Limits', value: summary.sensorWithinAcceptableLimits ? 'Yes' : 'No' },
                { label: 'Sensor Requires Replacement', value: summary.sensorRequiresReplacement ? 'Yes' : 'No' }
            ];

            summaryData.forEach((item, index) => {
                if (index % 2 === 0) {
                    doc.setFillColor(248, 250, 252);
                    doc.rect(15, y - 1, pageWidth - 30, 8, 'F');
                }

                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(item.label + ':', 17, y + 4);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                doc.text(item.value, 83, y + 4);

                y += 9;
            });

            y += 5;

            // === SECTION 5: Remarks ===
            if (fullReport.remarks) {
                if (y > pageHeight - 40) {
                    currentPage++;
                    doc.addPage();
                    addPageLayout(currentPage);
                    y = 25;
                    doc.setTextColor(79, 70, 229);
                    doc.setFontSize(16);
                    doc.setFont('helvetica', 'bold');
                    doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
                    y += 8;

                    // Subtitle
                    doc.setTextColor(120, 120, 140);
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                    y += 8;
                }

                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.5);
                doc.line(15, y, pageWidth - 15, y);
                y += 4;

                doc.setTextColor(79, 70, 229);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('5. Remarks', 15, y + 5);
                y += 10;

                // Draw orange vertical line
                doc.setDrawColor(245, 158, 11);
                doc.setLineWidth(2);
                doc.line(17, y, 17, y + 20);

                doc.setTextColor(30, 30, 50);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const remarks = doc.splitTextToSize(safeString(fullReport.remarks || 'No remarks'), pageWidth - 50);
                doc.text(remarks, 25, y + 4);
                y += 25 + (remarks.length * 4);
            }

            // === SECTION 6: Declaration ===
            if (y > pageHeight - 50) {
                currentPage++;
                doc.addPage();
                addPageLayout(currentPage);
                y = 25;
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
                y += 8;

                // Subtitle
                doc.setTextColor(120, 120, 140);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                y += 8;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('6. Declaration', 15, y + 5);
            y += 10;

            // Draw green vertical line only - no box
            doc.setDrawColor(16, 185, 129);
            doc.setLineWidth(2);
            doc.line(17, y, 17, y + 18);

            doc.setTextColor(30, 30, 50);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            const declaration = doc.splitTextToSize(
                'The calibration activity was carried out using a calibrated reference instrument traceable to applicable standards. ' +
                'The readings recorded above represent the observed values before and after calibration. ' +
                'Any observations and recommendations have been documented for necessary action.',
                pageWidth - 50
            );
            doc.text(declaration, 25, y + 4);
            y += 22 + (declaration.length * 4);

            // === SECTION 7: Sign-Off ===
            if (y > pageHeight - 70) {
                currentPage++;
                doc.addPage();
                addPageLayout(currentPage);
                y = 25;
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                doc.text('CALIBRATION REPORT', 15, y, { align: 'left' });
                y += 8;

                // Subtitle
                doc.setTextColor(120, 120, 140);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
                y += 8;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('7. Sign-Off', 15, y + 5);
            y += 11;

            const engineer = fullReport.engineerDetails || {};

            // Calibration Engineer signature box - LEFT SIDE
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 2, (pageWidth - 45) / 2, 40, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Calibration Engineer', 20, y + 5);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Name:', 20, y + 14);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(safeString(engineer.engineerName), 50, y + 14);

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Date:', 20, y + 22);
            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(formatDate(engineer.date), 50, y + 22);

            // Signature line
            doc.setDrawColor(200, 200, 220);
            doc.setLineWidth(0.5);
            doc.line(20, y + 30, 20 + 70, y + 30);
            doc.setTextColor(150, 150, 170);
            doc.setFontSize(7);
            doc.text('Signature', 55, y + 35, { align: 'center' });

            if (engineer.signature) {
                doc.setTextColor(79, 70, 229);
                doc.setFontSize(10);
                doc.setFont('helvetica', 'italic');
                doc.text(safeString(engineer.signature), 45, y + 30);
            }

            // Generate filename and save
            const fileName = `Calibration_Report_${safeString(fullReport.reportNo || 'Report')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(fileName);

            toast.success('PDF generated successfully!');
            //notificationService.pdfGenerated(fullReport.reportNo || 'Calibration Report');

        } catch (error) {
            console.error("PDF Generation Error:", error);
        } finally {
            setActionLoading(null);
        }
    };

    const handleCreateNew = () => {
        navigate('/calibration-reports/new');
    };

    const resetFilters = () => {
        setFilterOptions({
            status: 'all',
            dateRange: 'all',
            clientName: ''
        });
        setSearchTerm('');
        setCurrentPage(1);
    };

    const sortedReports = useMemo(() => {
        const sorted = [...filteredReports].sort((a, b) => {
            let aVal = a[sortField] || '';
            let bVal = b[sortField] || '';

            if (sortField === 'calibrationDate' || sortField === 'reportDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            }

            if (typeof aVal === 'string') aVal = aVal.toLowerCase();
            if (typeof bVal === 'string') bVal = bVal.toLowerCase();

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [filteredReports, sortField, sortDirection]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedReports = sortedReports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(sortedReports.length / itemsPerPage);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatusBadge = (report) => {
        const summary = report.calibrationSummary;
        if (!summary) {
            return { label: 'Pending', className: 'status-pending', icon: <FaClock /> };
        }
        if (summary.calibrationSuccessful) {
            return { label: 'Successful', className: 'status-success', icon: <FaCheckCircle /> };
        } else if (summary.sensorRequiresReplacement) {
            return { label: 'Needs Replacement', className: 'status-danger', icon: <FaTimes /> };
        } else if (summary.calibrationAdjustmentPerformed) {
            return { label: 'Adjusted', className: 'status-warning', icon: <FaTools /> };
        } else {
            return { label: 'Pending', className: 'status-pending', icon: <FaClock /> };
        }
    };

    if (loading) {
        return (
            <div className="view-reports-container">
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading reports...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="view-reports-container">
                <div className="error-message">
                    <div className="error-icon">⚠️</div>
                    <span>{error}</span>
                    <button onClick={fetchReports}>Retry</button>
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
                <h1>Calibration Reports</h1>
                <div className="header-actions">
                    {selectedReports.length > 0 && (
                        <button className="bulk-delete-btn" onClick={handleBulkDelete}>
                            <FaTrash /> Delete ({selectedReports.length})
                        </button>
                    )}
                    <button className="create-btn" onClick={handleCreateNew}>
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
                        placeholder="Search by Report No, Client, Site, Sensor..."
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

                <div className="reports-count">
                    Total: {filteredReports.length} reports
                </div>

                <button className="refresh-btn" onClick={fetchReports} title="Refresh">
                    <FaSync />
                </button>
            </div>

            {/* Reports Table */}
            {filteredReports.length === 0 ? (
                <div className="no-reports">
                    <div className="no-reports-icon">📋</div>
                    <h3>No Reports Found</h3>
                    <p>There are no calibration reports to display. Create your first report!</p>
                    <button className="create-first-btn" onClick={handleCreateNew}>
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
                                <th style={{ width: '60px' }}>#</th>
                                <th onClick={() => handleSort('reportNo')} className="sortable">
                                    Report No {getSortIcon('reportNo')}
                                </th>
                                <th onClick={() => handleSort('clientName')} className="sortable">
                                    Client {getSortIcon('clientName')}
                                </th>
                                <th onClick={() => handleSort('siteName')} className="sortable">
                                    Site {getSortIcon('siteName')}
                                </th>
                                <th onClick={() => handleSort('calibrationDate')} className="sortable">
                                    Cal. Date {getSortIcon('calibrationDate')}
                                </th>
                                <th onClick={() => handleSort('sensorId')} className="sortable">
                                    Sensor ID {getSortIcon('sensorId')}
                                </th>
                                <th>Status</th>
                                <th style={{ width: '220px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReports.map((report, index) => {
                                const reportId = getReportId(report);
                                if (!reportId) return null;
                                const isSelected = selectedReports.find(r => r === reportId);
                                const status = getStatusBadge(report);
                                return (
                                    <tr key={reportId || index} className={isSelected ? 'selected-row' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => handleSelect(report)}
                                                className="select-checkbox"
                                            />
                                        </td>
                                        <td>{indexOfFirstItem + index + 1}</td>
                                        <td className="report-id">{report.reportNo}</td>
                                        <td className="company-name">
                                            <span className="company-text">{report.clientName || '-'}</span>
                                        </td>
                                        <td>{report.siteName || '-'}</td>
                                        <td>{formatDate(report.calibrationDate)}</td>
                                        <td>{report.sensorId || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${status.className}`}>
                                                {status.icon} {status.label}
                                            </span>
                                        </td>
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
                                                <button
                                                    className="action-btn edit-btn"
                                                    onClick={() => handleEdit(report)}
                                                    title="Edit"
                                                >
                                                    <FaEdit />
                                                    <span className="btn-label">Edit</span>
                                                </button>
                                                <button
                                                    className="action-btn pdf-btn"
                                                    onClick={() => handlePDF(report)}
                                                    title="Generate PDF"
                                                    disabled={actionLoading === `pdf-${reportId}`}
                                                >
                                                    {actionLoading === `pdf-${reportId}` ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                                                    <span className="btn-label">PDF</span>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDelete(report)}
                                                    title="Delete"
                                                    disabled={actionLoading === reportId}
                                                >
                                                    {actionLoading === reportId ? <FaSpinner className="spinning" /> : <FaTrash />}
                                                    <span className="btn-label">Delete</span>
                                                </button>
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
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="page-btn"
                    >
                        <FaChevronRight />
                    </button>
                </div>
            )}
        </div>
    );
};

export default CalibrationViewAll;