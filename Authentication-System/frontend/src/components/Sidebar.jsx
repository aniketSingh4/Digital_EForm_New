import "./../assets/Sidebar.css";

import {
    FaHome,
    FaClipboardCheck,
    FaTools,
    FaCogs,
    FaWrench,
    FaChartBar,
    FaCog,
    FaSignOutAlt
} from "react-icons/fa";

import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {

    const navigate = useNavigate();

    const logout = () => {

        localStorage.removeItem("token");

        navigate("/");
    };

    return (

        <aside className="sidebar">

            <div className="logo">

                <h2>FloroSense</h2>

            </div>

            <nav>

                <Link to="/dashboard">
                    <FaHome /> Dashboard
                </Link>

                <Link to="/pm-report">
                    <FaTools /> Preventive Maintenance
                </Link>

                <Link to="/previsit">
                    <FaClipboardCheck /> Pre Visit Report
                </Link>

                <Link to="/calibration-reports" className="nav-link">
                    <FaClipboardList className="mr-2" />
                    Calibration Reports
                </Link>

                <Link to="/installation">
                    <FaWrench /> Installation & Commissioning
                </Link>

                <Link to="/reports">
                    <FaChartBar /> Reports
                </Link>

                <Link to="/settings">
                    <FaCog /> Settings
                </Link>

            </nav>

            <button
                className="sidebar-logout"
                onClick={logout}
            >
                <FaSignOutAlt />
                Logout
            </button>

        </aside>

    );
}