// src/pages/PreVisitViewAll.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePreVisitReports } from "../hooks/usePreVisitReports";
import {
    FaEye,
    FaEdit,
    FaFilePdf,
    FaTrash,
    FaSearch,
    FaPrint,
    FaDownload,
    FaChevronLeft,
    FaChevronRight,
    FaSort,
    FaSortUp,
    FaSortDown,
    FaArrowLeft,
    FaPlus,
    FaFileAlt,
    FaClock,
    FaTimes,
    FaCheckCircle,
    FaSpinner,
    FaSync,
    FaFilter,
    FaPlusCircle
} from "react-icons/fa";
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import "../assets/PreVisitViewAll.css";
import notificationService from "../services/notificationService";

const PreVisitViewAll = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const [sortField, setSortField] = useState('id');
    const [sortDirection, setSortDirection] = useState('desc');
    const [selectedReports, setSelectedReports] = useState([]);
    const [selectAll, setSelectAll] = useState(false);
    const [filterStatus, setFilterStatus] = useState("ALL");
    const [animateCard, setAnimateCard] = useState(false);
    const [actionLoading, setActionLoading] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);

    const {
        reports,
        loading,
        error,
        totalCount,
        deleteReport,
        searchReports,
        fetchReports
    } = usePreVisitReports();

    useEffect(() => {
        fetchReports();
        setTimeout(() => setAnimateCard(true), 100);
    }, []);

    // Handle search
    const handleSearch = async (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        setCurrentPage(1);
        if (value.trim()) {
            await searchReports(value);
        } else {
            await fetchReports();
        }
    };

    // Handle sort
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

    // Handle Delete
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this report?')) {
            try {
                setActionLoading(id);
                await deleteReport(id);
                setSelectedReports(selectedReports.filter(reportId => reportId !== id));
                notificationService.success('Report deleted successfully!', { type: 'REPORT_DELETED', identifier: id });
            } catch (error) {
                notificationService.error('Failed to delete report. Please try again.', { type: 'REPORT_DELETION_FAILED', identifier: id });
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Handle Bulk Delete
    const handleBulkDelete = async () => {
        if (selectedReports.length === 0) {
            alert('Please select at least one report to delete.');
            return;
        }

        if (window.confirm(`Are you sure you want to delete ${selectedReports.length} selected report(s)?`)) {
            try {
                setActionLoading('bulk');
                for (const id of selectedReports) {
                    await deleteReport(id);
                }
                setSelectedReports([]);
                setSelectAll(false);
                notificationService.success(`✅ ${selectedReports.length} report(s) deleted successfully!`, { type: 'REPORTS_DELETED', identifier: selectedReports });
            } catch (error) {
                notificationService.error('❌ Failed to delete selected reports. Please try again.', { type: 'REPORTS_DELETION_FAILED', identifier: selectedReports });
            } finally {
                setActionLoading(null);
            }
        }
    };

    // Handle Select All
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedReports([]);
        } else {
            setSelectedReports(paginatedReports.map(report => report.id));
        }
        setSelectAll(!selectAll);
    };

    // Handle Single Select
    const handleSelect = (id) => {
        if (selectedReports.includes(id)) {
            setSelectedReports(selectedReports.filter(reportId => reportId !== id));
        } else {
            setSelectedReports([...selectedReports, id]);
        }
    };

    // In PreVisitViewAll.jsx, the handleView and handleEdit should be:
    const handleView = (report) => {
        navigate(`/previsit/${report.id}`);
    };

    const handleEdit = (report) => {
        navigate(`/previsit/edit/${report.id}`);
    };

    // Generate system filename
    const generateFileName = (reportData) => {
        const date = new Date().toISOString().split('T')[0];
        const companyName = reportData.companyName || 'Report';
        const reportId = reportData.id || '000';
        const sanitizedCompany = companyName.replace(/[^a-zA-Z0-9]/g, '_');
        return `PreVisit_Report_${sanitizedCompany}_${reportId}_${date}.pdf`;
    };

    // PDF Generation
    const handlePDF = async (report) => {
        try {
            setActionLoading(`pdf-${report.id}`);
            console.log('📄 Generating PDF for report:', report.id);

            const response = await fetch(`http://localhost:8088/api/previsit-reports/${report.id}`, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch report data');
            }

            const reportData = await response.json();

            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

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

            // Function to add background image, header, and footer
            const addPageLayout = () => {
                // Add Background Image - Centered and Smaller
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

                // Add FORM-II in Footer (bottom right)
                doc.setTextColor(150, 150, 170);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('FORM-II', pageWidth - 15, pageHeight - 10, { align: 'right' });
            };

            // Add initial page layout
            addPageLayout();

            // === TITLE SECTION ===
            let y = 22;

            // Main Title - Left Aligned
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text('PRE VISIT REPORT', 15, y, { align: 'left' });
            y += 8;

            // Subtitle - Left Aligned
            doc.setTextColor(120, 120, 140);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Digital Installation & PM Visit E-Form System', 15, y, { align: 'left' });
            y += 8;

            // Decorative line
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 8;

            // Report Info Bar
            doc.setFillColor(240, 245, 255);
            doc.rect(15, y, pageWidth - 30, 9, 'F');

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text(`Report ID: #${String(reportData.id || '000').padStart(3, '0')}`, 20, y + 6);

            doc.setTextColor(100, 100, 120);
            doc.setFont('helvetica', 'normal');
            doc.text(`Visit Date: ${reportData.visitDate || 'N/A'}`, pageWidth / 2 - 30, y + 6);
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

            y += 15;

            // === BASIC DETAILS ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('BASIC DETAILS', 15, y + 5);
            y += 11;

            // Display basic details in two columns
            const detailsLeft = [
                ['Company Name', reportData.companyName || 'N/A'],
                ['Site Address', reportData.siteAddress || 'N/A'],
                ['Site Person', reportData.sitePersonName || 'N/A']
            ];

            const detailsRight = [
                ['Contact', reportData.contactNo || 'N/A'],
                ['Email', reportData.emailId || 'N/A'],
                ['Inspected By', reportData.inspectedBy || 'N/A']
            ];

            // Left column
            detailsLeft.forEach(([label, value]) => {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', 17, y + 4);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                const splitValue = doc.splitTextToSize(value || 'N/A', 60);
                doc.text(splitValue, 55, y + 4);
                y += 8;
            });

            // Reset y for right column
            y = y - 24;
            let rightY = y + 4;

            // Right column
            detailsRight.forEach(([label, value]) => {
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(80, 80, 100);
                doc.text(label + ':', pageWidth / 2 + 10, rightY);

                doc.setFont('helvetica', 'normal');
                doc.setTextColor(30, 30, 50);
                const splitValue = doc.splitTextToSize(value || 'N/A', 55);
                doc.text(splitValue, pageWidth / 2 + 45, rightY);
                rightY += 8;
            });

            y = rightY + 5;

            // === CHECKLIST WITH REMARKS ===
            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('CHECKLIST ITEM', 15, y + 5);
            y += 11;

            if (reportData.checklist && reportData.checklist.length > 0) {
                // Table Header
                doc.setFillColor(240, 245, 255);
                doc.rect(15, y - 2, pageWidth - 30, 7, 'F');

                doc.setTextColor(79, 70, 229);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('#', 17, y + 4);
                doc.text('Checklist Item', 25, y + 4);
                doc.text('Status', pageWidth - 75, y + 4, { align: 'center' });
                doc.text('Remark', pageWidth - 40, y + 4, { align: 'center' });
                y += 9;

                reportData.checklist.forEach((item, index) => {
                    // Check if we need a new page
                    if (y > pageHeight - 35) {
                        doc.addPage();
                        addPageLayout();
                        y = 25;

                        // Re-add title on new page
                        doc.setTextColor(79, 70, 229);
                        doc.setFontSize(16);
                        doc.setFont('helvetica', 'bold');
                        doc.text('PRE VISIT REPORT', 15, y, { align: 'left' });
                        y += 15;

                        // Re-add section header
                        doc.setDrawColor(79, 70, 229);
                        doc.setLineWidth(0.5);
                        doc.line(15, y, pageWidth - 15, y);
                        y += 4;
                        doc.setTextColor(79, 70, 229);
                        doc.setFontSize(12);
                        doc.setFont('helvetica', 'bold');
                        doc.text('CHECKLIST ITEM', 15, y + 5);
                        y += 11;

                        // Table Header on new page
                        doc.setFillColor(240, 245, 255);
                        doc.rect(15, y - 2, pageWidth - 30, 7, 'F');
                        doc.setTextColor(79, 70, 229);
                        doc.setFontSize(8);
                        doc.setFont('helvetica', 'bold');
                        doc.text('#', 17, y + 4);
                        doc.text('Checklist Item', 25, y + 4);
                        doc.text('Status', pageWidth - 75, y + 4, { align: 'center' });
                        doc.text('Remark', pageWidth - 40, y + 4, { align: 'center' });
                        y += 9;
                    }

                    // Row background (alternating)
                    // if (index % 2 === 0) {
                    //     doc.setFillColor(248, 250, 252);
                    //     doc.rect(15, y - 1, pageWidth - 30, 12, 'F');
                    // }

                    const statusColor = item.status ? [16, 185, 129] : [239, 68, 68];
                    const statusText = item.status ? 'YES' : 'NO';
                    const remark = item.remark || '-'; // Use remark from data or default to '-'

                    // Serial Number
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(79, 70, 229);
                    doc.text(`${index + 1}.`, 17, y + 4);

                    // Checklist Item
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(30, 30, 50);
                    const splitText = doc.splitTextToSize(item.fieldName, pageWidth - 140);
                    doc.text(splitText, 25, y + 4);

                    // Status Badge
                    //doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
                    //doc.roundedRect(pageWidth - 85, y, 18, 7, 3, 3, 'F');
                    doc.setTextColor(30, 30, 50);
                    doc.setFontSize(6);
                    doc.setFont('helvetica', 'bold');
                    doc.text(statusText, pageWidth - 76, y + 5, { align: 'center' });

                    // Remark
                    doc.setTextColor(30, 30, 50);
                    doc.setFontSize(7);
                    doc.setFont('helvetica', 'normal');
                    const splitRemark = doc.splitTextToSize(remark, 35);
                    doc.text(splitRemark, pageWidth - 50, y + 4);

                    y += 12;
                });
            } else {
                doc.setTextColor(150, 150, 170);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'italic');
                doc.text('No checklist items found', 17, y + 4);
                y += 9;
            }

            y += 4;

            // === ADDITIONAL NOTES ===
            if (reportData.notedIfAny) {
                if (y > pageHeight - 40) {
                    doc.addPage();
                    addPageLayout();
                    y = 25;
                }

                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.5);
                doc.line(15, y, pageWidth - 15, y);
                y += 4;

                doc.setTextColor(79, 70, 229);
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('ADDITIONAL NOTES', 15, y + 5);
                y += 10;

                doc.setFillColor(248, 250, 252);
                doc.roundedRect(15, y, pageWidth - 30, 15, 3, 3, 'F');

                doc.setTextColor(30, 30, 50);
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const notes = doc.splitTextToSize(reportData.notedIfAny, pageWidth - 40);
                doc.text(notes, 20, y + 4);
                y += 20;
            }

            // === SIGNATURES ===
            if (y > pageHeight - 40) {
                doc.addPage();
                addPageLayout();
                y = 25;
            }

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;

            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('SIGNATURES', 15, y + 5);
            y += 12;

            // Customer signature
            doc.setFillColor(248, 250, 252);
            doc.rect(15, y - 2, (pageWidth - 45) / 2, 22, 'F');

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Customer:', 20, y + 5);

            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(reportData.customerName || 'N/A', 50, y + 5);

            doc.setDrawColor(200, 200, 220);
            doc.setLineWidth(0.3);
            doc.line(20, y + 13, 20 + 70, y + 13);
            doc.setTextColor(150, 150, 170);
            doc.setFontSize(7);
            doc.text('Signature', 55, y + 18, { align: 'center' });

            // Technician signature
            doc.setFillColor(248, 250, 252);
            doc.rect(pageWidth / 2 + 7, y - 2, (pageWidth - 45) / 2, 22, 'F');

            doc.setTextColor(80, 80, 100);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Technician:', pageWidth / 2 + 12, y + 5);

            doc.setTextColor(30, 30, 50);
            doc.setFont('helvetica', 'normal');
            doc.text(reportData.technicianName || 'N/A', pageWidth / 2 + 55, y + 5);

            doc.setDrawColor(200, 200, 220);
            doc.setLineWidth(0.3);
            doc.line(pageWidth / 2 + 12, y + 13, pageWidth / 2 + 82, y + 13);
            doc.setTextColor(150, 150, 170);
            doc.setFontSize(7);
            doc.text('Signature', pageWidth / 2 + 47, y + 18, { align: 'center' });

            // Generate filename and save
            const fileName = generateFileName(reportData);
            doc.save(fileName);

            notificationService.success(`✅ PDF generated successfully!\n📄 ${fileName}`);
        } catch (error) {
            //console.error('PDF Generation Error:', error);
            notificationService.error(`❌ Failed to generate PDF: ${error.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    // Handle Create New
    const handleCreateNew = () => {
        navigate('/previsit/new');
    };

    // Sort and paginate reports
    const sortedReports = useMemo(() => {
        const sorted = [...reports].sort((a, b) => {
            let aVal = a[sortField] || '';
            let bVal = b[sortField] || '';

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal.toLowerCase();
            }

            if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
            return 0;
        });
        return sorted;
    }, [reports, sortField, sortDirection]);

    // Filter reports
    const filteredReports = sortedReports.filter(report => {
        const searchableFields = [
            report.companyName,
            report.sitePersonName,
            report.emailId,
            report.siteAddress
        ].filter(Boolean);

        const searchMatch = searchTerm === "" ||
            searchableFields.some(field =>
                String(field).toLowerCase().includes(searchTerm.toLowerCase())
            );

        return searchMatch;
    });

    // Pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedReports = filteredReports.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredReports.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
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

    if (error) {
        return (
            <div className="view-reports-container">
                <div className="error-message">
                    <FaExclamationCircle />
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
                <h1>Pre-Visit Reports</h1>
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
                        placeholder="Search by Company, Site Person, Email..."
                        value={searchTerm}
                        onChange={handleSearch}
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
                    <p>There are no pre-visit reports to display. Create your first report!</p>
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
                                <th onClick={() => handleSort('id')} className="sortable">
                                    ID {getSortIcon('id')}
                                </th>
                                <th onClick={() => handleSort('companyName')} className="sortable">
                                    Company {getSortIcon('companyName')}
                                </th>
                                <th onClick={() => handleSort('sitePersonName')} className="sortable">
                                    Site Person {getSortIcon('sitePersonName')}
                                </th>
                                <th onClick={() => handleSort('visitDate')} className="sortable">
                                    Visit Date {getSortIcon('visitDate')}
                                </th>
                                <th onClick={() => handleSort('emailId')} className="sortable">
                                    Email {getSortIcon('emailId')}
                                </th>
                                <th style={{ width: '220px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedReports.map((report, index) => {
                                const isSelected = selectedReports.find(r => r === report.id);
                                return (
                                    <tr key={report.id || index} className={isSelected ? 'selected-row' : ''}>
                                        <td>
                                            <input
                                                type="checkbox"
                                                checked={!!isSelected}
                                                onChange={() => handleSelect(report.id)}
                                                className="select-checkbox"
                                            />
                                        </td>
                                        <td>{indexOfFirstItem + index + 1}</td>
                                        <td className="report-id">#{String(report.id).padStart(3, '0')}</td>
                                        <td className="company-name">
                                            <span className="company-text">{report.companyName || '-'}</span>
                                        </td>
                                        <td>{report.sitePersonName || '-'}</td>
                                        <td>{formatDate(report.visitDate)}</td>
                                        <td>
                                            <span className="email-cell">{report.emailId || '-'}</span>
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
                                                    disabled={actionLoading === `pdf-${report.id}`}
                                                >
                                                    {actionLoading === `pdf-${report.id}` ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                                                    <span className="btn-label">PDF</span>
                                                </button>
                                                <button
                                                    className="action-btn delete-btn"
                                                    onClick={() => handleDelete(report.id)}
                                                    title="Delete"
                                                    disabled={actionLoading === report.id}
                                                >
                                                    {actionLoading === report.id ? <FaSpinner className="spinning" /> : <FaTrash />}
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
                        onClick={() => paginate(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="page-btn"
                    >
                        <FaChevronLeft />
                    </button>
                    <span className="page-info">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => paginate(currentPage + 1)}
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

export default PreVisitViewAll;