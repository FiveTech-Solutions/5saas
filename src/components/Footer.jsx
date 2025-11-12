import React from 'react';
import './Footer.css';
import packageJson from '../../package.json';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-left">
          <span className="company-name">SAQUETE SERVIÇOS EMPRESARIAIS LTDA</span>
          <span className="copyright">© {new Date().getFullYear()}</span>
        </div>
        <div className="footer-right">
          <span className="version">v{packageJson.version}</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;