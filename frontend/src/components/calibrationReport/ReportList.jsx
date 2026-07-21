import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
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
} from 'react-icons/fa';
import { calibrationReportService } from '../../services/calibrationReportService';
import notificationService from '../../services/notificationService';
import './ReportList.css';

const ReportList = () => {
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
  const [animateCard, setAnimateCard] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

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
      const data = await calibrationReportService.getAllReports();
      setReports(data);
      setFilteredReports(data);
    } catch (err) {
      setError('Failed to load reports. Please try again.');
      //toast.error('Failed to fetch reports');
      notificationService.error('Failed to fetch reports');
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
        report.clientName?.toLowerCase().includes(term) ||
        report.siteName?.toLowerCase().includes(term) ||
        report.sensorId?.toLowerCase().includes(term) ||
        report.modelNo?.toLowerCase().includes(term)
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
    const reportId = report.id;
    if (!window.confirm(`Are you sure you want to delete report ${report.reportNo}?`)) return;

    try {
      setActionLoading(reportId);
      await calibrationReportService.deleteReport(reportId);
      setSelectedReports(selectedReports.filter(id => id !== reportId));
      notificationService.reportDeleted('Calibration Report', reportId);
      //toast.success('✅ Report deleted successfully!');
      notificationService.success('✅ Report deleted successfully!');
      fetchReports();
    } catch (error) {
      //toast.error('❌ Failed to delete report');
      notificationService.error('Failed to delete Calibration Report');
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReports.length === 0) {
      //toast.warning('Please select at least one report to delete.');
      notificationService.warning('Please select at least one report to delete.');
      return;
    }

    if (window.confirm(`Are you sure you want to delete ${selectedReports.length} selected report(s)?`)) {
      try {
        setActionLoading('bulk');
        for (const id of selectedReports) {
          await calibrationReportService.deleteReport(id);
        }
        setSelectedReports([]);
        setSelectAll(false);
        notificationService.bulkDeleted(selectedReports.length);
        //toast.success(`✅ ${selectedReports.length} report(s) deleted successfully!`);
        notificationService.success(`✅ ${selectedReports.length} report(s) deleted successfully!`);
        fetchReports();
      } catch (error) {
        //toast.error('❌ Failed to delete selected reports');
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
    navigate(`/calibration-reports/view/${report.id}`);
  };

  const handleEdit = (report) => {
    navigate(`/calibration-reports/edit/${report.id}`);
  };

  const handlePDF = async (report) => {
    try {
      setActionLoading(`pdf-${report.id}`);
      // PDF generation logic here
      notificationService.pdfGenerated(report.reportNo || 'Calibration Report');
      //toast.success('PDF generated successfully!');
      notificationService.success('PDF generated successfully!');
    } catch (error) {
      //toast.error('Failed to generate PDF');
      notificationService.error('Failed to generate PDF');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreateNew = () => {
    navigate('/calibration-reports/new');
  };

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

  // Import FaTools if not already imported
  const FaTools = ({ className }) => <span className={className}>🔧</span>;

  // Sort and paginate reports
  const sortedReports = useMemo(() => {
    const sorted = [...filteredReports].sort((a, b) => {
      let aVal = a[sortField] || '';
      let bVal = b[sortField] || '';

      if (sortField === 'calibrationDate' || sortField === 'reportDate') {
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
                          disabled={actionLoading === `pdf-${report.id}`}
                        >
                          {actionLoading === `pdf-${report.id}` ? <FaSpinner className="spinning" /> : <FaFilePdf />}
                          <span className="btn-label">PDF</span>
                        </button>
                        <button
                          className="action-btn delete-btn"
                          onClick={() => handleDelete(report)}
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

export default ReportList;