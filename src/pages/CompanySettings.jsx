import React, { useState, useEffect } from 'react';
import { getCompany, saveCompany } from '../services/companyService';
import { registerCompanyWithPlugNotas } from '../services/plugnotasService';
import './CompanySettings.css';

const initialState = {
  cpf_cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_municipal: '',
  inscricao_estadual: '',
  email: '',
  telefone: '',
  simples_nacional: true,
  regime_tributario: 1, // 1 = Simples Nacional
  incentivo_fiscal: false,
  incentivador_cultural: false,
  regime_tributario_especial: 0,
  endereco: {
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', codigo_cidade: '',
    // Fields required by PlugNotas API that might not be in ViaCEP
    tipoLogradouro: '', 
    tipoBairro: 'Bairro',
  },
  // Placeholder for future config objects
  nfse: { producao: false, cidadePrestacao: '' },
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
          // Deep merge to ensure all nested objects and fields are present
          setFormData(prev => ({
            ...prev,
            ...company,
            endereco: { ...prev.endereco, ...(company.endereco || {}) },
            nfse: { ...prev.nfse, ...(company.nfse || {}) },
          }));
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
      // Step 1: Save data locally to our Supabase DB
      setSuccess('Salvando dados locais...');
      const localData = await saveCompany(formData);
      setFormData(prev => ({ ...prev, ...localData })); // Update state with any DB defaults
      setSuccess('Dados salvos com sucesso! Registrando no provedor fiscal...');

      // Step 2: Register the company with the external provider
      // Note: You might need to transform `formData` to match the API payload exactly
      const apiPayload = {
        ...formData,
        // Ensure nested objects are what the API expects
        endereco: {
          ...formData.endereco,
          // The API uses 'descricaoCidade' for city name
          descricaoCidade: formData.endereco.cidade,
        },
        // Remove fields the API doesn't recognize, if any
      };
      
      const plugNotasResponse = await registerCompanyWithPlugNotas(apiPayload);
      setSuccess(`Empresa registrada com sucesso! Protocolo: ${plugNotasResponse.protocol}`);

    } catch (err) {
      setError(err.message || 'Ocorreu um erro desconhecido.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) return <div>Carregando...</div>;

  return (
    <div className="company-settings-container">
      <div className="form-header">
        <h2>Dados da Empresa (Emitente)</h2>
        <p>Informações da sua empresa para emissão das notas fiscais.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <form onSubmit={handleSubmit} className="company-form">
        {/* Basic Info */}
        <section className="form-section">
          <h3>Identificação</h3>
          <div className="form-row">
            <div className="form-group"><label>CNPJ</label><input type="text" value={formData.cpf_cnpj} onChange={e => handleInputChange('cpf_cnpj', e.target.value)} required /></div>
            <div className="form-group"><label>Razão Social</label><input type="text" value={formData.razao_social} onChange={e => handleInputChange('razao_social', e.target.value)} required /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Nome Fantasia</label><input type="text" value={formData.nome_fantasia} onChange={e => handleInputChange('nome_fantasia', e.target.value)} /></div>
            <div className="form-group"><label>Inscrição Municipal</label><input type="text" value={formData.inscricao_municipal} onChange={e => handleInputChange('inscricao_municipal', e.target.value)} /></div>
          </div>
        </section>

        {/* Address */}
        <section className="form-section">
          <h3>Endereço</h3>
           <div className="form-row">
            <div className="form-group"><label>CEP</label><input type="text" value={formData.endereco.cep} onChange={e => handleAddressChange('cep', e.target.value)} /></div>
            <div className="form-group"><label>Cidade</label><input type="text" value={formData.endereco.cidade} onChange={e => handleAddressChange('cidade', e.target.value)} /></div>
            <div className="form-group"><label>UF</label><input type="text" maxLength="2" value={formData.endereco.estado} onChange={e => handleAddressChange('estado', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Logradouro</label><input type="text" className="flex-2" value={formData.endereco.logradouro} onChange={e => handleAddressChange('logradouro', e.target.value)} /></div>
            <div className="form-group"><label>Número</label><input type="text" value={formData.endereco.numero} onChange={e => handleAddressChange('numero', e.target.value)} /></div>
          </div>
        </section>

        {/* Tax Info */}
        <section className="form-section">
          <h3>Informações Fiscais</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Regime Tributário</label>
              <select value={formData.regime_tributario} onChange={e => handleInputChange('regime_tributario', parseInt(e.target.value))}>
                <option value={1}>Simples Nacional</option>
                <option value={2}>Simples Nacional - Excesso</option>
                <option value={3}>Regime Normal - Lucro Presumido</option>
                <option value={4}>Normal - Lucro Real</option>
                <option value={5}>MEI</option>
                <option value={0}>Nenhum</option>
              </select>
            </div>
            <div className="form-group">
              <label>Regime Tributário Especial</label>
              <select value={formData.regime_tributario_especial} onChange={e => handleInputChange('regime_tributario_especial', parseInt(e.target.value))}>
                <option value={0}>Sem Regime Tributário Especial</option>
                <option value={1}>Micro Empresa Municipal</option>
                <option value={5}>MEI</option>
                <option value={6}>ME EPP</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group-checkbox">
              <input type="checkbox" id="simples_nacional" checked={formData.simples_nacional} onChange={e => handleInputChange('simples_nacional', e.target.checked)} />
              <label htmlFor="simples_nacional">Optante pelo Simples Nacional</label>
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar e Registrar Empresa'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
