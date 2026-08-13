// src/services/notificationService.js
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import notificationApi from './notificationApi';

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

const NOTIFICATION_TYPES = {
  REPORT_CREATED: 'REPORT_CREATED',
  REPORT_UPDATED: 'REPORT_UPDATED',
  REPORT_DELETED: 'REPORT_DELETED',
  BULK_DELETED: 'BULK_DELETED',
};

const REPORT_TYPES = {
  PM: 'PM Report',
  PRE_VISIT: 'Pre-Visit Checklist',
  CALIBRATION: 'Calibration Report',
  INSTALLATION: 'Installation & Commissioning Report'
};

export const currentUserMeta = () => ({
  createdBy: localStorage.getItem('userName') || '',
  actorEmail: localStorage.getItem('userEmail') || '',
});

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
  const namePart = reportName ? `"${reportName}"` : (reportId ? `#${reportId}` : '');

  switch (action) {
    case NOTIFICATION_TYPES.REPORT_CREATED:
      message = `${typeLabel} ${namePart} created successfully`.trim();
      break;
    case NOTIFICATION_TYPES.REPORT_UPDATED:
      message = `${typeLabel} ${namePart} updated successfully`.trim();
      break;
    case NOTIFICATION_TYPES.REPORT_DELETED:
      message = `${typeLabel} ${namePart} deleted successfully`.trim();
      break;
    case NOTIFICATION_TYPES.BULK_DELETED:
      message = `${reportName} ${typeLabel}s deleted successfully`;
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

  Object.entries(additionalInfo || {}).forEach(([key, value]) => {
    if (value) details.push(`${key}: ${value}`);
  });

  if (details.length > 0) {
    message += `\n${details.join(' • ')}`;
  }

  return message;
};

const asReportData = (reportName, reportData, identifier) => {
  const data = reportData && typeof reportData === 'object' && !Array.isArray(reportData)
    ? reportData
    : { id: reportData };
  const actor = currentUserMeta();
  return {
    reportName: reportName,
    reportId: data.id || data._id || identifier,
    reportType: data.reportType || reportName || 'Report',
    location: data.location || data.site || data.siteName || data.siteAddress,
    date: data.date || data.serviceDate || data.pmVisitDate,
    customerName: data.customerName || data.customer || data.clientName || data.companyName,
    equipment: data.equipment || data.equipmentName || data.sensorId,
    status: data.status,
    createdBy: data.createdBy || actor.createdBy,
    actorEmail: data.actorEmail || actor.actorEmail,
    ...data
  };
};

class NotificationService {
  constructor() {
    this.notificationCallback = null;
    this.refreshCallback = null;
    this.hasShownWelcome = false;
    this.notificationHistory = new Map();
    this.maxHistory = 50;
    this.currentReportContext = {};
  }

  setNotificationCallback(callback) {
    this.notificationCallback = callback;
  }

  setRefreshCallback(callback) {
    this.refreshCallback = callback;
  }

  addToContext(type, text, metadata = {}) {
    if (this.notificationCallback) {
      const { type: eventType, ...rest } = metadata;
      this.notificationCallback({
        type,
        eventType: eventType || rest.eventType,
        text,
        timestamp: new Date().toISOString(),
        read: false,
        localOnly: rest.localOnly !== false,
        audience: rest.audience || 'USER',
        recipientEmail: rest.recipientEmail || localStorage.getItem('userEmail') || '',
        ...rest
      });
    }
  }

  setReportContext(context) {
    this.currentReportContext = {
      ...this.currentReportContext,
      ...context
    };
  }

  clearReportContext() {
    this.currentReportContext = {};
  }

  async persistEvent(eventType, reportData = {}) {
    try {
      await notificationApi.create({
        type: eventType,
        reportType: reportData.reportType || reportData.reportName || 'Report',
        reportTitle: String(reportData.reportName || reportData.reportTitle || reportData.reportId || ''),
        reportId: reportData.reportId != null ? String(reportData.reportId) : '',
        customerName: reportData.customerName || reportData.customer || reportData.clientName || '',
        location: reportData.location || reportData.site || reportData.siteName || reportData.siteAddress || '',
        equipment: reportData.equipment || reportData.equipmentName || '',
      });
      if (this.refreshCallback) {
        await this.refreshCallback();
      }
      return true;
    } catch (error) {
      console.error('Failed to persist notification:', error);
      return false;
    }
  }

  success(message, options = {}) {
    const { type, identifier, reportData = {}, reportName = '', persistToServer = false } = options;

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

    if (!persistToServer) {
      this.addToContext('success', message, {
        eventType: type,
        identifier,
        reportData: { ...this.currentReportContext, ...reportData, reportName },
        reportName,
        localOnly: true,
      });
    }
  }

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

    this.addToContext('error', message, { ...options, localOnly: true });
  }

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

    this.addToContext('warning', message, { ...options, localOnly: true });
  }

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

    this.addToContext('info', message, { ...options, localOnly: true });
  }

  pdfGenerated(filename) {
    this.success(`PDF generated: ${filename}`, {
      style: {
        background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
      },
    });
  }

  reportSaved(message) {
    this.success(message || 'Report saved successfully!');
  }

  reportDeleted(message) {
    this.info(message || 'Report deleted successfully!');
  }

  async reportCreated(reportName, reportData = {}, identifier = null) {
    const data = asReportData(reportName, reportData, identifier);
    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_CREATED, data);
    toast.success(message, {
      ...toastConfig,
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
    });
    const persisted = await this.persistEvent(NOTIFICATION_TYPES.REPORT_CREATED, data);
    if (!persisted) {
      this.addToContext('success', message, {
        eventType: NOTIFICATION_TYPES.REPORT_CREATED,
        identifier: identifier || data.reportId,
        reportData: data,
        reportName,
        localOnly: true,
      });
    }
  }

  async reportUpdated(reportName, reportData = {}, identifier = null) {
    const data = asReportData(reportName, reportData, identifier);
    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_UPDATED, data);
    toast.success(message, {
      ...toastConfig,
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
    });
    const persisted = await this.persistEvent(NOTIFICATION_TYPES.REPORT_UPDATED, data);
    if (!persisted) {
      this.addToContext('success', message, {
        eventType: NOTIFICATION_TYPES.REPORT_UPDATED,
        identifier: identifier || data.reportId,
        reportData: data,
        reportName,
        localOnly: true,
      });
    }
  }

  async reportDeletedAction(reportName, reportData = {}, identifier = null) {
    const data = asReportData(reportName, reportData, identifier);
    const message = getDetailedReportMessage(NOTIFICATION_TYPES.REPORT_DELETED, data);
    toast.success(message, {
      ...toastConfig,
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
    });
    const persisted = await this.persistEvent(NOTIFICATION_TYPES.REPORT_DELETED, data);
    if (!persisted) {
      this.addToContext('success', message, {
        eventType: NOTIFICATION_TYPES.REPORT_DELETED,
        identifier: identifier || data.reportId,
        reportData: data,
        reportName,
        localOnly: true,
      });
    }
  }

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

  welcome(userName = '') {
    this.info(`Welcome${userName ? ` ${userName}` : ''}!`, {
      eventType: 'welcome',
      noAutoClose: true,
      autoClose: 4000,
      localOnly: true,
    });
  }

  dismissAll() {
    toast.dismiss();
  }
}

export { NOTIFICATION_TYPES, REPORT_TYPES };

const notificationService = new NotificationService();
export default notificationService;
