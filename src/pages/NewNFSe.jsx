import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createNFSe as createNFSeExternal } from '../services/nfseService';
import { createNfse as createNfseSupabase } from '../services/nfseSupabaseService';
import { getCustomers } from '../services/customerService';
import { getCompanyDetailsByCnpj } from '../services/plugnotasService'; // Import getCompanyDetailsByCnpj
import { getAddressFromCEP } from '../services/viaCepService';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/StateContext'; // Import useAppState
import CustomerSelector from '../components/CustomerSelector';
import AddCustomerModal from '../components/AddCustomerModal';
import { useIMask } from 'react-imask'; // Import useIMask
import './NewNFSe.css';

const generateIdIntegracao = () => `ID-${Date.now()}`;

const NewNFSe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPageData, setPageData } = useAppState(); // Use the state hook

  const pageState = getPageData('newNFSe') || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageLoading, setPageLoading] = useState(true); // For initial data load

  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(pageState.selectedCustomer || null);
    
  const [formData, setFormData] = useState(pageState.formData || {
    idIntegracao: generateIdIntegracao(),
    prestador: { cpfCnpj: '' }, // Initially empty
    tomador: {
      cpfCnpj: '', razaoSocial: '', inscricaoMunicipal: '', email: '',
      endereco: {
        descricaoCidade: '', cep: '', tipoLogradouro: '', logradouro: '',
        tipoBairro: '', codigoCidade: '', complemento: '', estado: '',
        numero: '', bairro: '',
      },
    },
    servico: [
      {
        codigo: '14.10', codigoTributacao: '14.10', discriminacao: '',
        cnae: '7490104', iss: { tipoTributacao: 7, exigibilidade: 1, aliquota: 3 },
        valor: { servico: 0, descontoCondicionado: 0, descontoIncondicionado: 0 },
      },
    ],
  });

  // IMask hooks
  const { ref: tomadorCpfCnpjInputRef, maskRef: tomadorCpfCnpjMaskRef } = useIMask({
    mask: '00.000.000/0000-00',
    lazy: false,
    unmask: true,
  });

  const { ref: servicoValorInputRef, maskRef: servicoValorMaskRef } = useIMask({
    mask: 'R$ num',
    blocks: {
      num: {
        mask: Number,
        thousandsSeparator: '.',
        padFractionalZeros: true,
        normalizeZeros: true,
        radix: ',',
        scale: 2,
      },
    },
    lazy: false,
    unmask: true,
  });

  // Refs to store previous state for comparison
  const prevFormDataRef = useRef();
  const prevSelectedCustomerRef = useRef();

  // Save state to context whenever it changes, with deep comparison
  useEffect(() => {
    // Only update if formData or selectedCustomer have actually changed content
    if (JSON.stringify(formData) !== JSON.stringify(prevFormDataRef.current) ||
        JSON.stringify(selectedCustomer) !== JSON.stringify(prevSelectedCustomerRef.current)) {
      setPageData('newNFSe', { formData, selectedCustomer });
      prevFormDataRef.current = formData;
      prevSelectedCustomerRef.current = selectedCustomer;
    }
  }, [formData, selectedCustomer, setPageData]);

  // Load initial data (company and customers)
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setPageLoading(true);
        // Fetch customers and PlugNotas company data in parallel
        const [customerList, plugnotasCompanyData] = await Promise.all([
          getCustomers(),
          getCompanyDetailsByCnpj('08187168000160') // Hardcoded CNPJ for homologation
        ]);

        console.log('PlugNotas Company Data:', plugnotasCompanyData); // Debugging line

        if (!plugnotasCompanyData || !plugnotasCompanyData.cpf_cnpj) {
          setError('Não foi possível carregar os dados do prestador da PlugNotas.');
          setPageLoading(false);
          return;
        }
        
        setCustomers(customerList);

        // Pre-fill prestador data from PlugNotas API
        setFormData(prev => ({
          ...prev,
          prestador: {
            cpfCnpj: plugnotasCompanyData.cpf_cnpj || '',
            razaoSocial: plugnotasCompanyData.razao_social || '',
            nomeFantasia: plugnotasCompanyData.nome || '',
            inscricaoMunicipal: plugnotasCompanyData.inscricao_municipal || '',
            inscricaoEstadual: plugnotasCompanyData.inscricao_estadual || '',
            email: plugnotasCompanyData.email || '',
            telefone: plugnotasCompanyData.telefone ? plugnotasCompanyData.telefone.replace(/\D/g, '') : '',
            endereco: {
              cep: plugnotasCompanyData.endereco?.cep || '',
              logradouro: plugnotasCompanyData.endereco?.logradouro || '',
              numero: plugnotasCompanyData.endereco?.numero || '',
              complemento: plugnotasCompanyData.endereco?.complemento || '',
              bairro: plugnotasCompanyData.endereco?.bairro || '',
              codigoCidade: plugnotasCompanyData.endereco?.codigo_cidade || '',
              descricaoCidade: plugnotasCompanyData.endereco?.municipio || '',
              estado: plugnotasCompanyData.endereco?.uf || '',
              codigoPais: '1058',
              descricaoPais: 'Brasil',
            },
          }
        }));

      } catch (err) {
        console.error("Failed to load initial data", err);
        setError('Falha ao carregar dados. Tente novamente.');
      } finally {
        setPageLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleSelectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setFormData(prev => ({
      ...prev,
      tomador: {
        ...prev.tomador,
        cpfCnpj: customer.cpf_cnpj || '',
        razaoSocial: customer.razao_social || '',
        inscricaoMunicipal: customer.inscricao_municipal || '',
        email: customer.email || '',
        endereco: {
          ...prev.tomador.endereco,
          ...(customer.endereco || {}),
          // Ensure specific fields are mapped correctly if names differ
          descricaoCidade: customer.endereco?.cidade || '',
        },
      },
    }));
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.razao_social.localeCompare(b.razao_social)));
    handleSelectCustomer(newCustomer);
  };

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

  const handleCepBlur = async (cep) => {
    const address = await getAddressFromCEP(cep);
    if (address) {
      setFormData(prev => ({
        ...prev,
        tomador: {
          ...prev.tomador,
          endereco: {
            ...prev.tomador.endereco,
            cep: address.cep,
            logradouro: address.logradouro,
            bairro: address.bairro,
            descricaoCidade: address.localidade,
            estado: address.uf,
            codigoCidade: address.ibge,
          },
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('Dados do Tomador no submit:', formData.tomador);
    // Client-side validation
    const tomador = formData.tomador;
    const servico = formData.servico[0];

    // if (!tomador.cpfCnpj || !tomador.razaoSocial || !tomador.email ||
    //     !tomador.endereco.cep || !tomador.endereco.logradouro || !tomador.endereco.numero ||
    //     !tomador.endereco.bairro || !tomador.endereco.descricaoCidade || !tomador.endereco.estado) {
    //   setError('Por favor, preencha todos os campos obrigatórios do Tomador.');
    //   setLoading(false);
    //   return;
    // }

    if (!servico.discriminacao || !servico.valor.servico || servico.valor.servico <= 0) {
      setError('Por favor, preencha a discriminação do serviço e o valor do serviço (deve ser maior que zero).');
      setLoading(false);
      return;
    }

    try {
      // Ensure servico.valor.servico is a number
      const servicoValor = parseFloat(formData.servico[0].valor.servico);
      if (isNaN(servicoValor)) {
        throw new Error('O valor do serviço não é um número válido.');
      }

      const payload = [{
        ...formData,
        servico: [{
          ...formData.servico[0],
          valor: {
            ...formData.servico[0].valor,
            servico: servicoValor,
          },
        }],
      }];
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

  if (pageLoading) {
    return <div className="loading-state">Carregando configurações...</div>;
  }
  
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
            <div className="form-row">
              <div className="form-group">
                <label>CNPJ do Prestador</label>
                <input type="text" value={formData.prestador.cpfCnpj} readOnly className="readonly-input" />
              </div>
              <div className="form-group">
                <label>Razão Social</label>
                <input type="text" value={formData.prestador.razaoSocial} readOnly className="readonly-input" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Nome Fantasia</label>
                <input type="text" value={formData.prestador.nomeFantasia} readOnly className="readonly-input" />
              </div>
              <div className="form-group">
                <label>Inscrição Municipal</label>
                <input type="text" value={formData.prestador.inscricaoMunicipal} readOnly className="readonly-input" />
              </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                  <label>Inscrição Estadual</label>
                  <input type="text" value={formData.prestador.inscricaoEstadual} readOnly className="readonly-input" />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={formData.prestador.email} readOnly className="readonly-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Telefone</label>
                  <input type="text" value={formData.prestador.telefone} readOnly className="readonly-input" />
                </div>
                <div className="form-group">
                  <label>CEP</label>
                  <input type="text" value={formData.prestador.endereco.cep} readOnly className="readonly-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Logradouro</label>
                  <input type="text" value={formData.prestador.endereco.logradouro} readOnly className="readonly-input" />
                </div>
                <div className="form-group">
                  <label>Número</label>
                  <input type="text" value={formData.prestador.endereco.numero} readOnly className="readonly-input" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bairro</label>
                  <input type="text" value={formData.prestador.endereco.bairro} readOnly className="readonly-input" />
                </div>
                <div className="form-group">
                  <label>Cidade</label>
                  <input type="text" value={formData.prestador.endereco.descricaoCidade} readOnly className="readonly-input" />
                </div>
                <div className="form-group">
                  <label>Estado</label>
                  <input type="text" value={formData.prestador.endereco.estado} readOnly className="readonly-input" />
                </div>
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
                  <input
                    type="text"
                    ref={tomadorCpfCnpjInputRef}
                    value={formData.tomador.cpfCnpj}
                    onChange={() => handleInputChange('tomador.cpfCnpj', tomadorCpfCnpjMaskRef.current.unmaskedValue)}
                    required
                    readOnly={isTomadorLocked}
                    className={isTomadorLocked ? 'readonly-input' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Razão Social/Nome *</label>
                  <input type="text" value={formData.tomador.razaoSocial} onChange={(e) => handleInputChange('tomador.razaoSocial', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={formData.tomador.email} onChange={(e) => handleInputChange('tomador.email', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CEP *</label>
                  <input type="text" value={formData.tomador.endereco.cep} onBlur={(e) => handleCepBlur(e.target.value)} onChange={(e) => handleInputChange('tomador.endereco.cep', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Logradouro *</label>
                  <input type="text" value={formData.tomador.endereco.logradouro} onChange={(e) => handleInputChange('tomador.endereco.logradouro', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Número *</label>
                  <input type="text" value={formData.tomador.endereco.numero} onChange={(e) => handleInputChange('tomador.endereco.numero', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bairro *</label>
                  <input type="text" value={formData.tomador.endereco.bairro} onChange={(e) => handleInputChange('tomador.endereco.bairro', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Cidade *</label>
                  <input type="text" value={formData.tomador.endereco.descricaoCidade} onChange={(e) => handleInputChange('tomador.endereco.descricaoCidade', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Estado *</label>
                  <input type="text" value={formData.tomador.endereco.estado} onChange={(e) => handleInputChange('tomador.endereco.estado', e.target.value)} required readOnly={isTomadorLocked} className={isTomadorLocked ? 'readonly-input' : ''} />
                </div>
              </div>
            </section>
            
            <section className="form-section">
              <h3>Dados do Serviço</h3>
              <div className="form-group">
                <label>Discriminação do Serviço *</label>
                <textarea value={formData.servico[0].discriminacao} onChange={(e) => handleInputChange('servico.0.discriminacao', e.target.value)} rows="4" required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valor do Serviço (R$) *</label>
                  <input
                    type="text"
                    ref={servicoValorInputRef}
                    value={formData.servico[0].valor.servico}
                    onChange={() => handleInputChange('servico.0.valor.servico', servicoValorMaskRef.current.unmaskedValue)}
                    required
                  />
                </div>
              </div>
            </section>
  
            <div className="form-actions">
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
