import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import jsPDF from 'jspdf';
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
import notificationService from '../../services/notificationService';
import "./InstallationReportList.css";

const API_BASE_URL = 'http://localhost:8086/api/reports';

const InstallationReportList = () => {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [filteredReports, setFilteredReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [animateCard, setAnimateCard] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    fetchReports();
    setTimeout(() => setAnimateCard(true), 100);
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, searchTerm]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(API_BASE_URL);
      setReports(response.data);
      setFilteredReports(response.data);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      toast.error('Failed to fetch reports');
      console.error('Error fetching reports:', err);
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
        report.companyName?.toLowerCase().includes(term) ||
        report.siteName?.toLowerCase().includes(term) ||
        report.customerName?.toLowerCase().includes(term) ||
        report.installedBy?.toLowerCase().includes(term)
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

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        setActionLoading(id);
        await axios.delete(`${API_BASE_URL}/${id}`);
        setSelectedReports(selectedReports.filter(reportId => reportId !== id));
        notificationService.reportDeleted('Installation Report', id);
        toast.success('✅ Report deleted successfully!');
        fetchReports();
      } catch (error) {
        toast.error('❌ Failed to delete report');
        notificationService.error('Failed to delete Installation Report');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      toast.warning('Please select at least one report to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedReports.length} selected report(s)?`)) {
      try {
        setActionLoading('bulk');
        for (const id of selectedReports) {
          await axios.delete(`${API_BASE_URL}/${id}`);
        }
        setSelectedReports([]);
        setSelectAll(false);
        notificationService.bulkDeleted(selectedReports.length);
        toast.success(`✅ ${selectedReports.length} report(s) deleted successfully!`);
        fetchReports();
      } catch (error) {
        toast.error('❌ Failed to delete selected reports');
        notificationService.error('Failed to delete selected reports');
      } finally {
        setActionLoading(null);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([]);
    } else {
      setSelectedReports(paginatedReports.map(report => report.id));
    }
    setSelectAll(!selectAll);
  };

  const handleSelect = (id) => {
    if (selectedReports.includes(id)) {
      setSelectedReports(selectedReports.filter(reportId => reportId !== id));
    } else {
      setSelectedReports([...selectedReports, id]);
    }
  };

  const handleView = (report) => {
    navigate(`/installation-reports/view/${report.id}`);
  };

  const handleEdit = (report) => {
    navigate(`/installation-reports/edit/${report.id}`);
  };







  // Handle PDF Generation - WITH REPORT SUBMIT DATE
  const handlePDF = async (report) => {
    try {
      setActionLoading(`pdf-${report.id}`);

      // Fetch full report details
      const response = await axios.get(`${API_BASE_URL}/${report.id}`);
      const reportData = response.data;

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
      const addPageLayout = (pageNum) => {
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

        // Add Pagination in Footer (bottom center)
        doc.setTextColor(150, 150, 170);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Page ${pageNum}`, pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Add FORM-IV in Footer (bottom right)
        doc.setTextColor(150, 150, 170);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('FORM-IV', pageWidth - 15, pageHeight - 10, { align: 'right' });
      };

      let currentPage = 1;

      // Add initial page layout
      addPageLayout(currentPage);
      let y = 25;

      // === TITLE SECTION ===
      // Main Title - Left Aligned
      doc.setTextColor(79, 70, 229);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
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
      y += 10;

      // Report Info Bar
      doc.setFillColor(240, 245, 255);
      doc.rect(15, y, pageWidth - 30, 9, 'F');

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`Report No: ${reportData.reportNo || 'N/A'}`, 20, y + 6);

      doc.setTextColor(100, 100, 120);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${formatDate(reportData.date)}`, pageWidth / 2 - 30, y + 6);
      doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 20, y + 6, { align: 'right' });

      y += 15;

      // === SECTION 1: Report Details ===
      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 4;

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Report Details', 15, y + 5);
      y += 11;

      // Report details in two columns
      const reportDetailsLeft = [
        ['Report No', reportData.reportNo || 'N/A'],
        ['Company Name', reportData.companyName || 'N/A'],
        ['Site Name', reportData.siteName || 'N/A'],
        ['Customer Name', reportData.customerName || 'N/A']
      ];

      const reportDetailsRight = [
        ['Date', formatDate(reportData.date)],
        ['Site Address', reportData.siteAddress || 'N/A'],
        ['Installed By', reportData.installedBy || 'N/A'],
        ['Contact No', reportData.contactNo || 'N/A']
      ];

      // Left column
      reportDetailsLeft.forEach(([label, value]) => {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(80, 80, 100);
        doc.text(label + ':', 17, y + 4);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 50);
        const splitValue = doc.splitTextToSize(value || 'N/A', 60);
        doc.text(splitValue, 65, y + 4);
        y += 8;
      });

      // Reset y for right column
      y = y - 32;
      let rightY = y + 4;

      // Right column
      reportDetailsRight.forEach(([label, value]) => {
        if (label) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(80, 80, 100);
          doc.text(label + ':', pageWidth / 2 + 10, rightY);

          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 50);
          const splitValue = doc.splitTextToSize(value || 'N/A', 55);
          doc.text(splitValue, pageWidth / 2 + 55, rightY);
        }
        rightY += 8;
      });

      y = rightY + 5;

      // === SECTION 2: Equipment Details ===
      if (reportData.equipmentDetails && reportData.equipmentDetails.length > 0) {
        if (y > pageHeight - 60) {
          currentPage++;
          doc.addPage();
          addPageLayout(currentPage);
          y = 25;
          // Re-add title on new page
          doc.setTextColor(79, 70, 229);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
          y += 8;

          // Subtitle - Left Aligned
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
        doc.text('2. Equipment Details', 15, y + 5);
        y += 11;

        // Table Header
        //doc.setFillColor(79, 70, 229);
        doc.rect(15, y - 2, pageWidth - 30, 7, 'F');

        doc.setTextColor(255, 255, 255 );
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('#', 17, y + 4);
        doc.text('Model No', 35, y + 4);
        doc.text('Serial No', 80, y + 4);
        doc.text('Quantity', pageWidth - 35, y + 4, { align: 'center' });
        y += 9;

        reportData.equipmentDetails.forEach((item, index) => {
          if (y > pageHeight - 25) {
            currentPage++;
            doc.addPage();
            addPageLayout(currentPage);
            y = 25;
            // Re-add title on new page
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
            y += 15;

            doc.setDrawColor(79, 70, 229);
            doc.setLineWidth(0.5);
            doc.line(15, y, pageWidth - 15, y);
            y += 4;
            doc.setTextColor(79, 70, 229);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('2. Equipment Details', 15, y + 5);
            y += 11;

            // Table Header on new page
            doc.setFillColor(79, 70, 229);
            doc.rect(15, y - 2, pageWidth - 30, 7, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('#', 17, y + 4);
            doc.text('Model No', 35, y + 4);
            doc.text('Serial No', 80, y + 4);
            doc.text('Quantity', pageWidth - 35, y + 4, { align: 'center' });
            y += 9;
          }

          // Row background (alternating)
          // if (index % 2 === 0) {
          //   doc.setFillColor(248, 250, 252);
          //   doc.rect(15, y - 1, pageWidth - 30, 8, 'F');
          // }

          doc.setFontSize(8);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(30, 30, 50);
          doc.text(`${index + 1}`, 17, y + 4);
          doc.text(item.modelNo || 'N/A', 35, y + 4);
          doc.text(item.serialNo || 'N/A', 80, y + 4);
          doc.text(String(item.quantity || 0), pageWidth - 35, y + 4, { align: 'center' });

          y += 9;
        });
        y += 5;
      }

      // === SECTION 3: Work Activity ===
      if (y > pageHeight - 80) {
        currentPage++;
        doc.addPage();
        addPageLayout(currentPage);
        y = 25;
        // Re-add title on new page
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
        y += 8;

        // Subtitle - Left Aligned
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
      doc.text('3. Work Activity', 15, y + 5);
      y += 11;

      const activityItems = [
        ['Machine Unboxing', reportData.machineUnboxing],
        ['Sensor & Controller Installed', reportData.sensorControllerInstalled],
        ['LED Installed', reportData.ledInstalled],
        ['Wiring & Configuration Done', reportData.wiringInternalConnectionDone],
        ['Basic Functionality Check', reportData.basicFunctionalityCheck],
        ['Stable Power Supply', reportData.stablePowerSupply],
        ['Stable Internet Connection', reportData.stableInternetConnection],
        ['Safety & Maintenance Explained', reportData.safetyMaintenanceExplained]
      ];

      // Display activity in two columns
      const halfLength = Math.ceil(activityItems.length / 2);
      const leftItems = activityItems.slice(0, halfLength);
      const rightItems = activityItems.slice(halfLength);

      let leftY = y;
      let rightY2 = y;

      // Left column
      leftItems.forEach(([label, value]) => {
        const statusColor = value ? [16, 185, 129] : [239, 68, 68];
        const statusText = value ? 'Done' : 'Pending';

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 50);
        doc.text(label + ':', 17, leftY + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(statusText, 65, leftY + 4);

        leftY += 9;
      });

      // Right column
      rightItems.forEach(([label, value]) => {
        const statusColor = value ? [16, 185, 129] : [239, 68, 68];
        const statusText = value ? 'Done' : 'Pending';

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 30, 50);
        doc.text(label + ':', pageWidth / 2 + 10, rightY2 + 4);

        doc.setFont('helvetica', 'bold');
        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.text(statusText, pageWidth / 2 + 65, rightY2 + 4);

        rightY2 += 9;
      });

      y = Math.max(leftY, rightY2) + 5;

      // === SECTION 4: Remark ===
      if (reportData.remark) {
        if (y > pageHeight - 40) {
          currentPage++;
          doc.addPage();
          addPageLayout(currentPage);
          y = 25;
          // Re-add title on new page
          doc.setTextColor(79, 70, 229);
          doc.setFontSize(16);
          doc.setFont('helvetica', 'bold');
          doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
          y += 18;

          // Subtitle - Left Aligned
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
        doc.text('4. Remark', 15, y + 5);
        y += 10;

        doc.setFillColor(248, 250, 252);
        doc.roundedRect(15, y, pageWidth - 30, 25, 4, 4, 'F');

        // Add yellow left border for remark
        doc.setDrawColor(245, 158, 11);
        doc.setLineWidth(2);
        doc.line(17, y + 2, 17, y + 23);

        doc.setTextColor(30, 30, 50);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const remark = doc.splitTextToSize(reportData.remark || 'No remarks', pageWidth - 50);
        doc.text(remark, 25, y + 6);
        y += 30;
      }

      // === SECTION 5: Work Confirmation ===
      if (y > pageHeight - 50) {
        currentPage++;
        doc.addPage();
        addPageLayout(currentPage);
        y = 25;
        // Re-add title on new page
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
        y += 8;

        // Subtitle - Left Aligned
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
      doc.text('5. Work Confirmation', 15, y + 5);
      y += 10;

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(15, y, pageWidth - 30, 20, 4, 4, 'F');

      // Add blue left border for confirmation
      doc.setDrawColor(59, 130, 246);
      doc.setLineWidth(2);
      doc.line(17, y + 2, 17, y + 18);

      doc.setTextColor(30, 30, 50);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const confirmation = doc.splitTextToSize(
        'I hereby confirm that the above-mentioned equipment have been installed successfully and demonstration has been provided.',
        pageWidth - 50
      );
      doc.text(confirmation, 25, y + 6);

      // Confirmation status
      // const statusColor = reportData.workConfirmation ? [16, 185, 129] : [239, 68, 68];
      // const statusText = reportData.workConfirmation ? '✅ Confirmed' : '❌ Not Confirmed';
      // doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
      // doc.setFontSize(9);
      // doc.setFont('helvetica', 'bold');
      // doc.text(statusText, pageWidth - 45, y + 14, { align: 'center' });

      y += 25;

      // === SECTION 6: Sign-Off ===
      if (y > pageHeight - 70) {
        currentPage++;
        doc.addPage();
        addPageLayout(currentPage);
        y = 25;
        // Re-add title on new page
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('INSTALLATION REPORT', 15, y, { align: 'left' });
        y += 15;
      }

      doc.setDrawColor(79, 70, 229);
      doc.setLineWidth(0.5);
      doc.line(15, y, pageWidth - 15, y);
      y += 4;

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('6. Sign-Off', 15, y + 5);
      y += 11;

      // Get current date for report submit date
      const currentDate = new Date();
      const submitDate = currentDate.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });

      // Customer signature box
      doc.setFillColor(248, 250, 252);
      doc.rect(15, y - 2, (pageWidth - 45) / 2, 40, 'F');

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer', 20, y + 5);

      doc.setTextColor(80, 80, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', 20, y + 14);
      doc.setTextColor(30, 30, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(reportData.customerConfirmationName || 'N/A', 50, y + 14);

      // Report Submit Date for Customer
      doc.setTextColor(80, 80, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Submit Date:', 20, y + 22);
      doc.setTextColor(30, 30, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(submitDate, 60, y + 22);

      // Signature line
      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.5);
      doc.line(20, y + 30, 20 + 70, y + 30);
      doc.setTextColor(150, 150, 170);
      doc.setFontSize(7);
      doc.text('Signature', 55, y + 35, { align: 'center' });

      if (reportData.customerSignature) {
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(reportData.customerSignature, 30, y + 30);
      }

      // Technician signature box
      doc.setFillColor(248, 250, 252);
      doc.rect(pageWidth / 2 + 7, y - 2, (pageWidth - 45) / 2, 40, 'F');

      doc.setTextColor(79, 70, 229);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Technician', pageWidth / 2 + 12, y + 5);

      doc.setTextColor(80, 80, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Name:', pageWidth / 2 + 12, y + 14);
      doc.setTextColor(30, 30, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(reportData.technicianConfirmationName || 'N/A', pageWidth / 2 + 45, y + 14);

      // Report Submit Date for Technician
      doc.setTextColor(80, 80, 100);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Submit Date:', pageWidth / 2 + 12, y + 22);
      doc.setTextColor(30, 30, 50);
      doc.setFont('helvetica', 'normal');
      doc.text(submitDate, pageWidth / 2 + 60, y + 22);

      // Signature line
      doc.setDrawColor(200, 200, 220);
      doc.setLineWidth(0.5);
      doc.line(pageWidth / 2 + 12, y + 30, pageWidth / 2 + 82, y + 30);
      doc.setTextColor(150, 150, 170);
      doc.setFontSize(7);
      doc.text('Signature', pageWidth / 2 + 47, y + 35, { align: 'center' });

      if (reportData.technicianSignature) {
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.text(reportData.technicianSignature, pageWidth / 2 + 30, y + 30);
      }

      // Generate filename and save
      const fileName = `Installation_Report_${reportData.reportNo || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      notificationService.pdfGenerated(reportData.reportNo || 'Installation Report');
      //toast.success('✅ PDF generated successfully!');

    } catch (error) {
      //console.error('PDF Generation Error:', error);
      //toast.error('❌ Failed to generate PDF: ' + error.message);
      notificationService.error('Failed to generate PDF');
    } finally {
      setActionLoading(null);
    }
  };










  const handleCreateNew = () => {
    navigate('/installation-reports/new');
  };

  // Sort and paginate reports
  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'date' || sortField === 'createdAt') {
        aVal = new Date(aVal);
        bVal = new Date(bVal);
      }

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredReports, sortField, sortDirection]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const paginatedReports = sortedReports.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedReports.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (report) => {
    if (report.workConfirmation) {
      return { label: 'Confirmed', className: 'status-success', icon: <FaCheckCircle /> };
    }
    return { label: 'Pending', className: 'status-pending', icon: <FaClock /> };
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
        <h1>Installation Reports</h1>
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
            placeholder="Search by Report No, Company, Site..."
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
          <p>There are no installation reports to display. Create your first report!</p>
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
                <th onClick={() => handleSort('companyName')} className="sortable">
                  Company {getSortIcon('companyName')}
                </th>
                <th onClick={() => handleSort('siteName')} className="sortable">
                  Site {getSortIcon('siteName')}
                </th>
                <th onClick={() => handleSort('date')} className="sortable">
                  Date {getSortIcon('date')}
                </th>
                <th onClick={() => handleSort('installedBy')} className="sortable">
                  Installed By {getSortIcon('installedBy')}
                </th>
                <th>Status</th>
                <th style={{ width: '220px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedReports.map((report, index) => {
                const isSelected = selectedReports.find(r => r === report.id);
                const status = getStatusBadge(report);
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
                    <td className="report-id">{report.reportNo}</td>
                    <td className="company-name">
                      <span className="company-text">{report.companyName || '-'}</span>
                    </td>
                    <td>{report.siteName || '-'}</td>
                    <td>{formatDate(report.date)}</td>
                    <td>{report.installedBy || '-'}</td>
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

export default InstallationReportList;