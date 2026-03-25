import React from 'react';
import { NavLink } from 'react-router-dom';
import { HiOutlineViewGrid, HiOutlineUsers, HiOutlineClipboardCheck } from 'react-icons/hi';

const Sidebar = () => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>HRMS Lite</h1>
        <p>Human Resource Management</p>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineViewGrid />
          Dashboard
        </NavLink>
        <NavLink to="/employees" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineUsers />
          Employees
        </NavLink>
        <NavLink to="/attendance" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
          <HiOutlineClipboardCheck />
          Attendance
        </NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
