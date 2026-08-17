// src/App.js
import { Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { NotificationProvider } from './context/notificationContext';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import PMReportWizard from "./pages/PMReportWizard";
import ViewReports from "./components/ViewReports";
import PreVisitViewAll from "./pages/PreVisitViewAll";
import PreVisitReportForm from "./components/preVisitReport/PreVisitReportForm";
import PreVisitReportDetail from "./components/preVisitReport/PreVisitReportDetail";
import CalibrationReportForm from './components/calibrationReport/CalibrationReportForm';
import CalibrationViewAll from "./components/calibrationReport/CalibrationViewAll";
import ReportView from './components/calibrationReport/ReportView';
import InstallationReportForm from './components/installationReport/InstallationReportForm';
import InstallationReportList from './components/installationReport/InstallationReportList';
import InstallationReportDetail from './components/installationReport/InstallationReportDetails';
import PMReportView from "./components/pm/PMReportView";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import useIdleTimeout from "./hooks/useIdleTimeout";

function App() {
  useIdleTimeout();

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
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        {/* Preventive Maintenance Report Routes */}
        <Route path="/pm-reports" element={
          <ProtectedRoute>
            <PMReportWizard />
          </ProtectedRoute>
        } />
        <Route path="/pm-reports/new" element={
          <ProtectedRoute>
            <PMReportWizard />
          </ProtectedRoute>
        } />
        <Route path="/pm-reports/edit/:id" element={
          <ProtectedRoute>
            <AdminRoute redirectTo="/pm-reports/view-all">
              <PMReportWizard />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/pm-reports/view/:id" element={
          <ProtectedRoute>
            <PMReportView />
          </ProtectedRoute>
        } />
        <Route path="/pm-reports/view-all" element={
          <ProtectedRoute>
            <ViewReports />
          </ProtectedRoute>
        } />

        {/* Pre-Visit Report Routes */}
        <Route path="/previsit" element={
          <ProtectedRoute>
            <PreVisitViewAll />
          </ProtectedRoute>
        } />
        <Route path="/previsit/new" element={
          <ProtectedRoute>
            <PreVisitReportForm />
          </ProtectedRoute>
        } />
        <Route path="/previsit/view-all" element={
          <ProtectedRoute>
            <PreVisitViewAll />
          </ProtectedRoute>
        } />
        <Route path="/previsit/edit/:id" element={
          <ProtectedRoute>
            <AdminRoute redirectTo="/previsit/view-all">
              <PreVisitReportForm />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/previsit/:id" element={
          <ProtectedRoute>
            <PreVisitReportDetail />
          </ProtectedRoute>
        } />

        {/* Pre-visit checklist redirects */}
        <Route path="/previsit-checklist" element={<Navigate to="/previsit" replace />} />
        <Route path="/previsit-checklist/:id" element={<Navigate to="/previsit/:id" replace />} />

        {/* Calibration Reports Routes */}
        <Route path="/calibration-reports" element={
          <ProtectedRoute>
            <CalibrationViewAll />
          </ProtectedRoute>
        } />
        <Route path="/calibration-reports/new" element={
          <ProtectedRoute>
            <CalibrationReportForm />
          </ProtectedRoute>
        } />
        <Route path="/calibration-reports/edit/:id" element={
          <ProtectedRoute>
            <AdminRoute redirectTo="/calibration-reports">
              <CalibrationReportForm />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/calibration-reports/view/:id" element={
          <ProtectedRoute>
            <ReportView />
          </ProtectedRoute>
        } />

        {/* Installation Reports Routes */}
        <Route path="/installation-reports" element={
          <ProtectedRoute>
            <InstallationReportList />
          </ProtectedRoute>
        } />
        <Route path="/installation-reports/new" element={
          <ProtectedRoute>
            <InstallationReportForm />
          </ProtectedRoute>
        } />
        <Route path="/installation-reports/edit/:id" element={
          <ProtectedRoute>
            <AdminRoute redirectTo="/installation-reports">
              <InstallationReportForm />
            </AdminRoute>
          </ProtectedRoute>
        } />
        <Route path="/installation-reports/view/:id" element={
          <ProtectedRoute>
            <InstallationReportDetail />
          </ProtectedRoute>
        } />


        {/* Catch all - redirect to dashboard */}
        <Route path="*" element={
          <ProtectedRoute>
            <Navigate to="/dashboard" />
          </ProtectedRoute>
        } />
      </Routes>
    </NotificationProvider>
  );
}

export default App;
