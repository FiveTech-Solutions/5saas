import React from 'react';
import './Footer.css';
import packageJson from '../../package.json';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <p>&copy; {new Date().getFullYear()} SAQUETE SERVIÇOS EMPRESARIAIS LTDA</p>
        <p>CNPJ: 47.793.601/0001-62</p>
        <p>Versão: {packageJson.version}</p>
      </div>
    </footer>
  );
};

export default Footer;