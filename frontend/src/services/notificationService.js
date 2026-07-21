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

// Notification types for report actions
const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'report_created',
  REPORT_UPDATED: 'report_updated',
  REPORT_DELETED: 'report_deleted',
  BULK_DELETED: 'bulk_deleted',
};

// Report type identifiers
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

// Get detailed report message with all identifying information
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

  // Build the message with available data
  let message = '';

  // Report type and name
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

  // Add additional details if available
  const details = [];
  
  if (customerName) {
    details.push(`Customer: ${customerName}`);
  }
  if (location) {
    details.push(`Location: ${location}`);
  }
  if (equipment) {
    details.push(`Equipment: ${equipment}`);
  }
  if (date) {
    const formattedDate = new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
    details.push(`Date: ${formattedDate}`);
  }
  if (status) {
    details.push(`Status: ${status}`);
  }
  if (createdBy) {
    details.push(`Created by: ${createdBy}`);
  }

  // Add any additional info
  Object.entries(additionalInfo).forEach(([key, value]) => {
    if (value) {
      details.push(`${key}: ${value}`);
    }
  });

  // Combine message with details
  if (details.length > 0) {
    message += `\n${details.join(' • ')}`;
  }

  return message;
};

// Professional notification service
class NotificationService {
  constructor() {
    this.hasShownWelcome = false;
    this.notificationHistory = new Map();
    this.maxHistory = 50;
    this.cooldownPeriod = 30000; // 30 seconds cooldown
    this.notificationCallback = null;
    this.currentReportContext = {}; // Store current report context
  }

  // Set callback for adding notifications to context
  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  // Set current report context for detailed notifications
  setReportContext(context) {
    this.currentReportContext = {
      ...this.currentReportContext,
      ...context
    };
  }

  // Clear report context
  clearReportContext() {
    this.currentReportContext = {};
  }

  // Add notification to context (dropdown)
  addToContext(type, text, metadata = {}) {
    if (this.notificationCallback) {
      this.notificationCallback({
        id: Date.now().toString(),
        type: type,
        text: text,
        timestamp: new Date().toISOString(),
        read: false,
        ...metadata
      });
    }
  }

  // Check if notification should be shown
  shouldShowNotification(type, identifier) {
    if (!identifier) return true;
    
    const key = `${type}_${identifier}`;
    const lastShown = this.notificationHistory.get(key);
    
    if (!lastShown) {
      this.addToHistory(key);
      return true;
    }
    
    const cooldownTime = Date.now() - this.cooldownPeriod;
    if (lastShown.timestamp < cooldownTime) {
      this.updateHistory(key);
      return true;
    }
    
    return false;
  }

  addToHistory(key) {
    this.notificationHistory.set(key, { 
      timestamp: Date.now(),
      count: 1 
    });
    
    if (this.notificationHistory.size > this.maxHistory) {
      const oldestKey = this.notificationHistory.keys().next().value;
      this.notificationHistory.delete(oldestKey);
    }
  }

  updateHistory(key) {
    const entry = this.notificationHistory.get(key);
    if (entry) {
      entry.timestamp = Date.now();
      entry.count = (entry.count || 0) + 1;
    }
  }

  isCRUDOperation(type) {
    const crudTypes = [
      NOTIFICATION_TYPES.REPORT_CREATED,
      NOTIFICATION_TYPES.REPORT_UPDATED,
      NOTIFICATION_TYPES.REPORT_DELETED,
      NOTIFICATION_TYPES.BULK_DELETED
    ];
    return crudTypes.includes(type);
  }

  // Success notification with detailed information
  success(message, options = {}) {
    const { type, identifier, reportData = {}, reportName = '' } = options;
    
    if (type && !this.isCRUDOperation(type)) {
      return;
    }
    
    if (type && identifier) {
      if (!this.shouldShowNotification(type, identifier)) {
        console.log(`Notification suppressed for ${type} - ${identifier} (rate limited)`);
        return;
      }
    }

    // Get detailed message
    const finalMessage = type 
      ? getDetailedReportMessage(type, { ...this.currentReportContext, ...reportData, reportName })
      : message;

    // Show toast notification
    toast.success(finalMessage, {
      ...toastConfig,
      ...options,
      icon: '',
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
      autoClose: options.noAutoClose ? false : 4000,
    });

    // Add to context (dropdown notifications)
    this.addToContext('success', finalMessage, { type, identifier, reportData: { ...this.currentReportContext, ...reportData, reportName } });
  }

  // Error notification
  error(message, options = {}) {
    const { type, identifier } = options;
    
    if (type && identifier) {
      if (!this.shouldShowNotification(`error_${type}`, identifier)) {
        return;
      }
    }

    toast.error(message, {
      ...toastConfig,
      ...options,
      icon: '',
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
      autoClose: 5000,
    });

    this.addToContext('error', message, { type, identifier });
  }

  // Warning notification
  warning(message, options = {}) {
    toast.warning(message, {
      ...toastConfig,
      ...options,
      icon: '',
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

  // Info notification
  info(message, options = {}) {
    const { type, identifier } = options;
    
    // Special handling for welcome notification
    if (type === 'welcome') {
      if (this.hasShownWelcome) return;
      this.hasShownWelcome = true;
      
      toast.info(message, {
        ...toastConfig,
        ...options,
        icon: '',
        style: {
          background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
          color: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 40px rgba(139, 92, 246, 0.3)',
          fontWeight: '500',
          padding: '14px 20px',
          fontSize: '14px',
          border: '1px solid rgba(255,255,255,0.1)',
        },
        progressStyle: {
          background: 'white',
        },
        autoClose: options.noAutoClose ? false : 4000,
      });

      this.addToContext('info', message, { type: 'welcome' });
      return;
    }
    
    // Skip info notifications for fetch/view operations
    if (type && (type.includes('view') || type === 'dashboard_load')) {
      return;
    }

    if (type && identifier) {
      if (!this.shouldShowNotification(`info_${type}`, identifier)) {
        return;
      }
    }

    toast.info(message, {
      ...toastConfig,
      ...options,
      icon: '',
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
      autoClose: options.noAutoClose ? false : 3000,
    });

    this.addToContext('info', message, options);
  }

  // Welcome notification
  welcome(userName = '') {
    this.info(`Welcome${userName ? ` ${userName}` : ''}! Your reports are loading...`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
    });
  }

  // Login success notification
  loginSuccess(userName = '') {
    if (this.hasShownWelcome) return;
    this.info(`Welcome back${userName ? ` ${userName}` : ''}!`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
    });
  }

  // --- CRUD Operation Notifications with detailed data ---

  // Report created
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

    this.success(getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_CREATED, data), {
      type: NOTIFICATION_TYPES.REPORT_CREATED,
      identifier: identifier || data.reportId || `create_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // Report updated
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

    this.success(getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_UPDATED, data), {
      type: NOTIFICATION_TYPES.REPORT_UPDATED,
      identifier: identifier || data.reportId || `update_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // Report deleted
  reportDeleted(reportName, reportData = {}, identifier = null) {
    const data = {
      reportName: reportName,
      reportId: reportData.id || reportData._id || identifier,
      reportType: reportData.reportType || this.currentReportContext.reportType || 'Report',
      location: reportData.location || reportData.site || this.currentReportContext.location,
      customerName: reportData.customerName || reportData.customer || this.currentReportContext.customerName,
      ...reportData
    };

    this.success(getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_DELETED, data), {
      type: NOTIFICATION_TYPES.REPORT_DELETED,
      identifier: identifier || data.reportId || `delete_${Date.now()}`,
      reportData: data,
      reportName: reportName,
    });
  }

  // Bulk delete
  bulkDeleted(count, reportType = 'Report') {
    const data = {
      reportName: count,
      reportType: reportType,
    };

    this.success(getDetailedReportMessage(NOTIFICATION_TYPES.BULK_DELETED, data), {
      type: NOTIFICATION_TYPES.BULK_DELETED,
      identifier: 'bulk',
      reportData: data,
      reportName: count,
    });
  }

  // Set context for a specific report type
  setReportTypeContext(type, additionalData = {}) {
    this.setReportContext({
      reportType: type,
      ...additionalData
    });
  }

  // Silent notification
  silent(message, options = {}) {
    toast(message, {
      ...toastConfig,
      ...options,
      icon: '',
      style: {
        background: 'linear-gradient(135deg, #6b7280, #4b5563)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        fontWeight: '500',
        padding: '12px 18px',
        fontSize: '13px',
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: 0.9,
      },
      progressStyle: {
        background: 'white',
      },
      autoClose: 2000,
    });

    this.addToContext('info', message, { ...options, silent: true });
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss();
  }

  // Reset state
  resetState() {
    this.hasShownWelcome = false;
    this.notificationHistory.clear();
    this.currentReportContext = {};
  }

  getHistory() {
    return Array.from(this.notificationHistory.entries());
  }

  getStats() {
    const stats = {
      total: this.notificationHistory.size,
      types: {}
    };
    
    this.notificationHistory.forEach((value, key) => {
      const type = key.split('_')[0];
      stats.types[type] = (stats.types[type] || 0) + 1;
    });
    
    return stats;
  }
}

// Export the notification types for use in components
export { NOTIFICATION_TYPES, REPORT_TYPES };

export default new NotificationService();