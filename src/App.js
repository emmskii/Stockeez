  import React from 'react';
  import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
  import Login from './Pages/Login';
  import Dashboard from './Pages/Dashboard/Dashboard';
  import Inventory from './Pages/Inventory Management/Inventory';
  import Ai from './Pages/AI/Ai';
  import Sidebar from './components/Sidebar';
  import Sales from './Pages/Sales/Sales'; // ✅ ADD THIS LINE

  // This layout will wrap pages where the sidebar should be visible.
  const MainLayout = () => {
    return (
      <div style={{ display: 'flex' }}>
        <Sidebar />
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    );
  };

  function App() {
    return (
      <Router>
        <Routes>
          {/* Login page without sidebar */}
          <Route path="/" element={<Login />} />

          {/* Routes with sidebar for authenticated pages */}
          <Route element={<MainLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/ai" element={<Ai />} />
            <Route path="/sales" element={<Sales />} /> {/* ✅ ADD THIS LINE */}
          </Route>
        </Routes>
      </Router>
    );
  }

  export default App;
