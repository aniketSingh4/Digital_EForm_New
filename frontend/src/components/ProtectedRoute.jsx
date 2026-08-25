import { Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import authService from "../services/authService";

const ProtectedRoute = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const token = localStorage.getItem("token");

            if (!token) {
                setIsAuthenticated(false);
                setIsLoading(false);
                return;
            }

            const isValid = authService.validateToken();

            if (!isValid) {
                authService.logout();
                setIsAuthenticated(false);
            } else {
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
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
