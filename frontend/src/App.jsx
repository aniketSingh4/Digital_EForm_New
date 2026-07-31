// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/NotificationContext'; //Fixing Import of NotificationContext.jsx file
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PMReportWizard from "./pages/PMReportWizard";
import ViewReports from "./components/ViewReports";
import PreVisitViewAll from "./pages/PreVisitViewAll";
import PreVisitReportForm from "./components/PreVisitReport/PreVisitReportForm";
import PreVisitReportDetail from "./components/PreVisitReport/PreVisitReportDetail";
import CalibrationReportForm from './components/calibrationReport/CalibrationReportForm';
import CalibrationViewAll from "./components/calibrationReport/CalibrationViewAll";
import ReportView from './components/calibrationReport/ReportView';
import InstallationReportForm from './components/installationReport/InstallationReportForm';
import InstallationReportList from './components/installationReport/InstallationReportList';
import InstallationReportDetail from './components/installationReport/InstallationReportDetails';
import PMReportView from "./components/pm/PMReportView";

function App() {
  return (
    <NotificationProvider>
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Preventive Maintenance Report Routes */}
        <Route path="/pm-reports" element={<PMReportWizard />} />
        <Route path="/pm-reports/new" element={<PMReportWizard />} />
        <Route path="/pm-reports/edit/:id" element={<PMReportWizard />} />
        <Route path="/pm-reports/view/:id" element={<PMReportView />} />
        <Route path="/pm-reports/view-all" element={<ViewReports />} />

        {/* Pre-Visit Report Routes - Clean version */}
        <Route path="/previsit" element={<PreVisitViewAll />} />
        <Route path="/previsit/new" element={<PreVisitReportForm />} />
        <Route path="/previsit/view-all" element={<PreVisitViewAll />} /> 
        <Route path="/previsit/edit/:id" element={<PreVisitReportForm />} />
        <Route path="/previsit/:id" element={<PreVisitReportDetail />} />

        {/* Also support /previsit-checklist (redirect to /previsit) */}
        <Route path="/previsit-checklist" element={<Navigate to="/previsit" replace />} />
        <Route path="/previsit-checklist/:id" element={<Navigate to="/previsit/:id" replace />} />

        {/* Calibration Reports Routes */}
        <Route path="/calibration-reports" element={<CalibrationViewAll />} />
        <Route path="/calibration-reports/new" element={<CalibrationReportForm />} />
        <Route path="/calibration-reports/edit/:id" element={<CalibrationReportForm />} />
        <Route path="/calibration-reports/view/:id" element={<ReportView />} />

        {/* Installation Reports Routes */}
        <Route path="/installation-reports" element={<InstallationReportList />} />
        <Route path="/installation-reports/new" element={<InstallationReportForm />} />
        <Route path="/installation-reports/edit/:id" element={<InstallationReportForm />} />
        <Route path="/installation-reports/view/:id" element={<InstallationReportDetail />} />



        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </NotificationProvider>
  );
}

export default App;