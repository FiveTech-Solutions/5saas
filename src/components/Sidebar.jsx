import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthorization } from '../hooks/useAuthorization';
import './Sidebar.css';
import {
  Dashboard,
  Description,
  AddCircle,
  Business,
  People,
  Settings,
  Build,
  ListAlt,
  AdminPanelSettings,
  ExpandLess,
  ExpandMore,
  Receipt,
  Contactless,
  AutoAwesome
} from '@mui/icons-material';

const Sidebar = () => {
  const { logout, user } = useAuth();
  const { hasFeature, isAdmin } = useAuthorization();
  const navigate = useNavigate();
  const location = useLocation();

  const getNavLinks = useCallback(() => {
    const modules = {
      'Geral': [
        { to: '/', text: 'Dashboard', icon: <Dashboard /> },
      ],
      'NFS-e': [],
      'NF-e': [],
      'NFC-e': [],
      'Ferramentas IA': [],
      'Administração': [],
      'Configurações': [
        { to: '/clientes', text: 'Clientes', icon: <People /> },
        { to: '/empresa/configuracoes', text: 'Empresa', icon: <Business /> },
        { to: '/settings', text: 'Minha Conta', icon: <Settings /> },
      ],
    };

    if (hasFeature('NFSE')) {
      modules['NFS-e'].push(
        { to: '/nfse', text: 'Minhas NFS-e', icon: <Description /> },
        { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddCircle /> },
        { to: '/servicos-tomados', text: 'Serviços Tomados', icon: <Build /> },
        { to: '/servicos', text: 'Gerenciar Serviços', icon: <ListAlt /> }
      );
    }
    
    if (hasFeature('NFE')) {
      modules['NF-e'].push(
        { to: '/nfe', text: 'Minhas NF-e', icon: <Receipt /> },
        { to: '/nfe/new', text: 'Nova NF-e', icon: <AddCircle /> }
      );
    }
    
    if (hasFeature('NFCE')) {
      modules['NFC-e'].push(
        { to: '/nfce', text: 'Minhas NFC-e', icon: <Contactless /> },
        { to: '/nfce/new', text: 'Nova NFC-e', icon: <AddCircle /> }
      );
    }
    
    if (hasFeature('AI_TOOLS')) {
      modules['Ferramentas IA'].push(
        { to: '/ai/insights', text: 'Análise Inteligente', icon: <AutoAwesome /> }
      );
    }

    if (isAdmin()) {
      modules['Administração'].push(
        { to: '/admin/users', text: 'Usuários', icon: <People /> },
        { to: '/admin/parametros', text: 'Parâmetros', icon: <AdminPanelSettings /> }
      );
    }

    // Filtra módulos que não têm links
    return Object.fromEntries(
      Object.entries(modules).filter(([, links]) => links.length > 0)
    );
  }, [hasFeature, isAdmin]);

  const navLinks = getNavLinks();

  const getModuleForPath = useCallback((path) => {
    for (const [module, links] of Object.entries(navLinks)) {
      if (links.some(link => path.startsWith(link.to))) {
        return module;
      }
    }
    return 'Geral'; // Módulo padrão
  }, [navLinks]);

  const [expandedSection, setExpandedSection] = useState(getModuleForPath(location.pathname));

  useEffect(() => {
    setExpandedSection(getModuleForPath(location.pathname));
  }, [location.pathname, getModuleForPath]);

  const toggleSection = (sectionName) => {
    setExpandedSection(prev => (prev === sectionName ? null : sectionName));
  };

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
              <NavLink key={link.to} to={link.to} end={link.to === '/'} className="sidebar-link">
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
            {user?.role && (
              <span className={`user-role role-${user.role}`}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
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


