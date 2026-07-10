// src/context/NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([
    { id: 1, text: "3 reports pending review", type: "warning", timestamp: new Date(Date.now() - 5 * 60000), read: false },
    { id: 2, text: "New PM report submitted by John", type: "info", timestamp: new Date(Date.now() - 30 * 60000), read: false },
    { id: 3, text: "System update v2.4.0 available", type: "success", timestamp: new Date(Date.now() - 2 * 3600000), read: false },
    { id: 4, text: "Calibration certificate expiring soon", type: "warning", timestamp: new Date(Date.now() - 24 * 3600000), read: true },
    { id: 5, text: "Weekly report generated successfully", type: "success", timestamp: new Date(Date.now() - 48 * 3600000), read: true }
  ]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = (text, type = 'info', duration = 5000) => {
    const newNotification = {
      id: Date.now(),
      text,
      type,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Show toast notification
    const toastConfig = {
      position: "top-right",
      autoClose: duration,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    };

    switch(type) {
      case 'success':
        toast.success(text, toastConfig);
        break;
      case 'error':
        toast.error(text, toastConfig);
        break;
      case 'warning':
        toast.warning(text, toastConfig);
        break;
      default:
        toast.info(text, toastConfig);
    }
  };

  const dismissNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.dismiss();
  };

  const value = {
    notifications,
    unreadCount,
    addNotification,
    dismissNotification,
    markAllAsRead,
    clearAllNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;