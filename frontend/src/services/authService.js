import api from "./api";
import { clearAuthStorage, decodeJwtPayload } from "../utils/authSession";

const AUTH_CHANGED_EVENT = "eform-auth-changed";

const authService = {

    register: async (userData) => {
        const response = await api.post("/auth/register", userData);
        return response.data;
    },

    login: async (loginData) => {
        const payload = {
            email: (loginData.email || loginData.username || "").trim(),
            password: loginData.password,
        };
        const response = await api.post("/auth/login", payload);
        return response.data;
    },

    //Validate token client-side (check expiration)
    validateToken: () => {
        const token = localStorage.getItem("token");
        
        if (!token) {
            return false;
        }

        const payload = decodeJwtPayload(token);
        if (!payload) {
            return false;
        }

        if (!payload.exp) {
            return true;
        }

        return Date.now() < payload.exp * 1000;
    },

    //Get user info from token without API call
    getUserFromToken: () => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        const payload = decodeJwtPayload(token);
        if (!payload) return null;
        return {
            email: payload.email || payload.sub,
            userId: payload.userId || payload.id,
            role: payload.role || null,
            name: payload.name || null,
        };
    },

    //Logout — clear auth only (cache cleared on explicit logout / 401)
    logout: () => {
        clearAuthStorage();
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    },

    /** Clear auth tokens without wiping report caches (used when opening login page) */
    clearAuthSession: () => {
        clearAuthStorage();
        window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
    },

    //Check if token exists
    isAuthenticated: () => {
        const token = localStorage.getItem("token");
        return !!token;
    },

    //Get stored token
    getToken: () => {
        return localStorage.getItem("token");
    },

    getRole: () => {
        return localStorage.getItem("userRole");
    },

    //Check token validity without decoding
    hasValidToken: () => {
        const token = localStorage.getItem("token");
        if (!token) return false;
        
        // Check if token has 3 parts
        const parts = token.split('.');
        return parts.length === 3;
    }
};

export default authService;