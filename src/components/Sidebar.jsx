import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Sidebar.css';
import {
  Description,
  AddCircle,
  Business,
  People,
  Settings,
  TrendingUp,
  Build,
  AccountBalance,
  Search,
  AttachMoney,
  ListAlt,
} from '@mui/icons-material';

const Sidebar = () => {
  const { logout, profile } = useAuth();
  const navigate = useNavigate();
  
    const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  const navLinks = {
    'NFS-e': [
      { to: '/', text: 'Dashboard', icon: <Description /> },
      { to: '/nfse', text: 'Minhas NFS-e', icon: <ListAlt /> },
      { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddCircle /> },
    ],
    'Serviços Tomados': [
      { to: '/servicos-tomados', text: 'Lançamentos', icon: <Build /> },
    ],
    'DES-IF': [
      { to: '/des-if', text: 'Declaração', icon: <AccountBalance /> },
    ],
    'Administração': [
      { to: '/admin/usuarios', text: 'Usuários', icon: <People />, role: 'admin' },
      { to: '/admin/parametros', text: 'Parâmetros', icon: <Settings />, role: 'admin' },
    ],
    'Auditoria': [
      { to: '/auditoria/simples-nacional', text: 'Simples Nacional', icon: <Search />, role: 'auditor' },
      { to: '/auditoria/autos-infracao', text: 'Autos de Infração', icon: <Search />, role: 'auditor' },
    ],
    'Dívida Ativa': [
      { to: '/divida-ativa', text: 'Controle', icon: <AttachMoney />, role: 'auditor' },
    ],
    'Configurações': [
      { to: '/clientes', text: 'Clientes', icon: <TrendingUp /> },
      { to: '/empresa/configuracoes', text: 'Empresa', icon: <Business /> },
      { to: '/settings', text: 'Minha Conta', icon: <Settings /> },
    ],
  };

  const renderNavLinks = () => {
    return Object.entries(navLinks).map(([module, links]) => {
      const filteredLinks = links.filter(link => !link.role || link.role === profile?.role);
      if (filteredLinks.length === 0) {
        return null;
      }
      return (
        <div key={module} className="sidebar-module">
          <h3 className="sidebar-module-title">{module}</h3>
          {filteredLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className="sidebar-link">
              {link.icon}
              <span>{link.text}</span>
            </NavLink>
          ))}
        </div>
      );
    });
  };


  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="sidebar-logo">Five-SaaS</h1>
      </div>
      <nav className="sidebar-nav">
        {renderNavLinks()}
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


