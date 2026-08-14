// src/context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import notificationService, { isReportActionType } from '../services/notificationService';
import notificationApi, { mapServerNotification } from '../services/notificationApi';

const NotificationContext = createContext();

const AUTH_CHANGED_EVENT = 'eform-auth-changed';

const getCurrentEmail = () => localStorage.getItem('userEmail') || '';

const storageKeyFor = (email) => (email ? `notifications_${email}` : 'notifications');

const isActionNotification = (item) => {
    if (!item) {
        return false;
    }
    if (item.persisted || item.serverId) {
        return true;
    }
    return isReportActionType(item.eventType);
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within NotificationProvider');
    }
    return context;
};

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const emailRef = useRef(getCurrentEmail());
    const hasLoadedRef = useRef(false);

    const addNotification = useCallback((notification) => {
        const email = getCurrentEmail();
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
            localOnly: true,
            audience: 'USER',
            recipientEmail: email,
            ...notification
        };

        setNotifications(prev => [newNotification, ...prev].slice(0, 100));
    }, []);

    const refreshFromServer = useCallback(async () => {
        const email = getCurrentEmail();
        emailRef.current = email;
        if (!email || !localStorage.getItem('token')) {
            return;
        }
        try {
            const data = await notificationApi.list();
            if (!Array.isArray(data)) {
                console.error('Notification list did not return JSON; keeping current feed');
                return;
            }
            const mapped = data.map(mapServerNotification);
            setNotifications(prev => {
                const localOnly = prev.filter((item) => (
                    item.localOnly
                    && isActionNotification(item)
                    && (!item.recipientEmail || item.recipientEmail === email)
                ));
                const merged = [...mapped, ...localOnly];
                const seen = new Set();
                return merged.filter((item) => {
                    const key = String(item.id);
                    if (seen.has(key)) {
                        return false;
                    }
                    seen.add(key);
                    return true;
                }).slice(0, 100);
            });
        } catch (error) {
            console.error('Error loading notifications from server:', error);
        }
    }, []);

    useEffect(() => {
        const email = getCurrentEmail();
        emailRef.current = email;
        const savedNotifications = localStorage.getItem(storageKeyFor(email));
        if (savedNotifications) {
            try {
                const parsed = JSON.parse(savedNotifications);
                setNotifications(Array.isArray(parsed) ? parsed.filter(isActionNotification) : []);
            } catch (e) {
                console.error('Error loading notifications:', e);
            }
        }

        notificationService.setNotificationCallback(addNotification);
        notificationService.setRefreshCallback(refreshFromServer);
        hasLoadedRef.current = true;
        refreshFromServer();

        const onAuthChanged = () => {
            const email = getCurrentEmail();
            const previousEmail = emailRef.current;
            emailRef.current = email;
            if (email !== previousEmail) {
                const savedNotifications = localStorage.getItem(storageKeyFor(email));
                if (savedNotifications) {
                    try {
                        const parsed = JSON.parse(savedNotifications);
                        setNotifications(Array.isArray(parsed) ? parsed.filter(isActionNotification) : []);
                    } catch (e) {
                        setNotifications([]);
                    }
                } else {
                    setNotifications([]);
                }
            }
            refreshFromServer();
        };
        window.addEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
        window.addEventListener('storage', onAuthChanged);

        return () => {
            notificationService.setNotificationCallback(null);
            notificationService.setRefreshCallback(null);
            window.removeEventListener(AUTH_CHANGED_EVENT, onAuthChanged);
            window.removeEventListener('storage', onAuthChanged);
        };
    }, [addNotification, refreshFromServer]);

    useEffect(() => {
        if (!hasLoadedRef.current) {
            return;
        }
        const email = emailRef.current || getCurrentEmail();
        const actionable = notifications.filter(isActionNotification);
        if (actionable.length !== notifications.length) {
            setNotifications(actionable);
            return;
        }
        localStorage.setItem(storageKeyFor(email), JSON.stringify(actionable));
        setUnreadCount(actionable.filter(n => !n.read).length);
    }, [notifications]);

    const dismissNotification = useCallback((id) => {
        setNotifications(prev => {
            const item = prev.find(n => String(n.id) === String(id));
            if (item && (item.persisted || item.serverId)) {
                notificationApi.delete(item.serverId || item.id).catch((error) => {
                    console.error('Failed to delete notification:', error);
                });
            }
            return prev.filter(n => String(n.id) !== String(id));
        });
    }, []);

    const markAsRead = useCallback((id) => {
        setNotifications(prev => {
            const item = prev.find(n => String(n.id) === String(id));
            if (item && (item.persisted || item.serverId) && !item.read) {
                notificationApi.markRead(item.serverId || item.id).catch((error) => {
                    console.error('Failed to mark notification read:', error);
                });
            }
            return prev.map(n => String(n.id) === String(id) ? { ...n, read: true } : n);
        });
    }, []);

    const markAllAsRead = useCallback(() => {
        notificationApi.markAllRead().catch((error) => {
            console.error('Failed to mark all notifications read:', error);
        });
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }, []);

    const clearAllNotifications = useCallback(() => {
        notificationApi.clearAll().catch((error) => {
            console.error('Failed to clear notifications:', error);
        });
        setNotifications([]);
    }, []);

    const value = {
        notifications,
        unreadCount,
        addNotification,
        dismissNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications,
        refreshNotifications: refreshFromServer
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
