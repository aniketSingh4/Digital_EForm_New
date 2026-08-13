import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";

export default function Login() {
    const navigate = useNavigate();

    //clear auth session on page load (keep report caches until logout/401)
    useEffect(() => {
        authService.clearAuthSession();
    }, []);

    const [formData, setFormData] = useState({
        username: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        setError("");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username || !formData.password) {
            setError("Please fill all fields.");
            return;
        }

        setLoading(true);
        setError("");

        try {
            authService.clearAuthSession();
            const data = await authService.login({
                email: formData.username.trim(),
                password: formData.password
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", data.name || formData.username);
            localStorage.setItem("userRole", (data.role || "USER").toUpperCase());
            if (data.email) {
                localStorage.setItem("userEmail", data.email);
            }

            navigate("/dashboard", { replace: true });

        } catch (error) {
            console.error("Error:", error);

            if (error.response) {
                setError(error.response.data.message || "Login Failed");
            } else if (error.message) {
                setError(error.message);
            } else {
                setError("Failed to fetch");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.container}>
            {/* Video Background */}
            <video
                autoPlay
                loop
                muted
                playsInline
                style={styles.video}
            >
                <source src="/856171-hd_1920_1080_30fps.mp4" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            {/* Overlay */}
            <div style={styles.overlay}></div>

            {/* Login Card with Sidebar */}
            <div style={styles.loginCard}>
                {/* Left Sidebar */}
                <div style={styles.sidebar}>
                    <div style={styles.logoContainer}>
                        <div style={styles.logoIcon}>✦</div>
                        <h1 style={styles.logoText}>Florosense ESPL</h1>
                    </div>
                    <div style={styles.welcomeText}>
                        <h2>Welcome back</h2>
                        <p>Login to your EForm account</p>
                    </div>
                </div>

                {/* Right Form */}
                <div style={styles.formPanel}>
                    <h2 style={styles.formTitle}>Login</h2>
                    <p style={styles.formSubtitle}>Enter your credentials to access your account</p>

                    {error && (
                        <div style={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Username</label>
                            <input
                                style={styles.input}
                                type="text"
                                name="username"
                                placeholder="admin"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={loading}
                            />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}>Password</label>
                            <div style={styles.passwordWrapper}>
                                <input
                                    style={styles.input}
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    placeholder="admin123"
                                    value={formData.password}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                                <button
                                    type="button"
                                    style={styles.showButton}
                                    onClick={() => setShowPassword(!showPassword)}
                                    disabled={loading}
                                >
                                    {showPassword ? "Hide" : "Show"}
                                </button>
                            </div>
                        </div>

                        <div style={styles.forgotPassword}>
                            <a href="#" style={styles.forgotLink}>Forgot your password?</a>
                        </div>

                        <button
                            style={styles.loginButton}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>

                    <p style={styles.signupPrompt}>
                        Don&apos;t have an account?{" "}
                        <Link to="/signup" style={styles.signupLink}>
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    },
    video: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: 'translate(-50%, -50%)',
        zIndex: 0
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1
    },
    loginCard: {
        position: 'relative',
        zIndex: 2,
        display: 'flex',
        width: '800px',
        maxWidth: '90%',
        maxHeight: '90vh',
        backgroundColor: 'white',
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    sidebar: {
        width: '35%',
        background: '#1a1a2e',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '40px 30px'
    },
    logoContainer: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '40px'
    },
    logoIcon: {
        color: '#4CAF50',
        fontSize: '28px',
        marginRight: '10px'
    },
    logoText: {
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold',
        letterSpacing: '4px',
        margin: 0
    },
    welcomeText: {
        color: 'white',
        textAlign: 'center'
    },
    welcomeText: {
        color: 'white',
        textAlign: 'center'
    },
    formPanel: {
        width: '65%',
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        background: 'white'
    },
    formTitle: {
        fontSize: '26px',
        fontWeight: 'bold',
        color: '#1a1a2e',
        margin: '0 0 6px 0'
    },
    formSubtitle: {
        fontSize: '14px',
        color: '#666',
        margin: '0 0 25px 0'
    },
    errorBox: {
        background: '#fee',
        color: '#c62828',
        padding: '10px 14px',
        borderRadius: '6px',
        marginBottom: '20px',
        fontSize: '14px'
    },
    inputGroup: {
        marginBottom: '18px'
    },
    label: {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#333',
        marginBottom: '5px'
    },
    input: {
        width: '100%',
        padding: '11px 14px',
        border: '1px solid #ddd',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'border 0.2s',
        outline: 'none',
        boxSizing: 'border-box',
        background: '#fafafa'
    },
    passwordWrapper: {
        position: 'relative'
    },
    showButton: {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        background: 'none',
        border: 'none',
        color: '#666',
        cursor: 'pointer',
        fontSize: '13px',
        padding: '4px 8px'
    },
    forgotPassword: {
        textAlign: 'right',
        marginBottom: '22px'
    },
    forgotLink: {
        color: '#4CAF50',
        fontSize: '13px',
        textDecoration: 'none'
    },
    loginButton: {
        width: '100%',
        padding: '13px',
        background: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '15px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'background 0.2s'
    },
    signupPrompt: {
        textAlign: 'center',
        marginTop: '22px',
        marginBottom: 0,
        fontSize: '14px',
        color: '#666'
    },
    signupLink: {
        color: '#4CAF50',
        fontWeight: '600',
        textDecoration: 'none'
    }
};

// Add focus styles (put this in your global CSS or component)
const globalStyles = `
    input:focus {
        border-color: #4CAF50 !important;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
        background: white !important;
    }

    button:hover:not(:disabled) {
        opacity: 0.9;
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .forgot-link:hover {
        text-decoration: underline !important;
    }
`;