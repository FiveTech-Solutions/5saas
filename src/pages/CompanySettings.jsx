import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import PageLoader from '../components/PageLoader';
import { useIMask } from 'react-imask';
import { registerCompanyWithPlugNotas, getCompanyDetailsByCnpj } from '../services/plugnotasService';
import { getAddressFromCEP } from '../services/viaCepService';
import { keysToCamelCase } from '../utils/helpers'; // Import the helper
// Certificate logic is temporarily simplified
// import { uploadCertificate, getCertificates } from '../services/certificateService';
import './CompanySettings.css';

// New initial state matching the PlugNotas API structure more closely
const initialState = {
  cpf_cnpj: '',
  razao_social: '',
  nome_fantasia: '',
  inscricao_municipal: '',
  inscricao_estadual: '',
  email: '',
  telefone: '', // Will be a single string in the form, parsed on submit
  simples_nacional: true,
  regime_tributario: 1,
  incentivo_fiscal: false,
  incentivador_cultural: false,
  regime_tributario_especial: 0,
  endereco: {
    cep: '', logradouro: '', numero: '', complemento: '',
    bairro: '', cidade: '', estado: '', codigo_cidade: '',
    tipoLogradouro: 'Rua', tipoBairro: 'Bairro',
    // Added missing fields for PlugNotas API
    codigoPais: '1058',
    descricaoCidade: '', // Will be filled by ViaCEP or user
    descricaoPais: 'Brasil',
  },
  // Simplified NFSe object with default config
  nfse: {
    ativo: true,
    tipoContrato: 0,
    config: {
      producao: false, // Start in sandbox
      nfseNacional: true, // Added from example
      consultaNfseNacional: true, // Added from example
      consultaDfe: { // Added from example
        prestador: true,
        tomador: true,
        intermediario: true
      },
      rps: {
        lote: 1, // Added from example
        numeracao: [{ numero: 1, serie: "RPS" }], // Added from example
        numeracaoAutomatica: true,
        agrupaLoteAutomatico: true, // Added from example
        agrupaLoteComSerieAutomatico: true // Added from example
      },
      prefeitura: { // Added from example
        login: "teste",
        senha: "teste123",
        receitaBruta: 0,
        lei: "string",
        dataInicio: "2021-03-24"
      },
      email: { envio: true },
      calculoAutomaticoIbpt: { ativo: true }, // Added from example
      enviarNotificacaoProcessamento: { // Added from example
        webhook: true,
        email: true,
        destinatarios: [
          "email-1@plugnotas.com.br",
          "email-2@plugnotas.com.br"
        ]
      }
    }
  },
  // Add other document types with default 'ativo: false'
  nfe: { ativo: false },
  nfce: { ativo: false },
  mdfe: { ativo: false },
  cfe: { ativo: false },
  nfcom: { ativo: false },
};

const MOCKED_CERTIFICATE_ID = "5af59d271f6e8f409178fbf3";

const CompanySettings = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const { ref: cnpjInputRef, maskRef: cnpjMaskRef } = useIMask({
    mask: '00.000.000/0000-00',
    lazy: false,
    unmask: true, // Get unmasked value in onAccept
  });

  // Certificate logic is temporarily simplified
  // const [certificateFile, setCertificateFile] = useState(null);
  // const [certificatePassword, setCertificatePassword] = useState('');
  // const [uploadingCertificate, setUploadingCertificate] = useState(false);
  // const [certificates, setCertificates] = useState([]);

  const handleCnpjBlur = async (e) => {
    const cnpj = e.target.value;
    if (!cnpj || cnpj.replace(/\D/g, '').length < 14) return; // Basic validation

    try {
      setLoading(true); // Or a specific loading state for CNPJ lookup
      const cleanedCnpj = cnpj.replace(/\D/g, ''); // Remove non-digits
      const companyDetails = await getCompanyDetailsByCnpj(cleanedCnpj);

      if (companyDetails && companyDetails.status === 'OK') {
        setFormData(prev => ({
          ...prev,
          cpf_cnpj: companyDetails.cpf_cnpj || prev.cpf_cnpj,
          razao_social: companyDetails.razao_social || prev.razao_social,
          nome_fantasia: companyDetails.nome || prev.nome_fantasia,
          email: companyDetails.email || prev.email,
          // Format phone number to a single string for the form
          telefone: companyDetails.telefone ? companyDetails.telefone.replace(/\D/g, '') : prev.telefone,
          // Map address fields
          endereco: {
            ...prev.endereco,
            cep: companyDetails.endereco.cep || prev.endereco.cep,
            logradouro: companyDetails.endereco.logradouro || prev.endereco.logradouro,
            numero: companyDetails.endereco.numero || prev.endereco.numero,
            complemento: companyDetails.endereco.complemento || prev.endereco.complemento,
            bairro: companyDetails.endereco.bairro || prev.endereco.bairro,
            cidade: companyDetails.endereco.municipio || prev.endereco.cidade,
            estado: companyDetails.endereco.uf || prev.endereco.estado,
            descricaoCidade: companyDetails.endereco.municipio || prev.endereco.descricaoCidade,
            // PlugNotas API doesn't provide IBGE code directly in this endpoint,
            // so we might need to keep the existing ViaCEP logic for `codigo_cidade`
            // or fetch it separately if `municipio` is not enough.
            // For now, we'll rely on ViaCEP for `codigo_cidade` if CEP is also filled.
          },
          // Assuming default values for fiscal info if not provided by PlugNotas CNPJ lookup
          // simples_nacional: companyDetails.simples_nacional !== undefined ? companyDetails.simples_nacional : prev.simples_nacional,
          // regime_tributario: companyDetails.regime_tributario !== undefined ? companyDetails.regime_tributario : prev.regime_tributario,
          // ... other fiscal fields if available in CNPJ lookup response
        }));
        setSuccess('Dados da empresa preenchidos automaticamente!');
      } else if (companyDetails && companyDetails.status !== 'OK') {
        setError(`Consulta CNPJ: ${companyDetails.message || 'Status não OK.'}`);
      }
    } catch (err) {
      setError(err.message || 'Erro ao consultar CNPJ.');
      logger.error("Erro ao consultar CNPJ:", err);
    } finally {
      setLoading(false); // Or specific loading state
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const company = await getCompany(); // This now fetches from PlugNotas

        if (company) {
          // Map PlugNotas response to formData
          setFormData(prev => ({
            ...prev,
            cpf_cnpj: company.cpf_cnpj || '',
            razao_social: company.razao_social || '',
            nome_fantasia: company.nome || '',
            inscricao_municipal: company.inscricao_municipal || '',
            inscricao_estadual: company.inscricao_estadual || '',
            email: company.email || '',
            telefone: company.telefone ? company.telefone.replace(/\D/g, '') : '',
            endereco: {
              ...prev.endereco, // Keep defaults for fields not in PlugNotas response
              cep: company.endereco?.cep || '',
              logradouro: company.endereco?.logradouro || '',
              numero: company.endereco?.numero || '',
              complemento: company.endereco?.complemento || '',
              bairro: company.endereco?.bairro || '',
              cidade: company.endereco?.municipio || '',
              estado: company.endereco?.uf || '',
              descricaoCidade: company.endereco?.municipio || '',
              // codigo_cidade might need to be fetched separately if not in PlugNotas response
            },
            // Fiscal info from PlugNotas might not be available in this endpoint,
            // so we might keep the initial state defaults or fetch from another source.
            // For now, we'll rely on initial state defaults for fiscal info.
          }));
        }
      } catch (err) {
        setError('Falha ao carregar os dados da empresa do PlugNotas.');
        logger.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
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

  const handleCepBlur = async (cep) => {
    const address = await getAddressFromCEP(cep);
    if (address) {
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: address.cep,
          logradouro: address.logradouro,
          bairro: address.bairro,
          cidade: address.localidade,
          estado: address.uf,
          codigo_cidade: address.ibge,
          descricaoCidade: address.localidade, // Set descricaoCidade from ViaCEP
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Removed local save to Supabase as per user request.
      // Now, this component primarily registers the company with the external provider.

      // Parse phone into DDD and number
      const phoneString = formData.telefone.replace(/\D/g, '');
      const telefonePayload = {
        ddd: phoneString.substring(0, 2),
        numero: phoneString.substring(2),
      };

      // Construct the payload for PlugNotas API, converting keys to camelCase
      const rawApiPayload = {
        ...formData,
        certificado: MOCKED_CERTIFICATE_ID, // Use mocked certificate
        telefone: telefonePayload, // Use parsed phone object
        endereco: {
          ...formData.endereco,
          descricaoCidade: formData.endereco.cidade, // Ensure descricaoCidade is set
        },
      };

      const apiPayload = keysToCamelCase(rawApiPayload);

      const plugNotasResponse = await registerCompanyWithPlugNotas(apiPayload);
      setSuccess(`Empresa registrada com sucesso no PlugNotas! Protocolo: ${plugNotasResponse.protocol || 'N/A'}`);

    } catch (err) {
      setError(err.message || 'Ocorreu um erro desconhecido ao registrar a empresa no PlugNotas.');
      logger.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoader message="Carregando configurações da empresa..." />;

  return (
    <div className="company-settings-container">
      <div className="form-header">
        <h2>Dados da Empresa (Emitente)</h2>
        <p>Informações da sua empresa para emissão das notas fiscais.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="alert alert-warning">
        <strong>Atenção:</strong> O upload de certificado está desabilitado. Um certificado de teste está sendo usado automaticamente.
      </div>

      <form onSubmit={handleSubmit} className="company-form">
        {/* Basic Info */}
        <section className="form-section">
          <h3>Identificação</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CNPJ</label>
              <input
                type="text"
                ref={cnpjInputRef}
                value={formData.cpf_cnpj}
                onBlur={handleCnpjBlur}
                onChange={() => handleInputChange('cpf_cnpj', cnpjMaskRef.current.unmaskedValue)}
                required
                disabled
                className="readonly-input"
              />
            </div>
            <div className="form-group"><label>Razão Social</label><input type="text" value={formData.razao_social} onChange={e => handleInputChange('razao_social', e.target.value)} required disabled className="readonly-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Nome Fantasia</label><input type="text" value={formData.nome_fantasia} onChange={e => handleInputChange('nome_fantasia', e.target.value)} disabled className="readonly-input" /></div>
            <div className="form-group"><label>Inscrição Municipal</label><input type="text" value={formData.inscricao_municipal} onChange={e => handleInputChange('inscricao_municipal', e.target.value)} disabled className="readonly-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Inscrição Estadual</label><input type="text" value={formData.inscricao_estadual} onChange={e => handleInputChange('inscricao_estadual', e.target.value)} disabled className="readonly-input" /></div>
            <div className="form-group"><label>Telefone (com DDD)</label><input type="text" value={formData.telefone} onChange={e => handleInputChange('telefone', e.target.value)} disabled className="readonly-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required disabled className="readonly-input" /></div>
          </div>
        </section>

        {/* Address */}
        <section className="form-section">
          <h3>Endereço</h3>
          <div className="form-row">
            <div className="form-group"><label>CEP</label><input type="text" value={formData.endereco.cep} onBlur={e => handleCepBlur(e.target.value)} onChange={e => handleAddressChange('cep', e.target.value)} disabled className="readonly-input" /></div>
            <div className="form-group"><label>Cidade</label><input type="text" value={formData.endereco.cidade} onChange={e => handleAddressChange('cidade', e.target.value)} disabled className="readonly-input" /></div>
            <div className="form-group"><label>UF</label><input type="text" maxLength="2" value={formData.endereco.estado} onChange={e => handleAddressChange('estado', e.target.value)} disabled className="readonly-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Logradouro</label><input type="text" className="flex-2 readonly-input" value={formData.endereco.logradouro} onChange={e => handleAddressChange('logradouro', e.target.value)} disabled /></div>
            <div className="form-group"><label>Número</label><input type="text" value={formData.endereco.numero} onChange={e => handleAddressChange('numero', e.target.value)} disabled className="readonly-input" /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Bairro</label><input type="text" value={formData.endereco.bairro} onChange={e => handleAddressChange('bairro', e.target.value)} disabled className="readonly-input" /></div>
            <div className="form-group"><label>Complemento</label><input type="text" value={formData.endereco.complemento} onChange={e => handleAddressChange('complemento', e.target.value)} disabled className="readonly-input" /></div>
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
            <div className="form-group-checkbox">
              <input type="checkbox" id="incentivo_fiscal" checked={formData.incentivo_fiscal} onChange={e => handleInputChange('incentivo_fiscal', e.target.checked)} />
              <label htmlFor="incentivo_fiscal">Incentivo Fiscal</label>
            </div>
            <div className="form-group-checkbox">
              <input type="checkbox" id="incentivador_cultural" checked={formData.incentivador_cultural} onChange={e => handleInputChange('incentivador_cultural', e.target.checked)} />
              <label htmlFor="incentivador_cultural">Incentivador Cultural</label>
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
