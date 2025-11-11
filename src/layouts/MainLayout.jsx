import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Footer from '../components/Footer'; // Import Footer
import './MainLayout.css';

const MainLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content-wrapper">
        <div className="main-content">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default MainLayout;
