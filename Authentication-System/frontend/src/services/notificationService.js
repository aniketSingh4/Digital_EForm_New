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
  REPORT_VIEWED: 'report_viewed',
  PDF_GENERATED: 'pdf_generated',
  BULK_DELETED: 'bulk_deleted',
};

// Report action messages
const getReportMessage = (action, reportName = '') => {
  const messages = {
    [NOTIFICATION_TYPES.REPORT_CREATED]: `📄 ${reportName} created successfully!`,
    [NOTIFICATION_TYPES.REPORT_UPDATED]: `✏️ ${reportName} updated successfully!`,
    [NOTIFICATION_TYPES.REPORT_DELETED]: `🗑️ ${reportName} deleted successfully!`,
    [NOTIFICATION_TYPES.REPORT_VIEWED]: `👁️ ${reportName} viewed`,
    [NOTIFICATION_TYPES.PDF_GENERATED]: `📄 PDF generated successfully!`,
    [NOTIFICATION_TYPES.BULK_DELETED]: `🗑️ ${reportName} reports deleted successfully!`,
  };
  return messages[action] || 'Action completed successfully!';
};

// Professional notification service
class NotificationService {
  constructor() {
    this.hasShownWelcome = false;
    this.notificationHistory = [];
    this.maxHistory = 50;
  }

  // Check if notification should be shown
  shouldShowNotification(type, identifier) {
    // Always show if no identifier (like PDF generation, bulk actions)
    if (!identifier) return true;
    
    const key = `${type}_${identifier}`;
    const lastShown = this.notificationHistory.find(n => n.key === key);
    
    // If not shown before, show it
    if (!lastShown) {
      this.addToHistory(key);
      return true;
    }
    
    // Check if 5 minutes have passed since last notification
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (lastShown.timestamp < fiveMinutesAgo) {
      this.updateHistory(key);
      return true;
    }
    
    return false;
  }

  addToHistory(key) {
    this.notificationHistory.push({ key, timestamp: Date.now() });
    if (this.notificationHistory.length > this.maxHistory) {
      this.notificationHistory.shift();
    }
  }

  updateHistory(key) {
    const entry = this.notificationHistory.find(n => n.key === key);
    if (entry) {
      entry.timestamp = Date.now();
    }
  }

  // Success notification - with rate limiting
  success(message, options = {}) {
    const { type, identifier, reportName = '' } = options;
    
    // For report actions, check if we should show notification
    if (type && identifier) {
      if (!this.shouldShowNotification(type, identifier)) {
        return; // Don't show duplicate notification
      }
    }
    
    // Show welcome message only once per session
    if (type === 'welcome' && this.hasShownWelcome) {
      return;
    }
    if (type === 'welcome') {
      this.hasShownWelcome = true;
    }

    const finalMessage = type ? getReportMessage(type, reportName) : message;

    toast.success(finalMessage, {
      ...toastConfig,
      ...options,
      icon: '✅',
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
      autoClose: options.noAutoClose ? false : 5000,
    });
  }

  // Error notification
  error(message, options = {}) {
    const { type, identifier } = options;
    
    // For error, always show but rate limit
    if (type && identifier) {
      if (!this.shouldShowNotification(`error_${type}`, identifier)) {
        return;
      }
    }

    toast.error(message, {
      ...toastConfig,
      ...options,
      icon: '❌',
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
  }

  // Warning notification
  warning(message, options = {}) {
    toast.warning(message, {
      ...toastConfig,
      ...options,
      icon: '⚠️',
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
  }

  // Info notification
  info(message, options = {}) {
    const { type, identifier } = options;
    
    // For info, check rate limiting
    if (type && identifier) {
      if (!this.shouldShowNotification(`info_${type}`, identifier)) {
        return;
      }
    }

    toast.info(message, {
      ...toastConfig,
      ...options,
      icon: 'ℹ️',
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
      autoClose: options.noAutoClose ? false : 5000,
    });
  }

  // Report creation notification
  reportCreated(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_CREATED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_CREATED,
      identifier: identifier,
      reportName: reportName,
    });
  }

  // Report update notification
  reportUpdated(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_UPDATED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_UPDATED,
      identifier: identifier,
      reportName: reportName,
    });
  }

  // Report delete notification
  reportDeleted(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_DELETED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_DELETED,
      identifier: identifier,
      reportName: reportName,
    });
  }

  // Bulk delete notification
  bulkDeleted(count) {
    this.success(getReportMessage(NOTIFICATION_TYPES.BULK_DELETED, count), {
      type: NOTIFICATION_TYPES.BULK_DELETED,
      identifier: 'bulk',
      reportName: count,
    });
  }

  // PDF generation notification
  pdfGenerated(reportName) {
    this.success(getReportMessage(NOTIFICATION_TYPES.PDF_GENERATED), {
      type: NOTIFICATION_TYPES.PDF_GENERATED,
      identifier: `pdf_${reportName}`,
      reportName: reportName,
    });
  }

  // Welcome notification (shown only once per session)
  welcome(userName = '') {
    this.info(`👋 Welcome${userName ? ` ${userName}` : ''}! Your reports are loading...`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 5000,
    });
  }

  // Login success notification (shown only on first login)
  loginSuccess(userName = '') {
    if (this.hasShownWelcome) return;
    this.info(`🔐 Welcome back${userName ? ` ${userName}` : ''}!`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
    });
  }

  // Custom notification with specific style
  custom(message, type = 'info', options = {}) {
    const styles = {
      success: {
        background: 'linear-gradient(135deg, #10b981, #059669)',
        icon: '✅',
      },
      error: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        icon: '❌',
      },
      warning: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        icon: '⚠️',
      },
      info: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        icon: 'ℹ️',
      },
    };

    const style = styles[type] || styles.info;
    
    // Check rate limiting for custom notifications
    const { identifier } = options;
    if (identifier) {
      if (!this.shouldShowNotification(`custom_${type}`, identifier)) {
        return;
      }
    }

    toast(message, {
      ...toastConfig,
      ...options,
      icon: style.icon,
      style: {
        background: style.background,
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
      },
      progressStyle: {
        background: 'white',
      },
    });
  }

  // Silent notification (for background actions)
  silent(message, options = {}) {
    toast(message, {
      ...toastConfig,
      ...options,
      icon: '🔔',
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
      autoClose: 3000,
    });
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss();
  }

  // Reset welcome state (for testing)
  resetWelcomeState() {
    this.hasShownWelcome = false;
    this.notificationHistory = [];
  }

  // Get notification history (for debugging)
  getHistory() {
    return this.notificationHistory;
  }
}

// Export the notification types for use in components
export { NOTIFICATION_TYPES };

export default new NotificationService();