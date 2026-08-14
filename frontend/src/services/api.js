import axios from "axios";
import { env } from "../config/env";
import { handleUnauthorizedResponse } from "../utils/authSession";

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

        if (!isPublicAuth) {
            handleUnauthorizedResponse(error);
        }

        return Promise.reject(error);
    }
);

export default api;
