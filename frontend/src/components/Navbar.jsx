import "./../assets/Navbar.css";
import { FaUserCircle } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Navbar() {

    const navigate = useNavigate();

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("userName");
        localStorage.removeItem("userRole");
        localStorage.removeItem("userEmail");
        localStorage.removeItem("dashboard_data");
        localStorage.removeItem("dashboard_timestamp");
        navigate("/");
    };

    return (

        <header className="navbar">

            <div className="navbar-left">

                <h2>Digital Installation & PM Visit E-Form System</h2>

            </div>

            <div className="navbar-right">

                <FaUserCircle className="user-icon"/>

                <span>Welcome Admin</span>

                <button
                    className="logout-btn"
                    onClick={logout}
                >
                    <FiLogOut/>
                    Logout
                </button>

            </div>

        </header>

    );
}