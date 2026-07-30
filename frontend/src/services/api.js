import axios from "axios";

const api = axios.create({
    baseURL: "https://authentication-service-eda5.onrender.com/api",
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 120000,
});

// Request interceptor with timing
api.interceptors.request.use(
    (config) => {
        console.log(`🚀 Request started: ${config.method.toUpperCase()} ${config.url}`);
        console.log(`⏱️ Time: ${new Date().toLocaleTimeString()}`);
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
        console.log(`✅ Request completed in ${duration}ms`);
        console.log(`📊 Status: ${response.status}`);
        return response;
    },
    (error) => {
        if (error.config && error.config.metadata) {
            const duration = new Date() - error.config.metadata.startTime;
            console.log(`❌ Request failed after ${duration}ms`);
        }
        
        if (error.code === 'ECONNABORTED') {
            console.error('⏰ Request timeout!');
        }
        
        return Promise.reject(error);
    }
);

export default api;