import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.css';

import ProtectedRoute from './guards/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { useAuth } from './hooks/useAuth';

import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import LeaveBalances from './pages/LeaveBalances';
import LeaveCalendar from './pages/LeaveCalendar';
import HolidayCalendar from './pages/HolidayCalendar';
import Departments from './pages/Departments';
import Payroll from './pages/Payroll';
import Reports from './pages/Reports';
import MyProfile from './pages/MyProfile';
import Onboarding from './pages/Onboarding';
import Documents from './pages/Documents';
import LeaveAdmin from './pages/LeaveAdmin';

const HR_ROLES = ['super_admin', 'hr_admin', 'hr_manager'];
const HR_ADMIN_ROLES = ['super_admin', 'hr_admin'];

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
          <Route path="/employees" element={<ProtectedRoute roles={HR_ROLES}><Employees /></ProtectedRoute>} />
          <Route path="/attendance" element={<ProtectedRoute roles={HR_ROLES}><Attendance /></ProtectedRoute>} />
          <Route path="/leave" element={<ProtectedRoute><Leave /></ProtectedRoute>} />
          <Route path="/leave/balances" element={<ProtectedRoute><LeaveBalances /></ProtectedRoute>} />
          <Route path="/leave/calendar" element={<ProtectedRoute><LeaveCalendar /></ProtectedRoute>} />
          <Route path="/leave/holiday-calendar" element={<ProtectedRoute><HolidayCalendar /></ProtectedRoute>} />
          <Route path="/departments" element={<ProtectedRoute roles={HR_ADMIN_ROLES}><Departments /></ProtectedRoute>} />
          <Route path="/payroll" element={<ProtectedRoute roles={HR_ADMIN_ROLES}><Payroll /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute roles={HR_ROLES}><Reports /></ProtectedRoute>} />
          <Route path="/onboarding" element={<ProtectedRoute roles={HR_ROLES}><Onboarding /></ProtectedRoute>} />
          <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
          <Route path="/leave/admin" element={<ProtectedRoute roles={HR_ADMIN_ROLES}><LeaveAdmin /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const { accessToken } = useAuth();

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={accessToken ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        pauseOnHover
      />
    </Router>
  );
}

export default App;
