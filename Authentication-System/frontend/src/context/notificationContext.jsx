// src/context/NotificationContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import notificationService from '../services/notificationService';

const NotificationContext = createContext();

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

    // Load notifications from localStorage on mount
    useEffect(() => {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            try {
                const parsed = JSON.parse(savedNotifications);
                setNotifications(parsed);
                const unread = parsed.filter(n => !n.read).length;
                setUnreadCount(unread);
            } catch (e) {
                console.error('Error loading notifications:', e);
            }
        }

        // Register the callback with notificationService
        notificationService.setNotificationCallback((notification) => {
            addNotification(notification);
        });

        // Cleanup on unmount
        return () => {
            notificationService.setNotificationCallback(null);
        };
    }, []);

    // Save notifications to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
    }, [notifications]);

    const addNotification = (notification) => {
        const newNotification = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            read: false,
            ...notification
        };
        
        setNotifications(prev => [newNotification, ...prev]);
        
        // Limit notifications to 100
        setNotifications(prev => {
            if (prev.length > 100) {
                return prev.slice(0, 100);
            }
            return prev;
        });
    };

    const dismissNotification = (id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const markAsRead = (id) => {
        setNotifications(prev => 
            prev.map(n => 
                n.id === id ? { ...n, read: true } : n
            )
        );
    };

    const markAllAsRead = () => {
        setNotifications(prev => 
            prev.map(n => ({ ...n, read: true }))
        );
    };

    const clearAllNotifications = () => {
        setNotifications([]);
    };

    const value = {
        notifications,
        unreadCount,
        addNotification,
        dismissNotification,
        markAsRead,
        markAllAsRead,
        clearAllNotifications
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};