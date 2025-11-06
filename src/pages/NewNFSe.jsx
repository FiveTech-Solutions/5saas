import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNFSe } from '../services/nfseService';
import './NewNFSe.css';

const NewNFSe = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    // Prestador
    prestador: {
      cnpj: '',
      inscricaoMunicipal: '',
      razaoSocial: '',
    },
    // Tomador
    tomador: {
      cpfCnpj: '',
      razaoSocial: '',
      email: '',
      endereco: {
        logradouro: '',
        numero: '',
        complemento: '',
        bairro: '',
        codigoMunicipio: '',
        uf: '',
        cep: '',
      },
    },
    // Serviço
    servico: {
      discriminacao: '',
      valorServicos: '',
      aliquota: '',
      issRetido: false,
      itemListaServico: '',
      codigoTributacaoMunicipio: '',
    },
  });

  const handleInputChange = (section, field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [parent]: {
            ...prev[section][parent],
            [child]: value,
          },
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Convert string values to numbers where needed
      const payload = {
        ...formData,
        servico: {
          ...formData.servico,
          valorServicos: parseFloat(formData.servico.valorServicos),
          aliquota: parseFloat(formData.servico.aliquota),
        },
      };

      const result = await createNFSe(payload);
      console.log('NFS-e created:', result);
      
      // Redirect to the details page if we have an ID
      if (result.id || result.idNota) {
        navigate(`/nfse/${result.id || result.idNota}`);
      } else {
        navigate('/');
      }
    } catch (err) {
      console.error('Error creating NFS-e:', err);
      setError(
        typeof err === 'string'
          ? err
          : err.message || 'Erro ao criar NFS-e. Verifique os dados e tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="new-nfse-container">
      <div className="form-header">
        <h2>Nova NFS-e</h2>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          Cancelar
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="nfse-form">
        {/* Prestador Section */}
        <section className="form-section">
          <h3>Dados do Prestador</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CNPJ *</label>
              <input
                type="text"
                value={formData.prestador.cnpj}
                onChange={(e) => handleInputChange('prestador', 'cnpj', e.target.value)}
                placeholder="00.000.000/0000-00"
                required
              />
            </div>
            <div className="form-group">
              <label>Inscrição Municipal *</label>
              <input
                type="text"
                value={formData.prestador.inscricaoMunicipal}
                onChange={(e) => handleInputChange('prestador', 'inscricaoMunicipal', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Razão Social *</label>
            <input
              type="text"
              value={formData.prestador.razaoSocial}
              onChange={(e) => handleInputChange('prestador', 'razaoSocial', e.target.value)}
              required
            />
          </div>
        </section>

        {/* Tomador Section */}
        <section className="form-section">
          <h3>Dados do Tomador</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CPF/CNPJ *</label>
              <input
                type="text"
                value={formData.tomador.cpfCnpj}
                onChange={(e) => handleInputChange('tomador', 'cpfCnpj', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Razão Social/Nome *</label>
              <input
                type="text"
                value={formData.tomador.razaoSocial}
                onChange={(e) => handleInputChange('tomador', 'razaoSocial', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.tomador.email}
              onChange={(e) => handleInputChange('tomador', 'email', e.target.value)}
              required
            />
          </div>
          
          <h4>Endereço</h4>
          <div className="form-row">
            <div className="form-group flex-2">
              <label>Logradouro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.logradouro}
                onChange={(e) => handleInputChange('tomador', 'endereco.logradouro', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Número *</label>
              <input
                type="text"
                value={formData.tomador.endereco.numero}
                onChange={(e) => handleInputChange('tomador', 'endereco.numero', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Complemento</label>
              <input
                type="text"
                value={formData.tomador.endereco.complemento}
                onChange={(e) => handleInputChange('tomador', 'endereco.complemento', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Bairro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.bairro}
                onChange={(e) => handleInputChange('tomador', 'endereco.bairro', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Código Município *</label>
              <input
                type="text"
                value={formData.tomador.endereco.codigoMunicipio}
                onChange={(e) => handleInputChange('tomador', 'endereco.codigoMunicipio', e.target.value)}
                placeholder="Ex: 3550308"
                required
              />
            </div>
            <div className="form-group">
              <label>UF *</label>
              <input
                type="text"
                value={formData.tomador.endereco.uf}
                onChange={(e) => handleInputChange('tomador', 'endereco.uf', e.target.value)}
                placeholder="SP"
                maxLength="2"
                required
              />
            </div>
            <div className="form-group">
              <label>CEP *</label>
              <input
                type="text"
                value={formData.tomador.endereco.cep}
                onChange={(e) => handleInputChange('tomador', 'endereco.cep', e.target.value)}
                placeholder="00000-000"
                required
              />
            </div>
          </div>
        </section>

        {/* Serviço Section */}
        <section className="form-section">
          <h3>Dados do Serviço</h3>
          <div className="form-group">
            <label>Discriminação do Serviço *</label>
            <textarea
              value={formData.servico.discriminacao}
              onChange={(e) => handleInputChange('servico', 'discriminacao', e.target.value)}
              rows="4"
              placeholder="Descrição detalhada do serviço prestado"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor dos Serviços (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.servico.valorServicos}
                onChange={(e) => handleInputChange('servico', 'valorServicos', e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="form-group">
              <label>Alíquota (%) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.servico.aliquota}
                onChange={(e) => handleInputChange('servico', 'aliquota', e.target.value)}
                placeholder="5.00"
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Item Lista Serviço *</label>
              <input
                type="text"
                value={formData.servico.itemListaServico}
                onChange={(e) => handleInputChange('servico', 'itemListaServico', e.target.value)}
                placeholder="Ex: 01.01"
                required
              />
            </div>
            <div className="form-group">
              <label>Código Tributação Município *</label>
              <input
                type="text"
                value={formData.servico.codigoTributacaoMunicipio}
                onChange={(e) => handleInputChange('servico', 'codigoTributacaoMunicipio', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-group-checkbox">
            <label>
              <input
                type="checkbox"
                checked={formData.servico.issRetido}
                onChange={(e) => handleInputChange('servico', 'issRetido', e.target.checked)}
              />
              ISS Retido
            </label>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Criando...' : 'Criar NFS-e'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewNFSe;
