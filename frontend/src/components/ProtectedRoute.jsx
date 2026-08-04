// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";


const ProtectedRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");
            
            console.log("ProtectedRoute - Token exists:", !!token);
            
            if (!token) {
                console.log("ProtectedRoute - No token found");
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            //Check if token is valid (not expired)
            const isValid = authService.validateToken();
            
            if (!isValid) {
                console.log("ProtectedRoute - Token invalid or expired");
                authService.logout(); // Clear invalid token
                setIsAuthenticated(false);
            } else {
                console.log("ProtectedRoute - Token is valid");
                setIsAuthenticated(true);
            }
            
            setIsLoading(false);
        };

        checkAuth();
    }, []);

    if (isLoading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Validating session...
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log("ProtectedRoute - Redirecting to login");
        return <Navigate to="/login" replace />;
    }

    console.log("ProtectedRoute - Access granted");
    return children;
};

export default ProtectedRoute;