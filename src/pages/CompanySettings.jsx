import React, { useState, useEffect } from 'react';
import { getCompany, saveCompany } from '../services/companyService';
import { registerCompanyWithPlugNotas } from '../services/plugnotasService';
import { getAddressFromCEP } from '../services/viaCepService';
import { uploadCertificate, getCertificates } from '../services/certificateService';
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
    tipoLogradouro: '', 
    tipoBairro: 'Bairro',
  },
  nfse: { producao: false, cidadePrestacao: '' },
  nfe: {},
  nfce: {},
  mdfe: {},
  cfe: {},
  nfcom: {},
  certificado: null,
};

const CompanySettings = () => {
  const [formData, setFormData] = useState(initialState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [certificateFile, setCertificateFile] = useState(null);
  const [certificatePassword, setCertificatePassword] = useState('');
  const [certificateId, setCertificateId] = useState(null);
  const [uploadingCertificate, setUploadingCertificate] = useState(false);
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [company, certs] = await Promise.all([
          getCompany(),
          getCertificates(),
        ]);

        if (company) {
          // Deep merge to ensure all nested objects and fields are present
          setFormData(prev => ({
            ...prev,
            ...company,
            endereco: { ...prev.endereco, ...(company.endereco || {}) },
            nfse: { ...prev.nfse, ...(company.nfse || {}) },
          }));
          if (company.certificado) {
            setCertificateId(company.certificado);
          }
        }
        if (certs) {
          setCertificates(certs);
        }
      } catch (err) {
        setError('Falha ao carregar os dados da empresa.');
        console.error(err);
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

  const handleFileChange = (e) => {
    setCertificateFile(e.target.files[0]);
  };

  const handleCertificateUpload = async (e) => {
    e.preventDefault();
    if (!certificateFile || !certificatePassword) {
      setError('Por favor, selecione um arquivo de certificado e digite a senha.');
      return;
    }
    setUploadingCertificate(true);
    setError(null);
    setSuccess(null);
    try {
      const id = await uploadCertificate(certificateFile, certificatePassword);
      setCertificateId(id);
      setSuccess('Certificado enviado com sucesso!');
      // Refresh the list of certificates
      const certs = await getCertificates();
      if (certs) {
        setCertificates(certs);
      }
    } catch (err) {
      setError(err.message || 'Falha ao enviar o certificado.');
      console.error(err);
    } finally {
      setUploadingCertificate(false);
    }
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
      // Step 1: Save data locally to our Supabase DB
      setSuccess('Salvando dados locais...');
      const localData = await saveCompany({ ...formData, certificado: certificateId });
      setFormData(prev => ({ ...prev, ...localData })); // Update state with any DB defaults
      setSuccess('Dados salvos com sucesso! Registrando no provedor fiscal...');

      // Step 2: Register the company with the external provider
      const apiPayload = {
        cpfCnpj: formData.cpf_cnpj,
        inscricaoMunicipal: formData.inscricao_municipal,
        inscricaoEstadual: formData.inscricao_estadual,
        razaoSocial: formData.razao_social,
        nomeFantasia: formData.nome_fantasia,
        certificado: certificateId,
        simplesNacional: formData.simples_nacional,
        regimeTributario: formData.regime_tributario,
        incentivoFiscal: formData.incentivo_fiscal,
        incentivadorCultural: formData.incentivador_cultural,
        regimeTributarioEspecial: formData.regime_tributario_especial,
        endereco: {
          cep: formData.endereco.cep,
          logradouro: formData.endereco.logradouro,
          numero: formData.endereco.numero,
          complemento: formData.endereco.complemento,
          bairro: formData.endereco.bairro,
          codigoCidade: formData.endereco.codigo_cidade,
          cidade: formData.endereco.cidade,
          estado: formData.endereco.estado,
          tipoLogradouro: formData.endereco.tipoLogradouro,
          tipoBairro: formData.endereco.tipoBairro,
        },
        telefone: formData.telefone,
        email: formData.email,
        nfse: formData.nfse,
        nfe: formData.nfe,
        nfce: formData.nfce,
        mdfe: formData.mdfe,
        cfe: formData.cfe,
        nfcom: formData.nfcom,
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

      {/* Certificate List */}
      <section className="form-section">
        <h3>Certificados Digitais</h3>
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>Vencimento</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {certificates.map(cert => (
              <tr key={cert.id}>
                <td>{cert.nome}</td>
                <td>{cert.cnpj}</td>
                <td>{new Date(cert.vencimento).toLocaleDateString()}</td>
                <td>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setCertificateId(cert.id)}
                    disabled={certificateId === cert.id}
                  >
                    {certificateId === cert.id ? 'Selecionado' : 'Selecionar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Certificate Upload Form */}
      <form onSubmit={handleCertificateUpload} className="company-form">
        <section className="form-section">
          <h3>Enviar Novo Certificado</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Arquivo do Certificado (.pfx, .p12)</label>
              <input type="file" accept=".pfx,.p12" onChange={handleFileChange} />
            </div>
            <div className="form-group">
              <label>Senha do Certificado</label>
              <input type="password" value={certificatePassword} onChange={e => setCertificatePassword(e.target.value)} />
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn-secondary" disabled={uploadingCertificate}>
              {uploadingCertificate ? 'Enviando...' : 'Enviar Certificado'}
            </button>
          </div>
          {certificateId && <p>Certificado ID: {certificateId}</p>}
        </section>
      </form>

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
          <div className="form-row">
            <div className="form-group"><label>Inscrição Estadual</label><input type="text" value={formData.inscricao_estadual} onChange={e => handleInputChange('inscricao_estadual', e.target.value)} /></div>
            <div className="form-group"><label>Telefone</label><input type="text" value={formData.telefone} onChange={e => handleInputChange('telefone', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Email</label><input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} required /></div>
          </div>
        </section>

        {/* Address */}
        <section className="form-section">
          <h3>Endereço</h3>
           <div className="form-row">
            <div className="form-group"><label>CEP</label><input type="text" value={formData.endereco.cep} onBlur={e => handleCepBlur(e.target.value)} onChange={e => handleAddressChange('cep', e.target.value)} /></div>
            <div className="form-group"><label>Cidade</label><input type="text" value={formData.endereco.cidade} onChange={e => handleAddressChange('cidade', e.target.value)} /></div>
            <div className="form-group"><label>UF</label><input type="text" maxLength="2" value={formData.endereco.estado} onChange={e => handleAddressChange('estado', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Logradouro</label><input type="text" className="flex-2" value={formData.endereco.logradouro} onChange={e => handleAddressChange('logradouro', e.target.value)} /></div>
            <div className="form-group"><label>Número</label><input type="text" value={formData.endereco.numero} onChange={e => handleAddressChange('numero', e.target.value)} /></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Bairro</label><input type="text" value={formData.endereco.bairro} onChange={e => handleAddressChange('bairro', e.target.value)} /></div>
            <div className="form-group"><label>Complemento</label><input type="text" value={formData.endereco.complemento} onChange={e => handleAddressChange('complemento', e.target.value)} /></div>
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
