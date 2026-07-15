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

// Report action messages - only for CRUD operations
const getReportMessage = (action, reportName = '') => {
  const messages = {
    [NOTIFICATION_TYPES.REPORT_CREATED]: `📄 ${reportName} created successfully!`,
    [NOTIFICATION_TYPES.REPORT_UPDATED]: `✏️ ${reportName} updated successfully!`,
    [NOTIFICATION_TYPES.REPORT_DELETED]: `🗑️ ${reportName} deleted successfully!`,
    [NOTIFICATION_TYPES.BULK_DELETED]: `🗑️ ${reportName} reports deleted successfully!`,
  };
  return messages[action] || 'Action completed successfully!';
};

// Professional notification service
class NotificationService {
  constructor() {
    this.hasShownWelcome = false;
    this.notificationHistory = new Map();
    this.maxHistory = 50;
    this.cooldownPeriod = 30000; // 30 seconds cooldown
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

  // Success notification
  success(message, options = {}) {
    const { type, identifier, reportName = '' } = options;
    
    if (type && !this.isCRUDOperation(type)) {
      return;
    }
    
    if (type && identifier) {
      if (!this.shouldShowNotification(type, identifier)) {
        console.log(`Notification suppressed for ${type} - ${identifier} (rate limited)`);
        return;
      }
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
      autoClose: options.noAutoClose ? false : 3000,
    });
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
      autoClose: 5000,
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

  // Info notification - with welcome support
  info(message, options = {}) {
    const { type, identifier } = options;
    
    // Special handling for welcome notification
    if (type === 'welcome') {
      if (this.hasShownWelcome) return;
      this.hasShownWelcome = true;
      
      toast.info(message, {
        ...toastConfig,
        ...options,
        icon: '👋',
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
      return;
    }
    
    // Skip info notifications for fetch/view operations
    if (type && (type.includes('view') || type === 'dashboard_load')) {
      return;
    }

    // Rate limiting for info notifications
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
      autoClose: options.noAutoClose ? false : 3000,
    });
  }

  // Welcome notification (shown only once per session)
  welcome(userName = '') {
    this.info(`👋 Welcome${userName ? ` ${userName}` : ''}! Your reports are loading...`, {
      type: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
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

  // --- CRUD Operation Notifications ---
  
  reportCreated(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_CREATED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_CREATED,
      identifier: identifier || `create_${Date.now()}`,
      reportName: reportName,
    });
  }

  reportUpdated(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_UPDATED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_UPDATED,
      identifier: identifier || `update_${Date.now()}`,
      reportName: reportName,
    });
  }

  reportDeleted(reportName, identifier) {
    this.success(getReportMessage(NOTIFICATION_TYPES.REPORT_DELETED, reportName), {
      type: NOTIFICATION_TYPES.REPORT_DELETED,
      identifier: identifier || `delete_${Date.now()}`,
      reportName: reportName,
    });
  }

  bulkDeleted(count) {
    this.success(getReportMessage(NOTIFICATION_TYPES.BULK_DELETED, count), {
      type: NOTIFICATION_TYPES.BULK_DELETED,
      identifier: 'bulk',
      reportName: count,
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
      autoClose: 2000,
    });
  }

  // Dismiss all notifications
  dismissAll() {
    toast.dismiss();
  }

  // Reset state
  resetState() {
    this.hasShownWelcome = false;
    this.notificationHistory.clear();
  }

  // Get notification history (for debugging)
  getHistory() {
    return Array.from(this.notificationHistory.entries());
  }

  // Get stats
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
export { NOTIFICATION_TYPES };

export default new NotificationService();