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

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");
        const url = config.url || "";
        if (token && !isPublicAuthUrl(url)) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.code === "ECONNABORTED") {
            console.error("Request timeout!");
        }

        const failedUrl = error.config?.url || "";
        if (!isPublicAuthUrl(failedUrl)) {
            handleUnauthorizedResponse(error);
        }

        return Promise.reject(error);
    }
);

export default api;
