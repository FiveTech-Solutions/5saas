import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthorization } from '../hooks/useAuthorization';
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
  AdminPanelSettings,
  Gavel,
  Assessment,
  ExpandLess,
  ExpandMore,
} from '@mui/icons-material';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { 
    getUserProfile, 
    getAvailableRoutes,
    canManageUsers,
    canAudit,
    canEmitNFSe,
    canManageParameters,
    canManageDebt
  } = useAuthorization();
  const navigate = useNavigate();
  
  // State para controlar qual seção está aberta. null se nenhuma estiver aberta.
  const [expandedSection, setExpandedSection] = useState(null);
  
  const userProfile = getUserProfile();
  
  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

  // Função para toggle do colapso de seções
  const toggleSection = (sectionName) => {
    setExpandedSection(prev => (prev === sectionName ? null : sectionName));
  };

  // Definição dos módulos com base em permissões
  const getNavLinks = () => {
    const links = {
      'NFS-e': [],
      'Serviços Tomados': [],
      'DES-IF': [],
      'Administração': [],
      'Auditoria': [],
      'Dívida Ativa': [],
      'Configurações': [
        { to: '/clientes', text: 'Clientes', icon: <TrendingUp /> },
        { to: '/empresa/configuracoes', text: 'Empresa', icon: <Business /> },
        { to: '/settings', text: 'Minha Conta', icon: <Settings /> },
      ],
    };

    // Dashboard sempre disponível
    links['NFS-e'].push({ to: '/', text: 'Dashboard', icon: <Description /> });

    // NFS-e para admin e operador
    if (canEmitNFSe()) {
      links['NFS-e'].push(
        { to: '/nfse', text: 'Minhas NFS-e', icon: <ListAlt /> },
        { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddCircle /> }
      );
    }

    // Serviços tomados para admin e operador
    if (canEmitNFSe()) {
      links['Serviços Tomados'].push(
        { to: '/servicos-tomados', text: 'Lançamentos', icon: <Build /> },
        { to: '/servicos', text: 'Gerenciar Serviços', icon: <ListAlt /> } // New link
      );
    }

    // DES-IF para admin e operador
    if (canEmitNFSe()) {
      links['DES-IF'].push(
        { to: '/des-if', text: 'Declaração', icon: <AccountBalance /> }
      );
    }

    // Administração apenas para admin
    if (canManageUsers()) {
      links['Administração'].push(
        { to: '/admin/users', text: 'Usuários', icon: <People /> }
      );
    }
    
    if (canManageParameters()) {
      links['Administração'].push(
        { to: '/admin/parametros', text: 'Parâmetros', icon: <AdminPanelSettings /> }
      );
    }

    // Auditoria para admin e auditor
    if (canAudit()) {
      links['Auditoria'].push(
        { to: '/auditoria/simples-nacional', text: 'Simples Nacional', icon: <Assessment /> },
        { to: '/auditoria/autos-infracao', text: 'Autos de Infração', icon: <Gavel /> }
      );
    }

    // Dívida ativa para admin e auditor
    if (canManageDebt()) {
      links['Dívida Ativa'].push(
        { to: '/divida-ativa', text: 'Controle', icon: <AttachMoney /> }
      );
    }

    // Filtrar módulos vazios
    return Object.fromEntries(
      Object.entries(links).filter(([_, moduleLinks]) => moduleLinks.length > 0)
    );
  };

  const navLinks = getNavLinks();

  const renderNavLinks = () => {
    return Object.entries(navLinks).map(([module, links]) => {
      const isOpen = expandedSection === module;
      
      return (
        <div key={module} className="sidebar-module">
          <div 
            className="sidebar-module-header clickable"
            onClick={() => toggleSection(module)}
          >
            <h3 className="sidebar-module-title">{module}</h3>
            <div className="sidebar-toggle-icon">
              {isOpen ? <ExpandLess /> : <ExpandMore />}
            </div>
          </div>
          <div className={`sidebar-module-links ${isOpen ? 'expanded' : 'collapsed'}`}>
            {links.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.to === '/nfse'} className="sidebar-link">
                {link.icon}
                <span>{link.text}</span>
              </NavLink>
            ))}
          </div>
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
          <div className="user-info">
            <span className="user-email">{user?.email || 'Usuário'}</span>
            {userProfile && (
              <span className={`user-role role-${user?.role}`}>
                {userProfile.name}
              </span>
            )}
          </div>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;


