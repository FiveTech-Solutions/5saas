import React from 'react';
import './Footer.css';

// Version is read from package.json at build time by the agent
const appVersion = "0.0.0";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="app-footer">
      <div className="footer-content">
        <span>
          &copy; {currentYear} SAQUETE SERVIÇOS EMPRESARIAIS LTDA | CNPJ: 47.793.601/0001-62
        </span>
        <span className="app-version">
          v{appVersion}
        </span>
      </div>
    </footer>
  );
};

export default Footer;
