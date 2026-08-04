import axios from "axios";

const api = axios.create({
    baseURL: "https://authentication-service-eda5.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 360000,
});

// Request interceptor with timing
api.interceptors.request.use(
    (config) => {
        config.metadata = { startTime: new Date() };
        
        const token = localStorage.getItem("token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor with timing
api.interceptors.response.use(
    (response) => {
        const duration = new Date() - response.config.metadata.startTime;
        console.log(`Request completed in ${duration}ms`);
        return response;
    },
    (error) => {
        if (error.config && error.config.metadata) {
            const duration = new Date() - error.config.metadata.startTime;
            console.log(`Request failed after ${duration}ms`);
        }
        
        if (error.code === 'ECONNABORTED') {
            console.error('Request timeout!');
        }

        //ADD THIS: Handle token expiration (401/403)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.log('Token expired or invalid - logging out');
            // Clear all stored data
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("dashboard_data");
            localStorage.removeItem("dashboard_timestamp");
            localStorage.removeItem("notifications");
            
            // Redirect to login page if not already there
            if (!window.location.pathname.includes('/login')) {
                window.location.href = "/login";
            }
        }
        
        return Promise.reject(error);
    }
);

export default api;