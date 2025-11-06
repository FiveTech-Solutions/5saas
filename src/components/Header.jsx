import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const { signOut, profile } = useAuth();

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>FiveSaaS</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/nfse/new" className="nav-link">Nova NFS-e</Link>
          <Link to="/settings" className="nav-link">Configurações</Link>
          {profile?.role === 'admin' && <Link to="/admin" className="nav-link admin-link">Admin</Link>}
          <button onClick={signOut} className="nav-link btn-logout">Sair</button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
