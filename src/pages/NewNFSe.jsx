import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNFSe as createNFSeExternal } from '../services/nfseService';
import { createNfse as createNfseSupabase } from '../services/nfseSupabaseService';
import { useAuth } from '../contexts/AuthContext';
import './NewNFSe.css';

// Helper to generate a random ID for idIntegracao
const generateIdIntegracao = () => `ID-${Date.now()}`;

const NewNFSe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(null); // For API lookups

  // Effect for CNPJ lookup
  useEffect(() => {
    const cnpj = formData.tomador.cpfCnpj.replace(/\D/g, ''); // Remove non-digits

    if (cnpj.length === 14) {
      const fetchCnpjData = async () => {
        setLookupLoading('cnpj');
        try {
          const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`);
          if (!response.ok) throw new Error('CNPJ não encontrado ou inválido.');
          
          const data = await response.json();
          
          handleInputChange('tomador.razaoSocial', data.razao_social || '');
          handleInputChange('tomador.endereco.cep', data.cep || '');
          handleInputChange('tomador.endereco.logradouro', data.logradouro || '');
          handleInputChange('tomador.endereco.numero', data.numero || '');
          handleInputChange('tomador.endereco.bairro', data.bairro || '');
          handleInputChange('tomador.endereco.descricaoCidade', data.municipio || '');
          handleInputChange('tomador.endereco.estado', data.uf || '');
          // Note: BrasilAPI does not provide tipoLogradouro, tipoBairro, or codigoCidade directly.

        } catch (err) {
          console.error('CNPJ lookup error:', err);
          // Optional: show a small error message to the user
        } finally {
          setLookupLoading(null);
        }
      };

      fetchCnpjData();
    }
  }, [formData.tomador.cpfCnpj]);

  // Effect for CEP lookup
  useEffect(() => {
    const cep = formData.tomador.endereco.cep.replace(/\D/g, ''); // Remove non-digits

    if (cep.length === 8) {
      const fetchCepData = async () => {
        setLookupLoading('cep');
        try {
          const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
          if (!response.ok) throw new Error('CEP não encontrado.');

          const data = await response.json();
          if (data.erro) throw new Error('CEP não encontrado.');

          handleInputChange('tomador.endereco.logradouro', data.logradouro || '');
          handleInputChange('tomador.endereco.bairro', data.bairro || '');
          handleInputChange('tomador.endereco.descricaoCidade', data.localidade || '');
          handleInputChange('tomador.endereco.estado', data.uf || '');
          handleInputChange('tomador.endereco.codigoCidade', data.ibge || '');
          // tipoLogradouro and tipoBairro are not provided by ViaCEP

        } catch (err) {
          console.error('CEP lookup error:', err);
          // Optional: show a small error message to the user
        } finally {
          setLookupLoading(null);
        }
      };

      fetchCepData();
    }
  }, [formData.tomador.endereco.cep]);

  // New state structure based on the provided payload
  const [formData, setFormData] = useState({
    idIntegracao: generateIdIntegracao(),
    prestador: {
      cpfCnpj: '08187168000160', // Pre-filled for demo
    },
    tomador: {
      cpfCnpj: '',
      razaoSocial: '',
      inscricaoMunicipal: '',
      email: '',
      endereco: {
        descricaoCidade: '',
        cep: '',
        tipoLogradouro: '',
        logradouro: '',
        tipoBairro: '',
        codigoCidade: '',
        complemento: '',
        estado: '',
        numero: '',
        bairro: '',
      },
    },
    servico: [
      {
        codigo: '14.10', // Same as codigoTributacao for simplicity
        codigoTributacao: '14.10',
        discriminacao: '',
        cnae: '7490104',
        iss: {
          tipoTributacao: 7,
          exigibilidade: 1,
          aliquota: 3,
        },
        valor: {
          servico: 0,
          descontoCondicionado: 0,
          descontoIncondicionado: 0,
        },
      },
    ],
  });

  // Updated input handler for nested structures and arrays
  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      let current = prev;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        const nextKey = keys[i+1];
        // If the next key is a number, we are in an array
        if (!isNaN(parseInt(nextKey, 10))) {
          current[key] = [...current[key]];
        } else {
          current[key] = { ...current[key] };
        }
        current = current[key];
      }
      current[keys[keys.length - 1]] = value;
      return { ...prev };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // The payload is an array with the form data object
      const payload = [formData];

      // 1. Create the invoice using the external service
      const result = await createNFSeExternal(payload);
      console.log('NFS-e created via external API:', result);

      // 2. Save a copy to our Supabase database
      try {
        const nfseToSave = {
          nfse_data: formData, // Save the sent payload
          protocol: result.protocol,
          id_integracao: formData.idIntegracao,
          status: result.message || 'Em processamento',
        };
        await createNfseSupabase(nfseToSave, user.id);
        console.log('NFS-e copy saved to Supabase.');
      } catch (supabaseError) {
        console.error('Failed to save NFS-e copy to Supabase:', supabaseError);
      }
      
      // 3. Redirect on success
      // Redirecting to home page as the response indicates processing
      navigate('/');

    } catch (err) {
      console.error('Error creating NFS-e:', err);
      const errorMessage = err.message || (err.erros && err.erros.join(', ')) || 'Erro desconhecido.';
      setError(`Erro ao criar NFS-e: ${errorMessage}`);
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
        {/* ID Integracao - Hidden but can be shown for debugging */}
        <input type="hidden" value={formData.idIntegracao} readOnly />

        {/* Prestador Section (Simplified) */}
        <section className="form-section">
          <h3>Dados do Prestador</h3>
          <div className="form-group">
            <label>CNPJ do Prestador</label>
            <input
              type="text"
              value={formData.prestador.cpfCnpj}
              readOnly // Assuming this is fixed for the user
              className="readonly-input"
            />
          </div>
        </section>

        {/* Tomador Section */}
        <section className="form-section">
          <h3>Dados do Tomador</h3>
          <div className="form-row">
            <div className="form-group">
              <label>CPF/CNPJ *</label>
              <div className="input-with-loader">
                <input
                  type="text"
                  value={formData.tomador.cpfCnpj}
                  onChange={(e) => handleInputChange('tomador.cpfCnpj', e.target.value)}
                  required
                />
                {lookupLoading === 'cnpj' && <div className="spinner-small"></div>}
              </div>
            </div>
            <div className="form-group">
              <label>Razão Social/Nome *</label>
              <input
                type="text"
                value={formData.tomador.razaoSocial}
                onChange={(e) => handleInputChange('tomador.razaoSocial', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
             <div className="form-group">
              <label>Inscrição Municipal</label>
              <input
                type="text"
                value={formData.tomador.inscricaoMunicipal}
                onChange={(e) => handleInputChange('tomador.inscricaoMunicipal', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={formData.tomador.email}
                onChange={(e) => handleInputChange('tomador.email', e.target.value)}
                required
              />
            </div>
          </div>
        </section>

        {/* Endereço Tomador Section */}
        <section className="form-section">
          <h4>Endereço do Tomador</h4>
          <div className="form-row">
            <div className="form-group">
              <label>CEP *</label>
              <div className="input-with-loader">
                <input
                  type="text"
                  value={formData.tomador.endereco.cep}
                  onChange={(e) => handleInputChange('tomador.endereco.cep', e.target.value)}
                  required
                />
                {lookupLoading === 'cep' && <div className="spinner-small"></div>}
              </div>
            </div>
            <div className="form-group">
              <label>Cidade *</label>
              <input
                type="text"
                value={formData.tomador.endereco.descricaoCidade}
                onChange={(e) => handleInputChange('tomador.endereco.descricaoCidade', e.target.value)}
                required
              />
            </div>
             <div className="form-group">
              <label>Código da Cidade (IBGE) *</label>
              <input
                type="text"
                value={formData.tomador.endereco.codigoCidade}
                onChange={(e) => handleInputChange('tomador.endereco.codigoCidade', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo Logradouro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.tipoLogradouro}
                onChange={(e) => handleInputChange('tomador.endereco.tipoLogradouro', e.target.value)}
                placeholder="Ex: Rua, Avenida"
                required
              />
            </div>
            <div className="form-group flex-2">
              <label>Logradouro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.logradouro}
                onChange={(e) => handleInputChange('tomador.endereco.logradouro', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Número *</label>
              <input
                type="text"
                value={formData.tomador.endereco.numero}
                onChange={(e) => handleInputChange('tomador.endereco.numero', e.target.value)}
                required
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Tipo Bairro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.tipoBairro}
                onChange={(e) => handleInputChange('tomador.endereco.tipoBairro', e.target.value)}
                 placeholder="Ex: Centro, Bairro"
                required
              />
            </div>
            <div className="form-group">
              <label>Bairro *</label>
              <input
                type="text"
                value={formData.tomador.endereco.bairro}
                onChange={(e) => handleInputChange('tomador.endereco.bairro', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>UF *</label>
              <input
                type="text"
                value={formData.tomador.endereco.estado}
                onChange={(e) => handleInputChange('tomador.endereco.estado', e.target.value)}
                maxLength="2"
                required
              />
            </div>
          </div>
           <div className="form-group">
              <label>Complemento</label>
              <input
                type="text"
                value={formData.tomador.endereco.complemento}
                onChange={(e) => handleInputChange('tomador.endereco.complemento', e.target.value)}
              />
            </div>
        </section>

        {/* Serviço Section (for the first service) */}
        <section className="form-section">
          <h3>Dados do Serviço</h3>
          <div className="form-group">
            <label>Discriminação do Serviço *</label>
            <textarea
              value={formData.servico[0].discriminacao}
              onChange={(e) => handleInputChange('servico.0.discriminacao', e.target.value)}
              rows="4"
              placeholder="Descrição detalhada do serviço prestado"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Valor do Serviço (R$) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.servico[0].valor.servico}
                onChange={(e) => handleInputChange('servico.0.valor.servico', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
            <div className="form-group">
              <label>Aliquota ISS (%) *</label>
              <input
                type="number"
                step="0.01"
                value={formData.servico[0].iss.aliquota}
                onChange={(e) => handleInputChange('servico.0.iss.aliquota', parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>
           <div className="form-row">
            <div className="form-group">
              <label>Código do Serviço *</label>
              <input
                type="text"
                value={formData.servico[0].codigo}
                onChange={(e) => handleInputChange('servico.0.codigo', e.target.value)}
                placeholder="Ex: 14.10"
                required
              />
            </div>
            <div className="form-group">
              <label>CNAE</label>
              <input
                type="text"
                value={formData.servico[0].cnae}
                onChange={(e) => handleInputChange('servico.0.cnae', e.target.value)}
              />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => navigate('/')}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Enviando...' : 'Criar NFS-e'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewNFSe;
