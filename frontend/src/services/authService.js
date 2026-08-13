import api from "./api";

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
            console.log("validateToken: No token found");
            return false;
        }

        try {
            // Check if token is a JWT (has 3 parts separated by dots)
            const parts = token.split('.');
            if (parts.length !== 3) {
                console.log("validateToken: Invalid token format");
                return false;
            }

            // Decode the payload (middle part)
            const payload = JSON.parse(atob(parts[1]));
            
            // Check if token has expiration
            if (!payload.exp) {
                console.log("validateToken: No expiration in token");
                return true; // If no expiration, assume valid
            }

            // Check if token is expired (exp is in seconds, Date.now() is in milliseconds)
            const expirationDate = new Date(payload.exp * 1000);
            const now = new Date();
            
            const isValid = now < expirationDate;
            console.log(`validateToken: Token ${isValid ? 'is valid' : 'is expired'}`);
            console.log(`Expiration: ${expirationDate.toLocaleString()}`);
            console.log(`Current: ${now.toLocaleString()}`);
            
            return isValid;
        } catch (error) {
            console.error("validateToken: Error decoding token:", error);
            return false;
        }
    },

    //Get user info from token without API call
    getUserFromToken: () => {
        const token = localStorage.getItem("token");
        if (!token) return null;

        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const payload = JSON.parse(atob(parts[1]));
            return {
                email: payload.email || payload.sub,
                userId: payload.userId || payload.id,
                role: payload.role || null,
                name: payload.name || null,
            };
        } catch (error) {
            console.error("getUserFromToken: Error:", error);
            return null;
        }
    },

    //Logout — clear auth only (cache cleared on explicit logout / 401)
    logout: () => {
        const email = localStorage.getItem("userEmail");
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("dashboard_data");
        localStorage.removeItem("dashboard_timestamp");
        localStorage.removeItem("notifications");
        if (email) {
            localStorage.removeItem(`notifications_${email}`);
        }
    },

    /** Clear auth tokens without wiping report caches (used when opening login page) */
    clearAuthSession: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
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