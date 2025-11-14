import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
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
    canManageUsers,
    canAudit,
    canEmitNFSe,
    canManageParameters,
    canManageDebt
  } = useAuthorization();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavLinks = useCallback(() => {
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

    links['NFS-e'].push({ to: '/', text: 'Dashboard', icon: <Description /> });

    if (canEmitNFSe()) {
      links['NFS-e'].push(
        { to: '/nfse', text: 'Minhas NFS-e', icon: <ListAlt /> },
        { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddCircle /> }
      );
    }

    if (canEmitNFSe()) {
      links['Serviços Tomados'].push(
        { to: '/servicos-tomados', text: 'Lançamentos', icon: <Build /> },
        { to: '/servicos', text: 'Gerenciar Serviços', icon: <ListAlt /> }
      );
    }

    if (canEmitNFSe()) {
      links['DES-IF'].push({ to: '/des-if', text: 'Declaração', icon: <AccountBalance /> });
    }

    if (canManageUsers()) {
      links['Administração'].push({ to: '/admin/users', text: 'Usuários', icon: <People /> });
    }
    
    if (canManageParameters()) {
      links['Administração'].push({ to: '/admin/parametros', text: 'Parâmetros', icon: <AdminPanelSettings /> });
    }

    if (canAudit()) {
      links['Auditoria'].push(
        { to: '/auditoria/simples-nacional', text: 'Simples Nacional', icon: <Assessment /> },
        { to: '/auditoria/autos-infracao', text: 'Autos de Infração', icon: <Gavel /> }
      );
    }

    if (canManageDebt()) {
      links['Dívida Ativa'].push({ to: '/divida-ativa', text: 'Controle', icon: <AttachMoney /> });
    }

    return Object.fromEntries(
      Object.entries(links).filter(([_, moduleLinks]) => moduleLinks.length > 0)
    );
  }, [canManageUsers, canAudit, canEmitNFSe, canManageParameters, canManageDebt]);

  const navLinks = getNavLinks();

  const getModuleForPath = useCallback((path) => {
    let bestMatch = null;
    let bestMatchModule = null;

    for (const [module, links] of Object.entries(navLinks)) {
      for (const link of links) {
        if (path.startsWith(link.to)) {
          if (!bestMatch || link.to.length > bestMatch.length) {
            bestMatch = link.to;
            bestMatchModule = module;
          }
        }
      }
    }
    return bestMatchModule;
  }, [navLinks]);

  const moduleForCurrentPath = getModuleForPath(location.pathname);
  const [overrideSection, setOverrideSection] = useState(null);

  useEffect(() => {
    setOverrideSection(null);
  }, [location.pathname]);

  let expandedSection;
  if (overrideSection === false) {
    expandedSection = null;
  } else if (overrideSection) {
    expandedSection = overrideSection;
  } else {
    expandedSection = moduleForCurrentPath;
  }

  const toggleSection = (sectionName) => {
    setOverrideSection(() => {
      if (expandedSection === sectionName) {
        return false;
      }
      return sectionName;
    });
  };

  const userProfile = getUserProfile();
  
  const handleLogout = async () => {
    await logout();
    navigate('/auth');
  };

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
              <NavLink key={link.to} to={link.to} end className="sidebar-link">
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


