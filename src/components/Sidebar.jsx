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
  AutoAwesome,
  PointOfSale,
  ShoppingCart,
  AccountBalance,
  Tune
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
      'NFS-e': [
        { to: '/nfse', text: 'Minhas NFS-e', icon: <Description /> },
        { to: '/nfse/new', text: 'Nova NFS-e', icon: <AddCircle /> },
        { to: '/servicos-tomados', text: 'Serviços Tomados', icon: <Build /> },
        { to: '/servicos', text: 'Gerenciar Serviços', icon: <ListAlt /> }],
      'PDV': [
        { to: 'https://pdv.fivetechsolutions.com.br', text: 'Acessar PDV', icon: <PointOfSale /> },
        { to: '/pdv/vendas', text: 'Vendas', icon: <ShoppingCart /> },
        { to: '/pdv/caixa', text: 'Caixa', icon: <AccountBalance /> },
        { to: '/pdv/configuracao', text: 'Configuração', icon: <Tune /> }],
      'NF-e': [
        { to: '/nfe', text: 'Minhas NF-e', icon: <Receipt /> },
        { to: '/nfe/new', text: 'Nova NF-e', icon: <AddCircle /> }],
      'NFC-e': [
        { to: '/nfce', text: 'Minhas NFC-e', icon: <Contactless /> },
        { to: '/nfce/new', text: 'Nova NFC-e', icon: <AddCircle /> }],
      'Ferramentas IA': [
        { to: '/ai/insights', text: 'Análise Inteligente', icon: <AutoAwesome /> }],
      'Produtos': [
        { to: '/produtos', text: 'Listar Produtos', icon: <ListAlt /> },
        { to: '/produtos/novo', text: 'Cadastrar Produto', icon: <AddCircle /> }
      ],
      'Configurações': [
        { to: '/clientes', text: 'Clientes', icon: <People /> },
        { to: '/empresa/configuracoes', text: 'Empresa', icon: <Business /> },
        { to: '/settings', text: 'Minha Conta', icon: <Settings /> },
      ],
    };

    // Filtrar módulos baseados nas features
    if (!hasFeature('NFSE')) delete modules['NFS-e'];
    if (!hasFeature('NFE')) delete modules['NF-e'];
    if (!hasFeature('NFCE')) delete modules['NFC-e'];
    if (!hasFeature('AI_TOOLS')) delete modules['Ferramentas IA'];
    if (!isAdmin()) delete modules['Administração'];

    // Filtra módulos que não têm links (after potential deletions)
    return Object.fromEntries(
      Object.entries(modules).filter(([, links]) => links.length > 0)
    );
  }, [hasFeature, isAdmin]);

  const navLinks = getNavLinks();

  const getModuleForPath = useCallback((path) => {
    for (const [module, links] of Object.entries(navLinks)) {
      // Ignorar links externos ao verificar o módulo ativo
      if (links.some(link => !link.to.startsWith('http') && path.startsWith(link.to))) {
        return module;
      }
    }
    return 'Geral'; // Módulo padrão
  }, [navLinks]);

  const [expandedSection, setExpandedSection] = useState(getModuleForPath(location.pathname));

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
            {links.map((link) => {
              // Verificar se é link externo
              const isExternal = link.to.startsWith('http');

              if (isExternal) {
                return (
                  <a
                    key={link.to}
                    href={link.to}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="sidebar-link"
                  >
                    {link.icon}
                    <span>{link.text}</span>
                  </a>
                );
              }

              return (
                <NavLink key={link.to} to={link.to} end={link.to === '/'} className="sidebar-link">
                  {link.icon}
                  <span>{link.text}</span>
                </NavLink>
              );
            })}
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


