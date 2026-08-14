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
  REPORT_DOWNLOADED: 'REPORT_DOWNLOADED',
  BULK_DELETED: 'BULK_DELETED',
};

const REPORT_ACTION_TYPES = new Set(Object.values(NOTIFICATION_TYPES));

const REPORT_TYPES = {
  PM: 'PM Report',
  PRE_VISIT: 'Pre-Visit Checklist',
  CALIBRATION: 'Calibration Report',
  INSTALLATION: 'Installation & Commissioning Report'
};

const ACTION_VERBS = {
  [NOTIFICATION_TYPES.REPORT_CREATED]: 'created',
  [NOTIFICATION_TYPES.REPORT_UPDATED]: 'updated',
  [NOTIFICATION_TYPES.REPORT_DELETED]: 'deleted',
  [NOTIFICATION_TYPES.REPORT_DOWNLOADED]: 'downloaded',
  [NOTIFICATION_TYPES.BULK_DELETED]: 'deleted',
};

export const currentUserMeta = () => ({
  createdBy: localStorage.getItem('userName') || '',
  actorEmail: localStorage.getItem('userEmail') || '',
});

export const isReportActionType = (eventType) =>
  REPORT_ACTION_TYPES.has(String(eventType || '').toUpperCase());

const firstNonBlank = (...values) => {
  for (const value of values) {
    if (value != null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const aboutClause = (reportData = {}) => {
  const customer = firstNonBlank(reportData.customerName, reportData.customer, reportData.clientName, reportData.companyName);
  const location = firstNonBlank(reportData.location, reportData.site, reportData.siteName, reportData.siteAddress);
  const equipment = firstNonBlank(reportData.equipment, reportData.equipmentName, reportData.sensorId);

  if (customer && location) {
    return ` for ${customer}, ${location}`;
  }
  if (customer) {
    return ` for ${customer}`;
  }
  if (location) {
    return ` at ${location}`;
  }
  if (equipment) {
    return ` for ${equipment}`;
  }
  return '';
};

const getDetailedReportMessage = (action, reportData = {}, forActor = true) => {
  const typeLabel = firstNonBlank(reportData.reportType, 'Report');
  const title = firstNonBlank(reportData.reportName, reportData.reportTitle, reportData.reportId);
  const titlePart = title ? ` "${title}"` : '';
  const about = aboutClause(reportData);
  const who = forActor
    ? 'You'
    : (firstNonBlank(reportData.createdBy, reportData.actorName) || 'A user');

  if (action === NOTIFICATION_TYPES.BULK_DELETED) {
    const count = firstNonBlank(reportData.reportName, reportData.count, '1');
    return `${who} deleted ${count} ${typeLabel}${Number(count) === 1 ? '' : 's'}.`;
  }

  const verb = ACTION_VERBS[action] || 'updated';
  return `${who} ${verb} ${typeLabel}${titlePart}${about}.`;
};

const asReportData = (reportName, reportData, identifier) => {
  const data = reportData && typeof reportData === 'object' && !Array.isArray(reportData)
    ? reportData
    : { id: reportData };
  const actor = currentUserMeta();
  const title = firstNonBlank(
    data.reportName,
    data.reportTitle,
    data.serviceReportNo,
    data.reportNo,
    data.companyName,
    identifier
  );
  return {
    ...data,
    reportId: data.id || data._id || identifier || data.reportId,
    reportType: firstNonBlank(data.reportType, reportName, 'Report'),
    reportName: title,
    reportTitle: title,
    location: firstNonBlank(data.location, data.site, data.siteName, data.siteAddress),
    date: data.date || data.serviceDate || data.pmVisitDate,
    customerName: firstNonBlank(data.customerName, data.customer, data.clientName, data.companyName),
    equipment: firstNonBlank(data.equipment, data.equipmentName, data.sensorId),
    status: data.status,
    createdBy: firstNonBlank(data.createdBy, actor.createdBy),
    actorEmail: firstNonBlank(data.actorEmail, actor.actorEmail),
  };
};

const successToastStyle = {
  background: 'linear-gradient(135deg, #10b981, #059669)',
  color: 'white',
  borderRadius: '12px',
  boxShadow: '0 10px 40px rgba(16, 185, 129, 0.3)',
  fontWeight: '500',
  padding: '14px 20px',
  fontSize: '14px',
  border: '1px solid rgba(255,255,255,0.1)',
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
        summary: rest.summary || text,
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
      const created = await notificationApi.create({
        type: eventType,
        reportType: reportData.reportType || reportData.reportName || 'Report',
        reportTitle: String(reportData.reportName || reportData.reportTitle || reportData.reportId || ''),
        reportId: reportData.reportId != null ? String(reportData.reportId) : '',
        customerName: reportData.customerName || reportData.customer || reportData.clientName || '',
        location: reportData.location || reportData.site || reportData.siteName || reportData.siteAddress || '',
        equipment: reportData.equipment || reportData.equipmentName || '',
      });
      if (!Array.isArray(created)) {
        throw new Error('Notification persist returned a non-JSON response');
      }
      if (this.refreshCallback) {
        await this.refreshCallback();
      }
      return true;
    } catch (error) {
      console.error('Failed to persist notification:', error);
      return false;
    }
  }

  async persistAction(eventType, reportName, reportData = {}, identifier = null) {
    const data = asReportData(reportName, reportData, identifier);
    const message = getDetailedReportMessage(eventType, data, true);
    toast.success(message, {
      ...toastConfig,
      style: successToastStyle,
      progressStyle: { background: 'white' },
    });
    const persisted = await this.persistEvent(eventType, data);
    if (!persisted) {
      this.addToContext('success', message, {
        eventType,
        identifier: identifier || data.reportId,
        reportData: data,
        reportName: data.reportName,
        summary: message,
        localOnly: true,
      });
    }
    return data;
  }

  success(message, options = {}) {
    const {
      type,
      identifier,
      reportData = {},
      reportName = '',
      persistToServer = false,
      addToFeed = false,
      ...toastOptions
    } = options;

    toast.success(message, {
      ...toastConfig,
      ...toastOptions,
      style: {
        ...successToastStyle,
        ...(toastOptions.style || {}),
      },
      progressStyle: {
        background: 'white',
      },
    });

    if (addToFeed && !persistToServer) {
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
    const { addToFeed = false, ...toastOptions } = options;
    toast.error(message, {
      ...toastConfig,
      ...toastOptions,
      style: {
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(239, 68, 68, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        ...(toastOptions.style || {}),
      },
      progressStyle: {
        background: 'white',
      },
    });

    if (addToFeed) {
      this.addToContext('error', message, { ...options, localOnly: true });
    }
  }

  warning(message, options = {}) {
    const { addToFeed = false, ...toastOptions } = options;
    toast.warning(message, {
      ...toastConfig,
      ...toastOptions,
      style: {
        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(245, 158, 11, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        ...(toastOptions.style || {}),
      },
      progressStyle: {
        background: 'white',
      },
    });

    if (addToFeed) {
      this.addToContext('warning', message, { ...options, localOnly: true });
    }
  }

  info(message, options = {}) {
    const { addToFeed = false, ...toastOptions } = options;
    toast.info(message, {
      ...toastConfig,
      ...toastOptions,
      style: {
        background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
        color: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 40px rgba(59, 130, 246, 0.3)',
        fontWeight: '500',
        padding: '14px 20px',
        fontSize: '14px',
        border: '1px solid rgba(255,255,255,0.1)',
        ...(toastOptions.style || {}),
      },
      progressStyle: {
        background: 'white',
      },
    });

    if (addToFeed) {
      this.addToContext('info', message, { ...options, localOnly: true });
    }
  }

  pdfGenerated(filename, reportData = {}) {
    if (reportData && (reportData.reportType || reportData.reportName || reportData.id)) {
      return this.reportDownloaded(reportData.reportType || 'Report', {
        ...reportData,
        reportName: reportData.reportName || filename,
      });
    }
    this.success(`You downloaded ${filename || 'the report'}.`);
  }

  reportSaved(message) {
    this.success(message || 'Report saved successfully.');
  }

  reportDeleted(reportName, reportData = {}, identifier = null) {
    if (reportData && typeof reportData === 'object' && !Array.isArray(reportData)) {
      return this.reportDeletedAction(reportName, reportData, identifier);
    }
    if (identifier != null || (reportData != null && typeof reportData !== 'string')) {
      return this.reportDeletedAction(reportName, reportData, identifier);
    }
    this.info(reportName || 'Report deleted successfully.');
  }

  async reportCreated(reportName, reportData = {}, identifier = null) {
    return this.persistAction(NOTIFICATION_TYPES.REPORT_CREATED, reportName, reportData, identifier);
  }

  async reportUpdated(reportName, reportData = {}, identifier = null) {
    return this.persistAction(NOTIFICATION_TYPES.REPORT_UPDATED, reportName, reportData, identifier);
  }

  async reportDeletedAction(reportName, reportData = {}, identifier = null) {
    return this.persistAction(NOTIFICATION_TYPES.REPORT_DELETED, reportName, reportData, identifier);
  }

  async reportDownloaded(reportName, reportData = {}, identifier = null) {
    return this.persistAction(NOTIFICATION_TYPES.REPORT_DOWNLOADED, reportName, reportData, identifier);
  }

  async bulkDeleted(count, reportType = 'Report') {
    const data = {
      reportName: String(count),
      count,
      reportType,
    };
    return this.persistAction(NOTIFICATION_TYPES.BULK_DELETED, reportType, data, 'bulk');
  }

  welcome(userName = '') {
    this.info(`Welcome${userName ? ` ${userName}` : ''}!`, {
      eventType: 'welcome',
      autoClose: 4000,
      localOnly: true,
      addToFeed: false,
    });
  }

  dismissAll() {
    toast.dismiss();
  }
}

export { NOTIFICATION_TYPES, REPORT_TYPES, REPORT_ACTION_TYPES, getDetailedReportMessage };

const notificationService = new NotificationService();
export default notificationService;
