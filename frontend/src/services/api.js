import axios from "axios";
import { env } from "../config/env";

const api = axios.create({
    baseURL: env.AUTH_API_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 20000,
});

const isPublicAuthUrl = (url = "") =>
    url.includes("/auth/login") || url.includes("/auth/register");

// Request interceptor with timing
api.interceptors.request.use(
    (config) => {
        config.metadata = { startTime: new Date() };

        const token = localStorage.getItem("token");
        const url = config.url || "";
        if (token && !isPublicAuthUrl(url)) {
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

        if (error.code === "ECONNABORTED") {
            console.error("Request timeout!");
        }

        const failedUrl = error.config?.url || "";
        const isPublicAuth = isPublicAuthUrl(failedUrl);

        if (
            !isPublicAuth &&
            error.response &&
            (error.response.status === 401 || error.response.status === 403)
        ) {
            console.log("Token expired or invalid - logging out");
            localStorage.removeItem("token");
            localStorage.removeItem("userName");
            localStorage.removeItem("userRole");
            localStorage.removeItem("dashboard_data");
            localStorage.removeItem("dashboard_timestamp");
            localStorage.removeItem("notifications");
            const email = localStorage.getItem("userEmail");
            if (email) {
                localStorage.removeItem(`notifications_${email}`);
            }
            localStorage.removeItem("userEmail");

            if (!window.location.pathname.includes("/login")) {
                window.location.href = "/login";
            }
        }

        return Promise.reject(error);
    }
);

export default api;
