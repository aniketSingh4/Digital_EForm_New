// src/services/notificationService.js
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Toast notification configurations
const toastConfig = {
  position: "top-right",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "colored",
};

// Notification types
const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'report_created',
  REPORT_UPDATED: 'report_updated',
  REPORT_DELETED: 'report_deleted',
  BULK_DELETED: 'bulk_deleted',
};

const REPORT_TYPES = {
  PM: 'PM Report',
  PRE_VISIT: 'Pre-Visit Checklist',
  CALIBRATION: 'Calibration Report',
  INSTALLATION: 'Installation & Commissioning Report'
};

// Get report type from URL or context
const getReportType = (path = '') => {
  if (path.includes('pm-reports')) return REPORT_TYPES.PM;
  if (path.includes('previsit')) return REPORT_TYPES.PRE_VISIT;
  if (path.includes('calibration')) return REPORT_TYPES.CALIBRATION;
  if (path.includes('installation')) return REPORT_TYPES.INSTALLATION;
  return 'Report';
};

// Get detailed report message
const getDetailedReportMessage = (action, reportData = {}) => {
  const {
    reportName = '',
    reportId = '',
    reportType = '',
    location = '',
    date = '',
    customerName = '',
    equipment = '',
    status = '',
    createdBy = '',
    additionalInfo = {}
  } = reportData;

  let message = '';
  const typeLabel = reportType || 'Report';
  const namePart = reportName ? `"${reportName}"` : `#${reportId || 'Unknown'}`;

  switch (action) {
    case NOTIFICATION_TYPES.REPORT_CREATED:
      message = ` ${typeLabel} ${namePart} created successfully`;
      break;
    case NOTIFICATION_TYPES.REPORT_UPDATED:
      message = ` ${typeLabel} ${namePart} updated successfully`;
      break;
    case NOTIFICATION_TYPES.REPORT_DELETED:
      message = ` ${typeLabel} ${namePart} deleted successfully`;
      break;
    case NOTIFICATION_TYPES.BULK_DELETED:
      message = ` ${reportName} ${typeLabel}s deleted successfully`;
      break;
    default:
      message = `${action} completed successfully!`;
  }

  const details = [];
  if (customerName) details.push(`Customer: ${customerName}`);
  if (location) details.push(`Location: ${location}`);
  if (equipment) details.push(`Equipment: ${equipment}`);
  if (date) {
    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    details.push(`Date: ${formattedDate}`);
  }
  if (status) details.push(`Status: ${status}`);
  if (createdBy) details.push(`Created by: ${createdBy}`);

  Object.entries(additionalInfo).forEach(([key, value]) => {
    if (value) details.push(`${key}: ${value}`);
  });

  if (details.length > 0) {
    message += `\n${details.join(' • ')}`;
  }

  return message;
};

// ✅ Notification Service with Context Integration
class NotificationService {
  constructor() {
    this.notificationCallback = null;
    this.hasShownWelcome = false;
    this.notificationHistory = new Map();
    this.maxHistory = 50;
    this.currentReportContext = {};
  }

  // ✅ Set callback for adding notifications to context
  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  // ✅ Add notification to context (dropdown)
  addToContext(type, text, metadata = {}) {
    if (this.notificationCallback) {
      this.notificationCallback({
        type: type,
        text: text,
        timestamp: new Date().toISOString(),
        read: false,
        ...metadata
      });
    }
  }

  // Set current report context
  setReportContext(context) {
    this.currentReportContext = {
      ...this.currentReportContext,
      ...context
    };
  }

  clearReportContext() {
    this.currentReportContext = {};
  }

  // ✅ Success notification
  success(message, options = {}) {
    const { type, identifier, reportData = {}, reportName = '' } = options;

    toast.success(message, {
      ...toastConfig,
      ...options,
      style: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      progressStyle: {
        background: 'white',
      },
    });

    // ✅ Add to context (dropdown notifications)
    this.addToContext('success', message, { type, identifier, reportData: { ...this.currentReportContext, ...reportData, reportName } });
  }

  // ✅ Error notification
  error(message, options = {}) {
    toast.error(message, {
      ...toastConfig,
      ...options,
      style: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      progressStyle: {
        background: 'white',
      },
    });

    this.addToContext('error', message, options);
  }

  // ✅ Warning notification
  warning(message, options = {}) {
    toast.warning(message, {
      ...toastConfig,
      ...options,
      style: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      progressStyle: {
        background: 'white',
      },
    });

    this.addToContext('warning', message, options);
  }

  // ✅ Info notification
  info(message, options = {}) {
    toast.info(message, {
      ...toastConfig,
      ...options,
      style: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      progressStyle: {
        background: 'white',
      },
    });

    this.addToContext('info', message, options);
  }

  // ✅ PDF Generated
  pdfGenerated(filename) {
    this.success(`PDF generated: ${filename}`, {
      style: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      },
    });
  }

  // ✅ Report Saved
  reportSaved(message) {
    this.success(message || 'Report saved successfully!');
  }

  // ✅ Report Deleted
  reportDeleted(message) {
    this.info(message || 'Report deleted successfully!');
  }

  // ✅ Report Created
  reportCreated(reportName, reportData = {}, identifier = null) {
    const data = {
      reportName: reportName,
      reportId: reportData.id || reportData._id || identifier,
      reportType: reportData.reportType || this.currentReportContext.reportType || 'Report',
      location: reportData.location || reportData.site || this.currentReportContext.location,
      date: reportData.date || reportData.serviceDate || this.currentReportContext.date,
      customerName: reportData.customerName || reportData.customer || this.currentReportContext.customerName,
      equipment: reportData.equipment || reportData.equipmentName || this.currentReportContext.equipment,
      status: reportData.status || this.currentReportContext.status,
      createdBy: reportData.createdBy || this.currentReportContext.createdBy,
      ...reportData
    };

    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_CREATED, data);
    this.success(message, {
      type: NOTIFICATION_TYPES.REPORT_CREATED,
      identifier: identifier || data.reportId || `create_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // ✅ Report Updated
  reportUpdated(reportName, reportData = {}, identifier = null) {
    const data = {
      reportName: reportName,
      reportId: reportData.id || reportData._id || identifier,
      reportType: reportData.reportType || this.currentReportContext.reportType || 'Report',
      location: reportData.location || reportData.site || this.currentReportContext.location,
      date: reportData.date || reportData.serviceDate || this.currentReportContext.date,
      customerName: reportData.customerName || reportData.customer || this.currentReportContext.customerName,
      equipment: reportData.equipment || reportData.equipmentName || this.currentReportContext.equipment,
      status: reportData.status || this.currentReportContext.status,
      updatedBy: reportData.updatedBy || this.currentReportContext.updatedBy,
      ...reportData
    };

    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_UPDATED, data);
    this.success(message, {
      type: NOTIFICATION_TYPES.REPORT_UPDATED,
      identifier: identifier || data.reportId || `update_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // ✅ Report Deleted (CRUD)
  reportDeletedAction(reportName, reportData = {}, identifier = null) {
    const data = {
      reportName: reportName,
      reportId: reportData.id || reportData._id || identifier,
      reportType: reportData.reportType || this.currentReportContext.reportType || 'Report',
      location: reportData.location || reportData.site || this.currentReportContext.location,
      customerName: reportData.customerName || reportData.customer || this.currentReportContext.customerName,
      ...reportData
    };

    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_DELETED, data);
    this.success(message, {
      type: NOTIFICATION_TYPES.REPORT_DELETED,
      identifier: identifier || data.reportId || `delete_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // ✅ Bulk Delete
  bulkDeleted(count, reportType = 'Report') {
    const data = {
      reportName: count,
      reportType: reportType,
    };
    const message = getDetailedReportMessage(NOTIFICATION_TYPES.BULK_DELETED, data);
    this.success(message, {
      type: NOTIFICATION_TYPES.BULK_DELETED,
      identifier: 'bulk',
      reportData: data,
      reportName: count,
    });
  }

  // ✅ Welcome
  welcome(userName = '') {
    this.info(`Welcome${userName ? ` ${userName}` : ''}!`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
    });
  }

  // ✅ Dismiss all
  dismissAll() {
    toast.dismiss();
  }
}

// Export the notification types for use in components
export { NOTIFICATION_TYPES, REPORT_TYPES };

// ✅ Export a singleton instance
const notificationService = new NotificationService();
export default notificationService;