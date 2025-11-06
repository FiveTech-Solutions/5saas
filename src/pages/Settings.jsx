import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Settings.css';

const Settings = () => {
  const navigate = useNavigate();
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load API key from localStorage
    const storedApiKey = localStorage.getItem('technospeed_api_key');
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleSave = (e) => {
    e.preventDefault();
    localStorage.setItem('technospeed_api_key', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleClear = () => {
    if (window.confirm('Tem certeza que deseja remover a chave de API?')) {
      localStorage.removeItem('technospeed_api_key');
      setApiKey('');
      setSaved(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Voltar
        </button>
        <h2>Configurações</h2>
      </div>

      <div className="settings-content">
        <form onSubmit={handleSave} className="settings-form">
          <div className="form-section">
            <h3>Configurações da API Technospeed</h3>
            <p className="section-description">
              Configure sua chave de API para integração com o PlugNotas (Technospeed).
              A chave será armazenada localmente no seu navegador.
            </p>
            <p className="section-description" style={{ fontSize: '0.85rem', color: '#dc2626' }}>
              <strong>⚠️ Nota de Segurança:</strong> Para ambientes de produção, recomenda-se implementar
              um backend que gerencie as chaves de API de forma segura. Esta implementação é adequada
              para desenvolvimento e testes.
            </p>

            <div className="form-group">
              <label>Chave de API (x-api-key)</label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Digite sua chave de API"
              />
              <small>
                Obtenha sua chave de API no painel do PlugNotas.
                Ambiente: Sandbox (api.sandbox.plugnotas.com.br)
              </small>
            </div>

            {saved && (
              <div className="alert alert-success">
                Configurações salvas com sucesso!
              </div>
            )}

            <div className="form-actions">
              {apiKey && (
                <button type="button" className="btn-danger" onClick={handleClear}>
                  Remover Chave
                </button>
              )}
              <button type="submit" className="btn-primary">
                Salvar Configurações
              </button>
            </div>
          </div>

          <div className="info-section">
            <h3>Informações da API</h3>
            <div className="info-list">
              <div className="info-item-settings">
                <strong>Ambiente:</strong> Sandbox
              </div>
              <div className="info-item-settings">
                <strong>URL Base:</strong> https://api.sandbox.plugnotas.com.br
              </div>
              <div className="info-item-settings">
                <strong>Endpoints disponíveis:</strong>
                <ul>
                  <li>POST /nfse - Criar NFS-e</li>
                  <li>GET /nfse/:id - Consultar NFS-e</li>
                  <li>GET /nfse/pdf/:id - Baixar PDF</li>
                  <li>GET /nfse/xml/:id - Baixar XML</li>
                  <li>POST /nfse/cancelar/:id - Cancelar NFS-e</li>
                  <li>POST /nfse/email/:id - Enviar por email</li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
