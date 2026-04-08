import React, { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineViewGrid, HiOutlineUsers, HiOutlineClipboardCheck,
  HiOutlineCalendar, HiOutlineOfficeBuilding, HiOutlineCash,
  HiOutlineChartBar, HiOutlineLogout, HiOutlineUserCircle,
  HiOutlineAcademicCap, HiOutlineDocumentText,
  HiOutlineChevronDown, HiOutlineChevronRight,
  HiOutlineClipboardList, HiOutlineViewList, HiOutlineGift,
  HiOutlineCog,
} from 'react-icons/hi';
import { useAuth } from '../hooks/useAuth';
import { authStore } from '../store/authStore';
import { logout } from '../services/api';

const ALL_ROLES  = ['super_admin', 'hr_admin', 'hr_manager', 'team_manager', 'employee'];
const HR_ROLES   = ['super_admin', 'hr_admin', 'hr_manager'];
const HR_ADMIN_ROLES = ['super_admin', 'hr_admin'];

const FLAT_ITEMS = [
  { path: '/',             label: 'Dashboard',    icon: <HiOutlineViewGrid />,       roles: ALL_ROLES,      end: true },
  { path: '/my-profile',  label: 'My Profile',   icon: <HiOutlineUserCircle />,     roles: ALL_ROLES },
  { path: '/employees',   label: 'Employees',    icon: <HiOutlineUsers />,          roles: HR_ROLES },
  { path: '/attendance',  label: 'Attendance',   icon: <HiOutlineClipboardCheck />, roles: HR_ROLES },
  { path: '/onboarding',  label: 'Onboarding',   icon: <HiOutlineAcademicCap />,    roles: HR_ROLES },
  { path: '/documents',   label: 'Documents',    icon: <HiOutlineDocumentText />,   roles: ALL_ROLES },
  { path: '/departments', label: 'Departments',  icon: <HiOutlineOfficeBuilding />, roles: HR_ADMIN_ROLES },
  { path: '/payroll',     label: 'Payroll',      icon: <HiOutlineCash />,           roles: HR_ADMIN_ROLES },
  { path: '/reports',     label: 'Reports',      icon: <HiOutlineChartBar />,       roles: HR_ROLES },
];

const LEAVE_ITEMS = [
  { path: '/leave',                  label: 'Apply Leave',      icon: <HiOutlineClipboardList />, roles: ALL_ROLES },
  { path: '/leave/balances',         label: 'Leave Balances',   icon: <HiOutlineViewList />,      roles: ALL_ROLES },
  { path: '/leave/calendar',         label: 'Leave Calendar',   icon: <HiOutlineCalendar />,      roles: ALL_ROLES },
  { path: '/leave/holiday-calendar', label: 'Holiday Calendar', icon: <HiOutlineGift />,          roles: ALL_ROLES },
  { path: '/leave/admin',            label: 'Leave Admin',      icon: <HiOutlineCog />,           roles: HR_ADMIN_ROLES },
];

const ROLE_LABELS = {
  super_admin: 'Super Admin', hr_admin: 'HR Admin',
  hr_manager: 'HR Manager',  team_manager: 'Team Manager', employee: 'Employee',
};

const Sidebar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const leaveActive = location.pathname.startsWith('/leave');
  const [leaveOpen, setLeaveOpen] = useState(leaveActive);

  const handleLogout = async () => {
    try { await logout(); } catch { /* ignore */ }
    authStore.clearAuth();
    localStorage.removeItem('refresh_token');
    navigate('/login');
  };

  const visibleFlat = FLAT_ITEMS.filter((item) => !user || item.roles.includes(user.role));
  const visibleLeave = LEAVE_ITEMS.filter((item) => !user || item.roles.includes(user.role));

  // Insert Leave group after attendance (index 3 in flat) or at end
  const beforeLeave = visibleFlat.filter((item) =>
    ['/', '/my-profile', '/employees', '/attendance'].includes(item.path)
  );
  const afterLeave = visibleFlat.filter((item) =>
    !['/','  /my-profile', '/employees', '/attendance'].includes(item.path) &&
    !['/', '/my-profile', '/employees', '/attendance'].includes(item.path)
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>HRMS</h1>
        <p>Human Resource Management</p>
      </div>

      {user && (
        <div className="sidebar-user">
          <div className="sidebar-user-name">{user.full_name || user.email}</div>
          <div className="sidebar-user-role">{ROLE_LABELS[user.role] || user.role}</div>
        </div>
      )}

      <nav className="sidebar-nav">
        {beforeLeave.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {/* Collapsible Leave Group */}
        {visibleLeave.length > 0 && (
          <div className="nav-group">
            <button
              className={`nav-group-toggle ${leaveActive ? 'active' : ''}`}
              onClick={() => setLeaveOpen((o) => !o)}
            >
              <span className="nav-group-icon"><HiOutlineCalendar /></span>
              <span className="nav-group-label">Leave</span>
              <span className="nav-group-chevron">
                {leaveOpen ? <HiOutlineChevronDown /> : <HiOutlineChevronRight />}
              </span>
            </button>
            {leaveOpen && (
              <div className="nav-group-items">
                {visibleLeave.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end
                    className={({ isActive }) => `nav-link nav-sub-link ${isActive ? 'active' : ''}`}
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        )}

        {afterLeave.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="nav-link logout-btn" onClick={handleLogout}>
          <HiOutlineLogout />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
