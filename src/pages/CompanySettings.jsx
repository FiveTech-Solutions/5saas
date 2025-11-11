import React, { useState, useEffect, useCallback } from 'react';
import { getCompany, saveCompany } from '../services/companyService';
import './CompanySettings.css'; // We will create this file

const initialState = {
  cpf_cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_municipal: '',
  inscricao_estadual: '',
  email: '',
  telefone: '',
  endereco: {
    cep: '',
    logradouro: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    codigo_cidade: '',
  },
};

const CompanySettings = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const loadCompanyData = async () => {
      try {
        setLoading(true);
        const company = await getCompany();
        if (company) {
          // Merge with initial state to ensure all fields are present
          setFormData(prev => ({ ...prev, ...company }));
        }
      } catch (err) {
        setError('Falha ao carregar os dados da empresa.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadCompanyData();
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      endereco: { ...prev.endereco, [field]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await saveCompany(formData);
      setSuccess('Dados da empresa salvos com sucesso!');
    } catch (err) {
      setError('Erro ao salvar os dados. Verifique os campos e tente novamente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  // CNPJ Lookup
  useEffect(() => {
    const cnpj = formData.cpf_cnpj.replace(/\D/g, '');
    if (cnpj.length === 14) {
      fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
        .then(res => res.ok ? res.json() : Promise.reject('CNPJ inválido'))
        .then(data => {
          handleInputChange('razao_social', data.razao_social || '');
          handleInputChange('nome_fantasia', data.nome_fantasia || '');
          handleAddressChange('cep', data.cep || '');
          handleAddressChange('logradouro', data.logradouro || '');
          handleAddressChange('numero', data.numero || '');
          handleAddressChange('bairro', data.bairro || '');
          handleAddressChange('cidade', data.municipio || '');
          handleAddressChange('estado', data.uf || '');
        })
        .catch(console.error);
    }
  }, [formData.cpf_cnpj]);

  // CEP Lookup
  useEffect(() => {
    const cep = formData.endereco.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(res => res.ok ? res.json() : Promise.reject('CEP inválido'))
        .then(data => {
          if (data.erro) return;
          handleAddressChange('logradouro', data.logradouro || '');
          handleAddressChange('bairro', data.bairro || '');
          handleAddressChange('cidade', data.localidade || '');
          handleAddressChange('estado', data.uf || '');
          handleAddressChange('codigo_cidade', data.ibge || '');
        })
        .catch(console.error);
    }
  }, [formData.endereco.cep]);


  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="company-settings-container">
      <div className="form-header">
        <h2>Dados da Empresa</h2>
        <p>Estas informações serão usadas para a emissão das suas notas fiscais.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="company-form">
        <section className="form-section">
          <h3>Identificação</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CNPJ</label>
              <input type="text" value={formData.cpf_cnpj} onChange={e => handleInputChange('cpf_cnpj', e.target.value)} required />
            </div>
            <div className="form-group">
              <label>Razão Social</label>
              <input type="text" value={formData.razao_social} onChange={e => handleInputChange('razao_social', e.target.value)} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Nome Fantasia</label>
              <input type="text" value={formData.nome_fantasia} onChange={e => handleInputChange('nome_fantasia', e.target.value)} />
            </div>
          </div>
           <div className="form-row">
            <div className="form-group">
              <label>Inscrição Municipal</label>
              <input type="text" value={formData.inscricao_municipal} onChange={e => handleInputChange('inscricao_municipal', e.target.value)} />
            </div>
             <div className="form-group">
              <label>Inscrição Estadual</label>
              <input type="text" value={formData.inscricao_estadual} onChange={e => handleInputChange('inscricao_estadual', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Contato</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Telefone</label>
              <input type="tel" value={formData.telefone} onChange={e => handleInputChange('telefone', e.target.value)} />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Endereço</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CEP</label>
              <input type="text" value={formData.endereco.cep} onChange={e => handleAddressChange('cep', e.target.value)} />
            </div>
            <div className="form-group flex-2">
              <label>Logradouro</label>
              <input type="text" value={formData.endereco.logradouro} onChange={e => handleAddressChange('logradouro', e.target.value)} />
            </div>
             <div className="form-group">
              <label>Número</label>
              <input type="text" value={formData.endereco.numero} onChange={e => handleAddressChange('numero', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Complemento</label>
              <input type="text" value={formData.endereco.complemento} onChange={e => handleAddressChange('complemento', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Bairro</label>
              <input type="text" value={formData.endereco.bairro} onChange={e => handleAddressChange('bairro', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cidade</label>
              <input type="text" value={formData.endereco.cidade} onChange={e => handleAddressChange('cidade', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Estado (UF)</label>
              <input type="text" maxLength="2" value={formData.endereco.estado} onChange={e => handleAddressChange('estado', e.target.value)} />
            </div>
             <div className="form-group">
              <label>Código IBGE da Cidade</label>
              <input type="text" value={formData.endereco.codigo_cidade} onChange={e => handleAddressChange('codigo_cidade', e.target.value)} />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
