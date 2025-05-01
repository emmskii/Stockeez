import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './sidebar.css';

import stockeezLogo from '../assets/stockeez-icon.png';
import dashboardIcon from '../assets/dashboard-icon.png';
import inventoryIcon from '../assets/inventory-icon.png';
import salesIcon from '../assets/sales-icon.png';
import aiIcon from '../assets/ai-icon.png';
import logoutIcon from '../assets/logout-icon.png'; // ✅ IMPORT LOGOUT ICON

const Sidebar = () => {
  const navigate = useNavigate(); // ✅ ADD navigate hook

  const handleLogout = () => {
    // You can also clear local storage/session if needed here
    navigate('/');
  };

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <img src={stockeezLogo} alt="Stockeez Logo" />
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/dashboard" activeclassname="active" className="nav-item">
          <img src={dashboardIcon} alt="Dashboard" />
        </NavLink>
        <NavLink to="/inventory" activeclassname="active" className="nav-item">
          <img src={inventoryIcon} alt="Inventory" />
        </NavLink>
        <NavLink to="/sales" activeclassname="active" className="nav-item">
          <img src={salesIcon} alt="Sales" />
        </NavLink>
        <NavLink to="/ai" activeclassname="active" className="nav-item">
          <img src={aiIcon} alt="AI" />
        </NavLink>
      </nav>

      {/* ✅ LOGOUT BUTTON AT THE BOTTOM */}
      <div className="sidebar-logout" onClick={handleLogout}>
        <img src={logoutIcon} alt="Logout" />
      </div>
    </div>
  );
};

export default Sidebar;
