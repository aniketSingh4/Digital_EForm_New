// src/pages/Dashboard.js
import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    FaUserCircle,
    FaSignOutAlt,
    FaCog,
    FaClipboardCheck,
    FaTools,
    FaCalendarCheck,
    FaWrench,
    FaFileAlt,
    FaBell,
    FaSearch,
    FaPlusCircle,
    FaListAlt,
    FaSpinner,
    FaChartLine,
    FaArrowRight,
    FaShieldAlt,
    FaStar,
    FaUsers,
    FaCheckCircle,
    FaClock,
    FaExclamationTriangle,
    FaMicrochip,
    FaTimes,
    FaCheck,
    FaExclamation,
    FaInfoCircle,
    FaTrash,
    FaCheckDouble,
    FaClock as FaClockIcon,
    FaHeadset,
    FaBookOpen,
    FaEnvelope,
    FaPhone,
    FaGlobe,
    FaWhatsapp,
    FaTelegram,
    FaVideo,
    FaComments,
    FaQuestionCircle,
    FaLightbulb,
    FaDownload,
    FaPrint
} from "react-icons/fa";
import { useNotification } from "../context/notificationContext"; //Fixing the Import of NotificationContext.jsx file.
import notificationService from "../services/notificationService"; //Fixing the notificationService.jsx file
import "../assets/Dashboard.css";
import { FaSync } from "react-icons/fa";
import { getAuthHeaders } from "../utils/roles";
import { env } from "../config/env";

//Cache keys
const CACHE_KEY = 'dashboard_data';
const CACHE_TIMESTAMP_KEY = 'dashboard_timestamp';
const CACHE_DURATION = 120 * 60 * 1000; // 2 hours cache

export default function Dashboard() {
    const navigate = useNavigate();
    const {
        notifications,
        unreadCount,
        addNotification,
        dismissNotification,
        markAllAsRead,
        clearAllNotifications
    } = useNotification();

    const [openMenu, setOpenMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [reportCounts, setReportCounts] = useState(() => {
        //Load from cache on initial render
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
            try {
                const data = JSON.parse(cached);
                const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
                if (timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
                    return data;
                }
            } catch (e) {
                // Invalid cache, ignore
            }
        }
        return {
            pmReports: 0,
            preVisitChecklists: 0,
            calibrationReports: 0,
            installationReports: 0
        };
    });
    const [loading, setLoading] = useState(() => {
        //Only show loading if no cached data
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        if (cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION) {
            return false;
        }
        return true;
    });
    const [error, setError] = useState(null);
    const [hoveredCard, setHoveredCard] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showNotifications, setShowNotifications] = useState(false);
    const [notificationFilter, setNotificationFilter] = useState('all');
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Modal states
    const [showSupportModal, setShowSupportModal] = useState(false);
    const [showDocsModal, setShowDocsModal] = useState(false);
    
    //Refs to prevent duplicate fetches
    const hasFetched = useRef(false);
    const isFetching = useRef(false);

    const userName = localStorage.getItem("userName") || "User";
    const userRole = localStorage.getItem("userRole") || "USER";

    // Show welcome notification on first load (only once)
    useEffect(() => {
        const welcomeShown = sessionStorage.getItem('welcome_shown');
        if (!welcomeShown) {
            notificationService.welcome(userName);
            sessionStorage.setItem('welcome_shown', 'true');
        }
    }, [userName]);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 60000);
        return () => clearInterval(timer);
    }, []);

    //Optimized fetch with cache check
    useEffect(() => {
        // Check if we have valid cached data
        const cached = localStorage.getItem(CACHE_KEY);
        const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const hasValidCache = cached && timestamp && (Date.now() - parseInt(timestamp)) < CACHE_DURATION;

        // If we have valid cache and not forcing refresh, skip fetch
        if (hasValidCache && !isRefreshing) {
            setLoading(false);
            return;
        }

        // Prevent duplicate fetches
        if (isFetching.current) return;
        
        fetchReportCounts();
    }, []); //Empty dependency array - runs only once

    //Separate function for manual refresh
    const handleRefresh = () => {
        setIsRefreshing(true);
        setLoading(true);
        fetchReportCounts();
    };

    const fetchReportCounts = async () => {
        if (isFetching.current) return;
        isFetching.current = true;

        try {
            const results = await Promise.allSettled([
                fetch(`${env.PM_REPORTS_URL}/count`, {
                    headers: getAuthHeaders()
                }).then(res => res.ok ? res.json() : 0).catch(() => 0),
                fetch(`${env.PREVISIT_REPORTS_URL}/count`, {
                    headers: getAuthHeaders()
                }).then(res => res.ok ? res.json() : 0).catch(() => 0),
                fetch(`${env.CALIBRATION_REPORTS_URL}/count`, {
                    headers: getAuthHeaders()
                }).then(res => res.ok ? res.json() : 0).catch(() => 0),
                fetch(env.INSTALLATION_REPORTS_URL, {
                    headers: getAuthHeaders()
                }).then(res => res.ok ? res.json() : [])
                    .then(data => Array.isArray(data) ? data.length : 0)
                    .catch(() => 0)
            ]);

            const counts = results.map(result =>
                result.status === 'fulfilled' ? result.value : 0
            );

            const newCounts = {
                pmReports: typeof counts[0] === 'object' ? counts[0].count || 0 : counts[0] || 0,
                preVisitChecklists: typeof counts[1] === 'object' ? counts[1].count || 0 : counts[1] || 0,
                calibrationReports: typeof counts[2] === 'object' ? counts[2].count || 0 : counts[2] || 0,
                installationReports: typeof counts[3] === 'number' ? counts[3] : 0
            };

            setReportCounts(newCounts);
            setError(null);

            //Save to cache
            localStorage.setItem(CACHE_KEY, JSON.stringify(newCounts));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, String(Date.now()));

            // Only show notification on manual refresh
            if (isRefreshing) {
                notificationService.success('Dashboard refreshed successfully', {
                    type: 'dashboard_load',
                    identifier: 'dashboard',
                    autoClose: 3000
                });
            }

        } catch (error) {
            console.error("Error fetching report counts:", error);
            setError("Failed to load report counts. Please refresh the page.");
            
            notificationService.error('Failed to load dashboard data', {
                identifier: 'dashboard_error'
            });
            
        } finally {
            setLoading(false);
            isFetching.current = false;
            setIsRefreshing(false);
        }
    };

    //Memoized features to prevent unnecessary re-renders
    const features = useMemo(() => [
        {
            id: 1,
            title: "Preventive Maintenance Report",
            description: "Generate and manage preventive maintenance service reports with detailed checklists and sign-off.",
            icon: <FaClipboardCheck size={40} />,
            path: "/pm-reports",
            viewAllPath: "/pm-reports/view-all",
            color: "#4F46E5",
            bgGradient: "linear-gradient(135deg, #4F46E5, #7C3AED, #6D28D9)",
            iconBg: "rgba(79, 70, 229, 0.12)",
            borderColor: "rgba(79, 70, 229, 0.3)",
            count: reportCounts.pmReports,
            countLabel: "Reports Created",
            badge: "Active",
            badgeColor: "#10b981",
            status: "operational",
            progress: 78,
            lightColor: "#818CF8",
            darkColor: "#3730A3",
            shadowColor: "rgba(79, 70, 229, 0.25)"
        },
        {
            id: 2,
            title: "Pre-Visit Report",
            description: "Complete pre-visit inspection checklists to ensure all safety and preparation protocols are followed.",
            icon: <FaCalendarCheck size={40} />,
            path: "/previsit/new",
            viewAllPath: "/previsit/view-all",
            color: "#0EA5E9",
            bgGradient: "linear-gradient(135deg, #0EA5E9, #06B6D4, #0891B2)",
            iconBg: "rgba(14, 165, 233, 0.12)",
            borderColor: "rgba(14, 165, 233, 0.3)",
            count: reportCounts.preVisitChecklists,
            countLabel: "Reports Created",
            badge: "Active",
            badgeColor: "#10b981",
            status: "operational",
            progress: 85,
            lightColor: "#7DD3FC",
            darkColor: "#0369A1",
            shadowColor: "rgba(14, 165, 233, 0.25)"
        },
        {
            id: 3,
            title: "Calibration Report",
            description: "Document and track calibration activities for sensors and instruments with accurate records.",
            icon: <FaTools size={40} />,
            path: "/calibration-reports/new",
            viewAllPath: "/calibration-reports",
            color: "#F59E0B",
            bgGradient: "linear-gradient(135deg, #F59E0B, #F97316, #EA580C)",
            iconBg: "rgba(245, 158, 11, 0.12)",
            borderColor: "rgba(245, 158, 11, 0.3)",
            count: reportCounts.calibrationReports,
            countLabel: "Reports Created",
            badge: "Active",
            badgeColor: "#10b981",
            status: "Operational",
            progress: 62,
            lightColor: "#FCD34D",
            darkColor: "#B45309",
            shadowColor: "rgba(245, 158, 11, 0.25)"
        },
        {
            id: 4,
            title: "Installation & Commissioning Report",
            description: "Manage end-to-end installation and commissioning processes with comprehensive documentation.",
            icon: <FaMicrochip size={40} />,
            path: "/installation-reports/new",
            viewAllPath: "/installation-reports",
            color: "#10B981",
            bgGradient: "linear-gradient(135deg, #10B981, #059669, #047857)",
            iconBg: "rgba(16, 185, 129, 0.12)",
            borderColor: "rgba(16, 185, 129, 0.3)",
            count: reportCounts.installationReports,
            countLabel: "Reports Created",
            badge: "Active",
            badgeColor: "#10b981",
            status: "operational",
            progress: 93,
            lightColor: "#6EE7B7",
            darkColor: "#065F46",
            shadowColor: "rgba(16, 185, 129, 0.25)"
        }
    ], [reportCounts]);

    const handleLogout = () => {
        notificationService.info('Logging out...', { autoClose: 2000 });
        //Clear cache on logout
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIMESTAMP_KEY);
        sessionStorage.removeItem('welcome_shown');
        setTimeout(() => {
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("userRole");
            navigate("/login");
        }, 1000);
    };

    const totalReports = Object.values(reportCounts).reduce((a, b) => a + b, 0);

    const handleViewAll = (feature) => {
        notificationService.info(`Opening ${feature.title}`, { 
            autoClose: 3000,
            identifier: `view_${feature.id}`
        });
        navigate(feature.viewAllPath);
    };

    const handleCreateNew = (feature) => {
        notificationService.info(`Creating new ${feature.title}`, { 
            autoClose: 3000,
            identifier: `create_${feature.id}`
        });
        navigate(feature.path);
    };

    const handleNotificationClick = () => {
        setShowNotifications(!showNotifications);
    };

    const handleNotificationDismiss = (id, e) => {
        e.stopPropagation();
        dismissNotification(id);
    };

    const handleMarkAllRead = () => {
        markAllAsRead();
        notificationService.success('All notifications marked as read', {
            autoClose: 3000
        });
    };

    const handleClearAll = () => {
        clearAllNotifications();
        notificationService.info('All notifications cleared', {
            autoClose: 3000
        });
    };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return "Good Morning";
        if (hour < 17) return "Good Afternoon";
        return "Good Evening";
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'success': return <FaCheckCircle style={{ color: '#10b981' }} />;
            case 'error': return <FaExclamationTriangle style={{ color: '#ef4444' }} />;
            case 'warning': return <FaExclamation style={{ color: '#f59e0b' }} />;
            default: return <FaInfoCircle style={{ color: '#3b82f6' }} />;
        }
    };

    const getNotificationTime = (timestamp) => {
        if (!timestamp) return 'Just now';
        const diff = Date.now() - new Date(timestamp).getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    const filteredNotifications = notificationFilter === 'all'
        ? notifications
        : notifications.filter(n => n.type === notificationFilter);

    const filteredFeatures = features.filter(feature =>
        feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        feature.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const openSupportModal = () => {
        setShowSupportModal(true);
        document.body.style.overflow = 'hidden';
    };

    const closeSupportModal = () => {
        setShowSupportModal(false);
        document.body.style.overflow = 'auto';
    };

    const openDocsModal = () => {
        setShowDocsModal(true);
        document.body.style.overflow = 'hidden';
    };

    const closeDocsModal = () => {
        setShowDocsModal(false);
        document.body.style.overflow = 'auto';
    };

    return (
        <div className="dashboard">
            {/* Background Video */}
            <video
                autoPlay
                muted
                loop
                playsInline
                className="background-video"
            >
                <source
                    src="/856171-hd_1920_1080_30fps.mp4"
                    type="video/mp4"
                />
            </video>

            <div className="overlay"></div>

            {/* Navbar */}
            <nav className="navbar">
                <div className="logo">
                    <span className="logo-icon">⚙️</span>
                    <span className="logo-text">Digital PM & Installation System</span>
                </div>

                <div className="nav-actions">
                    <div className="search-container">
                        <FaSearch className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search features..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="notification-wrapper">
                        <button
                            className="notification-btn"
                            onClick={handleNotificationClick}
                            aria-label="Notifications"
                        >
                            <FaBell size={20} />
                            {unreadCount > 0 && (
                                <span className="notification-badge">{unreadCount}</span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-dropdown-header">
                                    <div className="notification-title">
                                        <FaBell />
                                        <span>Notifications</span>
                                        {unreadCount > 0 && (
                                            <span className="unread-count">{unreadCount} new</span>
                                        )}
                                    </div>
                                    <div className="notification-actions">
                                        {notifications.length > 0 && (
                                            <>
                                                <button
                                                    className="mark-read-btn"
                                                    onClick={handleMarkAllRead}
                                                    title="Mark all as read"
                                                >
                                                    <FaCheckDouble />
                                                </button>
                                                <button
                                                    className="clear-all-btn"
                                                    onClick={handleClearAll}
                                                    title="Clear all"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            className="close-btn"
                                            onClick={() => setShowNotifications(false)}
                                        >
                                            <FaTimes />
                                        </button>
                                    </div>
                                </div>

                                <div className="notification-filters">
                                    <button
                                        className={`filter-btn ${notificationFilter === 'all' ? 'active' : ''}`}
                                        onClick={() => setNotificationFilter('all')}
                                    >
                                        All
                                    </button>
                                    <button
                                        className={`filter-btn ${notificationFilter === 'success' ? 'active' : ''}`}
                                        onClick={() => setNotificationFilter('success')}
                                    >
                                        Success
                                    </button>
                                    <button
                                        className={`filter-btn ${notificationFilter === 'warning' ? 'active' : ''}`}
                                        onClick={() => setNotificationFilter('warning')}
                                    >
                                        Warning
                                    </button>
                                    <button
                                        className={`filter-btn ${notificationFilter === 'error' ? 'active' : ''}`}
                                        onClick={() => setNotificationFilter('error')}
                                    >
                                        Error
                                    </button>
                                    <button
                                        className={`filter-btn ${notificationFilter === 'info' ? 'active' : ''}`}
                                        onClick={() => setNotificationFilter('info')}
                                    >
                                        Info
                                    </button>
                                </div>

                                <div className="notification-list">
                                    {filteredNotifications.length === 0 ? (
                                        <div className="notification-empty-state">
                                            <FaBell size={40} style={{ opacity: 0.3 }} />
                                            <p>No notifications</p>
                                            <span>You're all caught up!</span>
                                        </div>
                                    ) : (
                                        filteredNotifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                            >
                                                <div className="notification-icon">
                                                    {getNotificationIcon(notif.type)}
                                                </div>
                                                <div className="notification-content">
                                                    <div className="notification-text">{notif.text}</div>
                                                    <div className="notification-meta">
                                                        <span className="notification-time">
                                                            <FaClockIcon size={12} />
                                                            {getNotificationTime(notif.timestamp)}
                                                        </span>
                                                        <span className={`notification-type ${notif.type}`}>
                                                            {notif.type}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button
                                                    className="notification-dismiss"
                                                    onClick={(e) => handleNotificationDismiss(notif.id, e)}
                                                >
                                                    <FaTimes />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {notifications.length > 0 && (
                                    <div className="notification-footer">
                                        <button onClick={handleMarkAllRead}>
                                            Mark all as read
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="profile">
                        <button
                            className="profile-btn"
                            onClick={() => setOpenMenu(!openMenu)}
                        >
                            <FaUserCircle size={32} />
                            <span className="user-name">{userName}</span>
                            <span className="dropdown-arrow">▼</span>
                        </button>

                        {openMenu && (
                            <div className="dropdown">
                                <div className="dropdown-header">
                                    <FaUserCircle size={24} />
                                    <div>
                                        <div className="dropdown-name">{userName}</div>
                                        <div className="dropdown-role">{userRole}</div>
                                    </div>
                                </div>
                                <hr />
                                <button
                                    onClick={handleLogout}
                                    className="logout"
                                >
                                    <FaSignOutAlt /> Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <div className="main-content">
                {/* Welcome Section */}
                <div className="welcome-section">
                    <div className="welcome-text">
                        <div className="welcome-badge">
                            <FaShieldAlt /> {userRole}
                        </div>
                        <h1>
                            {getGreeting()}, <span className="highlight">{userName}</span>
                        </h1>
                        <p>
                            Manage your <strong>Digital Installation & PM Visit E-Form System</strong> efficiently
                        </p>
                    </div>
                    <div className="welcome-stats">
                        <div className="welcome-stat">
                            <div className="stat-value">{totalReports}</div>
                            <div className="stat-label">Total Reports</div>
                        </div>
                        <div className="welcome-stat">
                            <div className="stat-value">{currentTime.toLocaleTimeString()}</div>
                            <div className="stat-label">{currentTime.toLocaleDateString()}</div>
                        </div>
                        <button 
                            className="refresh-btn"
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            title="Refresh data"
                        >
                            {isRefreshing ? <FaSpinner className="spinning" /> : <FaSync />}
                        </button>
                    </div>
                </div>

                {/* Features Section */}
                <div className="features-section">
                    <div className="section-header">
                        <div>
                            <h2>
                                <span className="section-title">Report Actions</span>
                            </h2>
                            <span className="section-subtitle">Select a service to view or create reports</span>
                        </div>
                        {searchTerm && (
                            <span className="search-results">
                                Found {filteredFeatures.length} results
                            </span>
                        )}
                        {loading && !isRefreshing && (
                            <span className="loading-badge">
                                <FaSpinner className="spinning" /> Loading...
                            </span>
                        )}
                    </div>

                    {error ? (
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            <button onClick={handleRefresh} className="retry-btn">
                                Retry
                            </button>
                        </div>
                    ) : (
                        <div className="features-grid">
                            {filteredFeatures.map((feature, index) => (
                                <div
                                    key={feature.id}
                                    className={`feature-card ${hoveredCard === feature.id ? 'hovered' : ''}`}
                                    style={{
                                        borderColor: feature.color,
                                        background: `linear-gradient(135deg, ${feature.color}06, ${feature.color}02)`,
                                        animationDelay: `${index * 0.1}s`
                                    }}
                                    onMouseEnter={() => setHoveredCard(feature.id)}
                                    onMouseLeave={() => setHoveredCard(null)}
                                >
                                    <div className="feature-badge" style={{ background: feature.badgeColor }}>
                                        {feature.badge}
                                    </div>
                                    <div className="feature-icon-wrapper" style={{ background: feature.iconBg }}>
                                        <div className="feature-icon" style={{ color: feature.color }}>
                                            {feature.icon}
                                        </div>
                                    </div>
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>

                                    <div className="feature-stats">
                                        <div className="stat-item">
                                            <span className="stat-number">{feature.count}</span>
                                            <span className="stat-label">{feature.countLabel}</span>
                                        </div>
                                    </div>

                                    <div className="feature-actions">
                                        <button
                                            className="action-btn view-btn"
                                            onClick={() => handleViewAll(feature)}
                                            style={{ borderColor: feature.color, color: feature.color }}
                                        >
                                            <FaListAlt /> View All
                                        </button>
                                        <button
                                            className="action-btn create-btn"
                                            onClick={() => handleCreateNew(feature)}
                                            style={{ background: feature.bgGradient }}
                                        >
                                            <FaPlusCircle /> Create New
                                        </button>
                                    </div>

                                    <div className="feature-footer">
                                        <span className="feature-number">
                                            {String(feature.id).padStart(2, '0')}
                                        </span>
                                        <span className="feature-arrow">
                                            <FaArrowRight />
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Access Footer */}
                <div className="quick-access">
                    <div className="quick-access-content">
                        <div className="quick-access-text">
                            <h3>Need Help?</h3>
                            <p>Contact support or view documentation for assistance</p>
                        </div>
                        <div className="quick-access-buttons">
                            <button
                                className="btn-support"
                                onClick={openSupportModal}
                            >
                                <FaHeadset /> Support
                            </button>
                            <button
                                className="btn-docs"
                                onClick={openDocsModal}
                            >
                                <FaBookOpen /> Documentation
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* SUPPORT MODAL */}
            {showSupportModal && (
                <div className="modal-overlay" onClick={closeSupportModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header support-header">
                            <div className="modal-header-icon">
                                <FaHeadset />
                            </div>
                            <h2>Support Center</h2>
                            <button className="modal-close" onClick={closeSupportModal}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <p className="modal-description">
                                Our support team is here to help you with any questions or issues you may have. 
                                Choose your preferred way to get in touch with us.
                            </p>

                            <div className="support-options">
                                <div className="support-option">
                                    <div className="support-option-icon">
                                        <FaEnvelope />
                                    </div>
                                    <div className="support-option-content">
                                        <h4>Email Support</h4>
                                        <p>Get response within 24 hours</p>
                                        <a href="mailto:support@fespl.com" className="support-link">
                                            duton@florosense.com
                                        </a>
                                    </div>
                                    <button className="support-option-btn">Email</button>
                                </div>

                                <div className="support-option">
                                    <div className="support-option-icon">
                                        <FaPhone />
                                    </div>
                                    <div className="support-option-content">
                                        <h4>Phone Support</h4>
                                        <p>Available 9 AM - 6 PM IST</p>
                                        <a href="tel:+919876543210" className="support-link">
                                            +91 98765 43210
                                        </a>
                                    </div>
                                    <button className="support-option-btn">Call</button>
                                </div>

                                <div className="support-option">
                                    <div className="support-option-icon">
                                        <FaWhatsapp />
                                    </div>
                                    <div className="support-option-content">
                                        <h4>WhatsApp</h4>
                                        <p>Quick chat support</p>
                                        <a href="https://wa.me/919876543210" className="support-link">
                                            +91 98765 43210
                                        </a>
                                    </div>
                                    <button className="support-option-btn">Chat</button>
                                </div>

                                <div className="support-option">
                                    <div className="support-option-icon">
                                        <FaComments />
                                    </div>
                                    <div className="support-option-content">
                                        <h4>Live Chat</h4>
                                        <p>Chat with our support team</p>
                                        <span className="support-status online">● Online</span>
                                    </div>
                                    <button className="support-option-btn primary">Start Chat</button>
                                </div>
                            </div>

                            <div className="support-faq">
                                <div className="faq-header">
                                    <FaQuestionCircle />
                                    <h4>Frequently Asked Questions</h4>
                                </div>
                                <div className="faq-list">
                                    <div className="faq-item">
                                        <div className="faq-question">
                                            <span>How do I create a new report?</span>
                                            <FaChevronDown />
                                        </div>
                                    </div>
                                    <div className="faq-item">
                                        <div className="faq-question">
                                            <span>How to export reports to PDF?</span>
                                            <FaChevronDown />
                                        </div>
                                    </div>
                                    <div className="faq-item">
                                        <div className="faq-question">
                                            <span>What to do if I forget my password?</span>
                                            <FaChevronDown />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DOCUMENTATION MODAL */}
            {showDocsModal && (
                <div className="modal-overlay" onClick={closeDocsModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header docs-header">
                            <div className="modal-header-icon">
                                <FaBookOpen />
                            </div>
                            <h2>Documentation</h2>
                            <button className="modal-close" onClick={closeDocsModal}>
                                <FaTimes />
                            </button>
                        </div>
                        
                        <div className="modal-body">
                            <p className="modal-description">
                                Access comprehensive documentation to help you navigate and make the most of the 
                                Digital PM & Installation System.
                            </p>

                            <div className="docs-grid">
                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaClipboardCheck />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>Getting Started</h4>
                                        <p>Learn the basics of using the system</p>
                                        <button className="doc-btn">View Guide</button>
                                    </div>
                                </div>

                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaTools />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>User Manual</h4>
                                        <p>Complete system user guide</p>
                                        <button className="doc-btn">Download PDF</button>
                                    </div>
                                </div>

                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaVideo />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>Video Tutorials</h4>
                                        <p>Step-by-step video guides</p>
                                        <button className="doc-btn">Watch Videos</button>
                                    </div>
                                </div>

                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaLightbulb />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>Best Practices</h4>
                                        <p>Tips and recommendations</p>
                                        <button className="doc-btn">Learn More</button>
                                    </div>
                                </div>

                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaDownload />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>API Documentation</h4>
                                        <p>Developer API references</p>
                                        <button className="doc-btn">View API</button>
                                    </div>
                                </div>

                                <div className="doc-card">
                                    <div className="doc-card-icon">
                                        <FaPrint />
                                    </div>
                                    <div className="doc-card-content">
                                        <h4>Print Guides</h4>
                                        <p>Printable reference guides</p>
                                        <button className="doc-btn">Print</button>
                                    </div>
                                </div>
                            </div>

                            <div className="docs-footer">
                                <div className="docs-footer-text">
                                    <FaGlobe />
                                    <span>Need more help? Visit our </span>
                                    <a href="#">Knowledge Base</a>
                                    <span> or </span>
                                    <a href="#" onClick={() => { closeDocsModal(); openSupportModal(); }}>Contact Support</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Missing icon component
const FaChevronDown = () => <span style={{ fontSize: '14px' }}>▾</span>;