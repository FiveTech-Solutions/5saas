import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';

// Simple icons as placeholders
const HomeIcon = () => <span>📄</span>;
const AddIcon = () => <span>➕</span>;
const CompanyIcon = () => <span>🏢</span>;
const UsersIcon = () => <span>👥</span>;
const SettingsIcon = () => <span>⚙️</span>;
const CustomersIcon = () => <span>📈</span>;


const Sidebar = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  
    const handleLogout = async () => {
    await logout();
    navigate('/auth'); // Redirect to auth page after logout
  };

  const navLinks = [
    { to: '/', text: 'Minhas NFS-e', icon: <HomeIcon /> },
    { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddIcon /> },
    { to: '/clientes', text: 'Clientes', icon: <CustomersIcon /> },
    { to: '/empresa/configuracoes', text: 'Empresa', icon: <CompanyIcon /> },
  ];

  // Add admin link only if user has admin role
  if (profile?.role === 'admin') {
    navLinks.push({ to: '/admin/usuarios', text: 'Usuários', icon: <UsersIcon /> });
  }
  
  navLinks.push({ to: '/settings', text: 'Configurações', icon: <SettingsIcon /> });


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">5SaaS</h1>
      </div>
      <nav className="sidebar-nav">
        {navLinks.map((link) => (
          <NavLink key={link.to} to={link.to} className="sidebar-link">
            {link.icon}
            <span>{link.text}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="user-profile">
          <span>{profile?.email || 'Usuário'}</span>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
