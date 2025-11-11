import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createNFSe as createNFSeExternal } from '../services/nfseService';
import { createNfse as createNfseSupabase } from '../services/nfseSupabaseService';
import { getCustomers } from '../services/customerService';
import { useAuth } from '../contexts/AuthContext';
import CustomerSelector from '../components/CustomerSelector';
import AddCustomerModal from '../components/AddCustomerModal';
import './NewNFSe.css';

// Helper to generate a random ID for idIntegracao
const generateIdIntegracao = () => `ID-${Date.now()}`;

const NewNFSe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lookupLoading, setLookupLoading] = useState(null);

  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        const customerList = await getCustomers();
        setCustomers(customerList);
      } catch (err) {
        console.error("Failed to load customers", err);
        // Non-critical error, so we don't block the form
      }
    };
    loadCustomers();
  }, []);

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
        codigo: '14.10',
        codigoTributacao: '14.10',
        discriminacao: '',
        cnae: '7490104',
        iss: { tipoTributacao: 7, exigibilidade: 1, aliquota: 3 },
        valor: { servico: 0, descontoCondicionado: 0, descontoIncondicionado: 0 },
      },
    ],
  });

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      tomador: {
        ...prev.tomador, // Keep any fields not in customer object
        cpfCnpj: customer.cpf_cnpj || '',
        razaoSocial: customer.razao_social || '',
        inscricaoMunicipal: customer.inscricao_municipal || '',
        email: customer.email || '',
        endereco: {
          ...prev.tomador.endereco,
          ...customer.endereco, // Merge addresses, customer data takes precedence
        },
      },
    }));
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.razao_social.localeCompare(b.razao_social)));
    handleSelectCustomer(newCustomer);
  };

  // CNPJ/CEP lookups are disabled if a customer is selected
  useEffect(() => {
    if (selectedCustomer) return;
    const cnpj = formData.tomador.cpfCnpj.replace(/\D/g, '');
    if (cnpj.length === 14) { /* ... CNPJ lookup logic ... */ }
  }, [formData.tomador.cpfCnpj, selectedCustomer]);

  useEffect(() => {
    if (selectedCustomer) return;
    const cep = formData.tomador.endereco.cep.replace(/\D/g, '');
    if (cep.length === 8) { /* ... CEP lookup logic ... */ }
  }, [formData.tomador.endereco.cep, selectedCustomer]);

  const handleInputChange = (path, value) => {
    setFormData(prev => {
      const keys = path.split('.');
      let current = { ...prev };
      let ref = current;
      for (let i = 0; i < keys.length - 1; i++) {
        ref[keys[i]] = { ...ref[keys[i]] };
        ref = ref[keys[i]];
      }
      ref[keys[keys.length - 1]] = value;
      return current;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = [formData];
      const result = await createNFSeExternal(payload);
      await createNfseSupabase({
        nfse_data: formData,
        protocol: result.protocol,
        id_integracao: formData.idIntegracao,
        status: result.message || 'Em processamento',
      }, user.id);
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || (err.erros && err.erros.join(', ')) || 'Erro desconhecido.';
      setError(`Erro ao criar NFS-e: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const isTomadorLocked = !!selectedCustomer;

  return (
    <>
      <AddCustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => setCustomerModalOpen(false)}
        onCustomerCreated={handleCustomerCreated}
      />
      <div className="new-nfse-container">
        <div className="form-header">
          <h2>Nova NFS-e</h2>
          <button className="btn-secondary" onClick={() => navigate('/')}>Cancelar</button>
        </div>

        {error && <div className="alert alert-error"><p>{error}</p></div>}

        <form onSubmit={handleSubmit} className="nfse-form">
          <input type="hidden" value={formData.idIntegracao} readOnly />

          <section className="form-section">
            <h3>Dados do Prestador</h3>
            <div className="form-group">
              <label>CNPJ do Prestador</label>
              <input type="text" value={formData.prestador.cpfCnpj} readOnly className="readonly-input" />
            </div>
          </section>

          <section className="form-section">
            <h3>Dados do Tomador</h3>
            <CustomerSelector
              customers={customers}
              onSelectCustomer={handleSelectCustomer}
              onAddNewCustomer={() => setCustomerModalOpen(true)}
            />
            {selectedCustomer && (
              <div className="chip">
                Cliente selecionado: {selectedCustomer.razao_social}
                <button type="button" onClick={() => setSelectedCustomer(null)}>Limpar</button>
              </div>
            )}
            <div className="form-row">
              <div className="form-group">
                <label>CPF/CNPJ *</label>
                <input type="text" value={formData.tomador.cpfCnpj} onChange={(e) => handleInputChange('tomador.cpfCnpj', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
              </div>
              <div className="form-group">
                <label>Razão Social/Nome *</label>
                <input type="text" value={formData.tomador.razaoSocial} onChange={(e) => handleInputChange('tomador.razaoSocial', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
              </div>
            </div>
            {/* ... other tomador fields ... */}
             <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={formData.tomador.email} onChange={(e) => handleInputChange('tomador.email', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
              </div>
            </div>
          </section>
          
          {/* Address and Service sections remain, but could also be populated from customer data */}

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={() => navigate('/')}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Criar NFS-e'}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default NewNFSe;
