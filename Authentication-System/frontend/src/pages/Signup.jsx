import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import authService from "../services/authService";

export default function Signup() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: ""
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

        if (
            !formData.name ||
            !formData.email ||
            !formData.phone ||
            !formData.password ||
            !formData.confirmPassword
        ) {
            alert("Please fill all fields.");
            return;
        }

        if (!/^[6-9]\d{9}$/.test(formData.phone)) {
            alert("Please enter a valid 10-digit mobile number.");
            return;
        }

        if (formData.password.length < 8) {
            alert("Password must be at least 8 characters.");
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert("Passwords do not match.");
            return;
        }

        try {

            setLoading(true);

            await authService.register({
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                password: formData.password
            });

            alert("Registration Successful");

            navigate("/login");

        } catch (error) {

            console.error(error);

            if (error.response) {
                alert(error.response.data.message || "Registration Failed");
            } else {
                alert("Server Error");
            }

        } finally {

            setLoading(false);

        }

    };

    return (

        <AuthLayout
            title="Create Account"
            subtitle="Register your account">

            <form onSubmit={handleSubmit}>

                <input
                    className="input"
                    type="text"
                    name="name"
                    placeholder="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                />

                <input
                    className="input"
                    type="email"
                    name="email"
                    placeholder="Email"
                    value={formData.email}
                    onChange={handleChange}
                />

                <input
                    className="input"
                    type="tel"
                    name="phone"
                    placeholder="9876543210"
                    pattern="[6-9]{1}[0-9]{9}"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                />

                <div className="password-box">

                    <input
                        className="input"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        minLength="8"
                        required
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

                <input
                    className="input"
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                />

                <button
                    className="login-btn"
                    type="submit"
                >
                    {loading ? "Creating Account..." : "Sign Up"}
                </button>

            </form>

            <p className="bottom-text">
                Already have an account?
                <Link to="/login"> Login</Link>
            </p>

        </AuthLayout>

    );
}