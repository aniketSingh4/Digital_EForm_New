import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import authService from "../services/authService";
import { useNavigate } from "react-router-dom";

export default function Login() {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        if (!formData.email || !formData.password) {
            alert("Please fill all fields.");
            return;
        }

        try {

            setLoading(true);

            const data = await authService.login({
                email: formData.email,
                password: formData.password
            });

            localStorage.setItem("token", data.token);
            localStorage.setItem("userName", formData.email);

            navigate("/dashboard");

        } catch (error) {
            console.error("Error:", error);

            if (error.response) {
                console.log(error.response);
                alert(error.response.data.message || "Login Failed");
            } else {
                alert(error.message);
            }
        } finally {

            setLoading(false);

        }
    };

    return (

        <AuthLayout
            title="Welcome Back"
            subtitle="Login to continue">

            <form onSubmit={handleSubmit}>

                <input
                    className="input"
                    type="email"
                    name="email"
                    placeholder="Email Address"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <div className="password-box">

                    <input
                        className="input"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Password"
                        autoComplete="current-password"
                        value={formData.password}
                        onChange={handleChange}
                    />

                    <button
                        type="button"
                        className="show-btn"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? "Hide" : "Show"}
                    </button>

                </div>

                <button
                    className="login-btn"
                    type="submit"
                >
                    {loading ? "Logging in..." : "Login"}
                </button>

            </form>

            <p className="bottom-text">
                Don't have an account?
                <Link to="/signup"> Sign Up</Link>
            </p>

        </AuthLayout>

    );
}