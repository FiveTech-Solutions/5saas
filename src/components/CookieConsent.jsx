import React, { useState, useEffect } from 'react';
import './CookieConsent.css';

const CookieConsent = ({ onPolicyClick }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'true');
    setVisible(false);
  };

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-consent-banner">
      <p>
        Nós utilizamos cookies para melhorar sua experiência de navegação. Ao continuar, você concorda com nossa{' '}
        <button className="link-button" onClick={onPolicyClick}>
          Política de Privacidade
        </button>
        .
      </p>
      <button onClick={handleAccept}>Aceitar</button>
    </div>
  );
};

export default CookieConsent;
