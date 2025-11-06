import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>NFS-e SaaS</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Início</Link>
          <Link to="/nfse/new" className="nav-link">Nova NFS-e</Link>
          <Link to="/settings" className="nav-link">Configurações</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
