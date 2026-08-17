import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import authService from "../services/authService";
import { env } from "../config/env";

export default function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
        role: "USER"
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

        if (
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            setError("Please fill all fields.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            setError("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (formData.password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);
            setError("");

            await authService.register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password,
                role: formData.role
            });

            alert("Registration Successful");

            navigate("/login");

        } catch (error) {

            console.error(error);

            if (error.response) {
                setError(error.response.data?.message || "Registration Failed");
            } else if (error.code === "ECONNABORTED") {
                setError(`Request timed out. Cannot reach ${env.AUTH_SERVICE_URL}`);
            } else {
                setError(`Cannot reach ${env.AUTH_SERVICE_URL}. Check that the APIs are running.`);
            }

        } finally {

            setLoading(false);

        }

    };

    return (
        <div style={styles.container}>
            <style>{responsiveStyles}</style>

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

            {/* Signup Card with Sidebar */}
            <div className="signup-card" style={styles.signupCard}>
                {/* Left Sidebar */}
                <div className="signup-sidebar" style={styles.sidebar}>
                    <div style={styles.logoContainer}>
                        <div style={styles.logoIcon}>✦</div>
                        <h1 style={styles.logoText}>Florosense ESPL</h1>
                    </div>
                    <div style={styles.welcomeText}>
                        <h2 style={styles.welcomeHeading}>Create account</h2>
                        <p style={styles.welcomeSubtext}>Register to start using EForm</p>
                    </div>
                </div>

                {/* Right Form */}
                <div className="signup-form-panel" style={styles.formPanel}>
                    <h2 style={styles.formTitle}>Sign Up</h2>
                    <p style={styles.formSubtitle}>Enter your details to create your account</p>

                    {error && (
                        <div style={styles.errorBox}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="signup-form-row" style={styles.formRow}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Full Name</label>
                                <input
                                    className="signup-input"
                                    style={styles.input}
                                    type="text"
                                    name="name"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Email</label>
                                <input
                                    className="signup-input"
                                    style={styles.input}
                                    type="email"
                                    name="email"
                                    placeholder="you@example.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div className="signup-form-row" style={styles.formRow}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Phone</label>
                                <input
                                    className="signup-input"
                                    style={styles.input}
                                    type="tel"
                                    name="phone"
                                    placeholder="9876543210"
                                    pattern="[6-9]{1}[0-9]{9}"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={loading}
                                />
                            </div>

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Account Type</label>
                                <select
                                    className="signup-input"
                                    style={styles.select}
                                    name="role"
                                    value={formData.role}
                                    onChange={handleChange}
                                    disabled={loading}
                                    aria-label="Account type"
                                >
                                    <option value="USER">User</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                        </div>

                        <div className="signup-form-row" style={styles.formRow}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Password</label>
                                <div style={styles.passwordWrapper}>
                                    <input
                                        className="signup-input"
                                        style={{ ...styles.input, paddingRight: "56px" }}
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        placeholder="At least 8 characters"
                                        minLength="8"
                                        required
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

                            <div style={styles.inputGroup}>
                                <label style={styles.label}>Confirm Password</label>
                                <div style={styles.passwordWrapper}>
                                    <input
                                        className="signup-input"
                                        style={{ ...styles.input, paddingRight: "56px" }}
                                        type={showPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        placeholder="Re-enter password"
                                        value={formData.confirmPassword}
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
                        </div>

                        <button
                            className="signup-submit"
                            style={styles.signupButton}
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? "Creating Account..." : "Sign Up"}
                        </button>
                    </form>

                    <p style={styles.loginPrompt}>
                        Already have an account?{" "}
                        <Link to="/login" style={styles.loginLink}>
                            Login
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

const styles = {
    container: {
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
    },
    video: {
        position: "absolute",
        top: "50%",
        left: "50%",
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: "translate(-50%, -50%)",
        zIndex: 0
    },
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.4)",
        zIndex: 1
    },
    signupCard: {
        position: "relative",
        zIndex: 2,
        display: "flex",
        width: "960px",
        maxWidth: "94%",
        minHeight: "540px",
        maxHeight: "90vh",
        backgroundColor: "white",
        borderRadius: "16px",
        overflow: "hidden",
        boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
    },
    sidebar: {
        width: "300px",
        flexShrink: 0,
        background: "#1a1a2e",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "48px 32px"
    },
    logoContainer: {
        display: "flex",
        alignItems: "center",
        marginBottom: "48px"
    },
    logoIcon: {
        color: "#4CAF50",
        fontSize: "28px",
        marginRight: "10px"
    },
    logoText: {
        color: "white",
        fontSize: "24px",
        fontWeight: "bold",
        letterSpacing: "4px",
        margin: 0
    },
    welcomeText: {
        color: "white",
        textAlign: "center"
    },
    welcomeHeading: {
        margin: "0 0 8px 0",
        fontSize: "22px",
        fontWeight: 600
    },
    welcomeSubtext: {
        margin: 0,
        fontSize: "14px",
        opacity: 0.85,
        lineHeight: 1.5
    },
    formPanel: {
        flex: 1,
        padding: "40px 44px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        background: "white",
        overflowY: "auto"
    },
    formTitle: {
        fontSize: "26px",
        fontWeight: "bold",
        color: "#1a1a2e",
        margin: "0 0 6px 0"
    },
    formSubtitle: {
        fontSize: "14px",
        color: "#666",
        margin: "0 0 28px 0"
    },
    errorBox: {
        background: "#fee",
        color: "#c62828",
        padding: "10px 14px",
        borderRadius: "6px",
        marginBottom: "20px",
        fontSize: "14px"
    },
    formRow: {
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0 18px"
    },
    inputGroup: {
        marginBottom: "18px"
    },
    label: {
        display: "block",
        fontSize: "13px",
        fontWeight: "600",
        color: "#333",
        marginBottom: "6px"
    },
    input: {
        width: "100%",
        height: "44px",
        padding: "11px 14px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        transition: "border 0.2s",
        outline: "none",
        boxSizing: "border-box",
        background: "#fafafa"
    },
    select: {
        width: "100%",
        height: "44px",
        padding: "11px 14px",
        border: "1px solid #ddd",
        borderRadius: "6px",
        fontSize: "14px",
        transition: "border 0.2s",
        outline: "none",
        boxSizing: "border-box",
        background: "#fafafa",
        cursor: "pointer"
    },
    passwordWrapper: {
        position: "relative"
    },
    showButton: {
        position: "absolute",
        right: "12px",
        top: "50%",
        transform: "translateY(-50%)",
        background: "none",
        border: "none",
        color: "#666",
        cursor: "pointer",
        fontSize: "13px",
        padding: "4px 8px"
    },
    signupButton: {
        width: "100%",
        padding: "13px",
        background: "#4CAF50",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "15px",
        fontWeight: "600",
        cursor: "pointer",
        transition: "background 0.2s",
        marginTop: "8px"
    },
    loginPrompt: {
        textAlign: "center",
        marginTop: "22px",
        marginBottom: 0,
        fontSize: "14px",
        color: "#666"
    },
    loginLink: {
        color: "#4CAF50",
        fontWeight: "600",
        textDecoration: "none"
    }
};

const responsiveStyles = `
    .signup-input:focus {
        border-color: #4CAF50 !important;
        box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1) !important;
        background: white !important;
    }

    .signup-submit:hover:not(:disabled) {
        opacity: 0.9;
    }

    .signup-submit:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    @media (max-width: 768px) {
        .signup-card {
            flex-direction: column !important;
            width: 94% !important;
            min-height: auto !important;
            max-height: 92vh !important;
        }

        .signup-sidebar {
            width: 100% !important;
            padding: 24px 20px !important;
        }

        .signup-form-panel {
            width: 100% !important;
            padding: 28px 24px !important;
        }

        .signup-form-row {
            grid-template-columns: 1fr !important;
        }
    }
`;
