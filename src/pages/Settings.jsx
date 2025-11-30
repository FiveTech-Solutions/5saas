import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setCertificateFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!certificateFile || !certificatePassword) {
      setMessage({ type: 'error', text: 'Por favor, selecione o arquivo do certificado e digite a senha.' });
      return;
    }

    setUploading(true);
    setMessage({ type: 'info', text: 'Funcionalidade de upload ainda não implementada.' });

    setTimeout(() => {
      setUploading(false);
    }, 2000);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Configurações</h2>
      </div>

      <div className="settings-content">
        <form onSubmit={handleUpload} className="settings-form">
          <div className="form-section">
            <h3>Certificado Digital (A1)</h3>
            <p className="section-description">
              Faça o upload do seu certificado digital (.pfx ou .p12) e informe a senha para autenticar a emissão das suas notas fiscais.
            </p>

            <div className="form-group">
              <label htmlFor="cert-file">Arquivo do Certificado</label>
              <input
                type="file"
                id="cert-file"
                accept=".pfx, .p12"
                onChange={handleFileChange}
                className="file-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="cert-password">Senha do Certificado</label>
              <input
                type="password"
                id="cert-password"
                value={certificatePassword}
                onChange={(e) => setCertificatePassword(e.target.value)}
                placeholder="Digite a senha do seu certificado"
              />
            </div>

            {message && (
              <div className={`alert alert-${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Enviando...' : 'Salvar Certificado'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
