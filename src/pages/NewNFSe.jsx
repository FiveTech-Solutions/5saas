import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createNFSe as createNFSeExternal } from '../services/nfseService';
import { createNfse as createNfseSupabase } from '../services/nfseSupabaseService';
import { getCustomers } from '../services/customerService';
import { getCompanyDetailsByCnpj, registerTomadorPlugNotas, getTomadorPlugNotas, registerServicoPlugNotas, getServicoPlugNotas } from '../services/plugnotasService'; // Import new functions
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
  const [success, setSuccess] = useState(null); // New state for success messages
  const [pageLoading, setPageLoading] = useState(true); // For initial data load

  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(pageState.selectedCustomer || null);
  const [isTomadorRegistered, setIsTomadorRegistered] = useState(false);
  const [isServicoRegistered, setIsServicoRegistered] = useState(false); // New state for service registration
    
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
        idIntegracaoServico: '', // New field for service integration ID
        codigo: '14.10', codigoTributacao: '14.10', discriminacao: '',
        cnae: '7490104', iss: { tipoTributacao: 7, exigibilidade: 1, aliquota: 3 },
        valor: { servico: 0, descontoCondicionado: 0, descontoIncondicionado: 0 },
      },
    ],
  });

  // IMask hooks
  const { ref: tomadorCpfCnpjInputRef, maskRef: tomadorCpfCnpjMaskRef } = useIMask((value) => {
    if (!value) return { mask: '' };
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 11) {
      return { mask: '000.000.000-00', lazy: false, unmask: true }; // CPF mask
    }
    return { mask: '00.000.000/0000-00', lazy: false, unmask: true }; // CNPJ mask
  });

  const { ref: servicoValorInputRef, maskRef: servicoValorMaskRef } = useIMask({
    mask: Number,
    scale: 2,
    thousandsSeparator: '.',
    padFractionalZeros: true,
    normalizeZeros: true,
    radix: ',',
    lazy: false,
    unmask: true,
  });

  const handleTomadorCpfCnpjBlur = async (e) => {
    const cpfCnpj = e.target.value;
    const cleanedCpfCnpj = cpfCnpj.replace(/\D/g, '');
    if (cleanedCpfCnpj.length !== 11 && cleanedCpfCnpj.length !== 14) { // Validate for both CPF (11) and CNPJ (14)
      setIsTomadorRegistered(false);
      setError('CPF/CNPJ inválido. Por favor, insira um CPF ou CNPJ válido.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const tomadorDetails = await getTomadorPlugNotas(cleanedCpfCnpj);

      if (tomadorDetails) {
        setIsTomadorRegistered(true);
        setFormData(prev => ({
          ...prev,
          tomador: {
            ...prev.tomador,
            cpfCnpj: tomadorDetails.cpfCnpj || prev.tomador.cpfCnpj,
            razaoSocial: tomadorDetails.razaoSocial || prev.tomador.razaoSocial,
            inscricaoMunicipal: tomadorDetails.inscricaoMunicipal || prev.tomador.inscricaoMunicipal,
            email: tomadorDetails.email || prev.tomador.email,
            endereco: {
              ...prev.tomador.endereco,
              cep: tomadorDetails.endereco?.cep || prev.tomador.endereco?.cep,
              logradouro: tomadorDetails.endereco?.logradouro || prev.tomador.endereco?.logradouro,
              numero: tomadorDetails.endereco?.numero || prev.tomador.endereco?.numero,
              complemento: tomadorDetails.endereco?.complemento || prev.tomador.endereco?.complemento,
              bairro: tomadorDetails.endereco?.bairro || prev.tomador.endereco?.bairro,
              descricaoCidade: tomadorDetails.endereco?.descricaoCidade || prev.tomador.endereco?.descricaoCidade,
              estado: tomadorDetails.endereco?.estado || prev.tomador.endereco?.estado,
              codigoCidade: tomadorDetails.endereco?.codigoCidade || prev.tomador.endereco?.codigoCidade,
            },
          },
        }));
        // If tomador is selected from local customers, it should override PlugNotas data
        // or be merged carefully. For now, PlugNotas data takes precedence if found.
      } else {
        setIsTomadorRegistered(false);
        setError('Tomador não encontrado na PlugNotas. Por favor, preencha os dados para registro.');
      }
    } catch (err) {
      console.error("Erro ao consultar tomador na PlugNotas:", err);
      setError(err.message || 'Erro ao consultar tomador na PlugNotas.');
      setIsTomadorRegistered(false);
    } finally {
      setLoading(false);
    }
  };

  const handleServicoIdIntegracaoBlur = async (e) => {
    const idIntegracaoServico = e.target.value;
    if (!idIntegracaoServico) {
      setIsServicoRegistered(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const servicoDetails = await getServicoPlugNotas(idIntegracaoServico);

      if (servicoDetails) {
        setIsServicoRegistered(true);
        setFormData(prev => ({
          ...prev,
          servico: [{
            ...prev.servico[0],
            idIntegracaoServico: servicoDetails.idIntegracao || idIntegracaoServico,
            codigo: servicoDetails.codigo || prev.servico[0].codigo,
            codigoTributacao: servicoDetails.codigoTributacao || prev.servico[0].codigoTributacao,
            discriminacao: servicoDetails.discriminacao || prev.servico[0].discriminacao,
            cnae: servicoDetails.cnae || prev.servico[0].cnae,
            iss: servicoDetails.iss || prev.servico[0].iss,
            valor: {
              ...prev.servico[0].valor,
              servico: servicoDetails.valor?.servico || prev.servico[0].valor.servico,
            },
            // Map other relevant fields from servicoDetails if needed
          }],
        }));
      } else {
        setIsServicoRegistered(false);
        setError('Serviço não encontrado na PlugNotas. Por favor, preencha os dados para registro.');
      }
    } catch (err) {
      console.error("Erro ao consultar serviço na PlugNotas:", err);
      setError(err.message || 'Erro ao consultar serviço na PlugNotas.');
      setIsServicoRegistered(false);
    } finally {
      setLoading(false);
    }
  };


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

    if (!tomador.cpfCnpj || !tomador.razaoSocial || !tomador.email ||
        !tomador.endereco.cep || !tomador.endereco.logradouro || !tomador.endereco.numero ||
        !tomador.endereco.bairro || !tomador.endereco.descricaoCidade || !tomador.endereco.estado ||
        !tomador.endereco.codigoCidade) { // Added validation for codigoCidade
      setError('Por favor, preencha todos os campos obrigatórios do Tomador, incluindo os detalhes de endereço.');
      setLoading(false);
      return;
    }

    if (!servico.discriminacao || isNaN(servicoValor) || servicoValor <= 0) {
      setError('Por favor, preencha a discriminação do serviço e o valor do serviço (deve ser um número maior que zero).');
      setLoading(false);
      return;
    }

    if (!isServicoRegistered && !servico.idIntegracaoServico) {
      setError('Por favor, preencha o ID de Integração do Serviço para registrar um novo serviço.');
      setLoading(false);
      return;
    }

    try {
      // If tomador is not registered in PlugNotas, attempt to register it
      if (!isTomadorRegistered) {
        setError(null); // Clear previous errors
        setLoading(true);
        const tomadorPayload = {
          cpfCnpj: tomador.cpfCnpj,
          razaoSocial: tomador.razaoSocial,
          email: tomador.email,
          endereco: {
            bairro: tomador.endereco.bairro,
            cep: tomador.endereco.cep,
            codigoCidade: tomador.endereco.codigoCidade,
            estado: tomador.endereco.estado,
            logradouro: tomador.endereco.logradouro,
            numero: tomador.endereco.numero,
            tipoLogradouro: tomador.endereco.tipoLogradouro || 'Rua', // Default if not provided
            codigoPais: tomador.endereco.codigoPais || '1058', // Default
            complemento: tomador.endereco.complemento || '',
            descricaoCidade: tomador.endereco.descricaoCidade,
            descricaoPais: tomador.endereco.descricaoPais || 'Brasil', // Default
            tipoBairro: tomador.endereco.tipoBairro || 'Bairro', // Default
          },
          inscricaoEstadual: tomador.inscricaoEstadual || '',
          inscricaoMunicipal: tomador.inscricaoMunicipal || '',
          nomeFantasia: tomador.nomeFantasia || tomador.razaoSocial,
        };
        await registerTomadorPlugNotas(tomadorPayload);
        setIsTomadorRegistered(true); // Mark as registered for this session
        setSuccess('Tomador registrado com sucesso na PlugNotas! Prosseguindo com a emissão da NFS-e.');
      }

      // If service is not registered in PlugNotas, attempt to register it
      if (!isServicoRegistered) {
        setError(null); // Clear previous errors
        setLoading(true);
        const servicoPayload = {
          codigo: servico.codigo,
          idIntegracao: servico.idIntegracaoServico,
          discriminacao: servico.discriminacao,
          codigoTributacao: servico.codigoTributacao,
          cnae: servico.cnae,
          // Add other mandatory fields for service registration if needed
          // For simplicity, only basic fields are mapped here.
          // Refer to the provided payload for full structure.
          iss: servico.iss,
          valor: {
            servico: parseFloat(servico.valor.servico),
            baseCalculo: parseFloat(servico.valor.servico), // Assuming baseCalculo is same as servico for now
          },
        };
        await registerServicoPlugNotas(servicoPayload);
        setIsServicoRegistered(true); // Mark as registered for this session
        setSuccess('Serviço registrado com sucesso na PlugNotas! Prosseguindo com a emissão da NFS-e.');
      }

      // Proceed with NFSe emission
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
        {success && <div className="alert alert-success"><p>{success}</p></div>}

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
                    onBlur={handleTomadorCpfCnpjBlur} // Call the new handler
                    onChange={() => handleInputChange('tomador.cpfCnpj', tomadorCpfCnpjMaskRef.current.unmaskedValue)}
                    required
                    readOnly={isTomadorLocked || isTomadorRegistered} // Read-only if locked by customer selection or registered
                    className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''}
                  />
                </div>
                <div className="form-group">
                  <label>Razão Social/Nome *</label>
                  <input type="text" value={formData.tomador.razaoSocial} onChange={(e) => handleInputChange('tomador.razaoSocial', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={formData.tomador.email} onChange={(e) => handleInputChange('tomador.email', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>CEP *</label>
                  <input type="text" value={formData.tomador.endereco.cep} onBlur={(e) => handleCepBlur(e.target.value)} onChange={(e) => handleInputChange('tomador.endereco.cep', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Logradouro *</label>
                  <input type="text" value={formData.tomador.endereco.logradouro} onChange={(e) => handleInputChange('tomador.endereco.logradouro', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Número *</label>
                  <input type="text" value={formData.tomador.endereco.numero} onChange={(e) => handleInputChange('tomador.endereco.numero', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Bairro *</label>
                  <input type="text" value={formData.tomador.endereco.bairro} onChange={(e) => handleInputChange('tomador.endereco.bairro', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Cidade *</label>
                  <input type="text" value={formData.tomador.endereco.descricaoCidade} onChange={(e) => handleInputChange('tomador.endereco.descricaoCidade', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
                <div className="form-group">
                  <label>Estado *</label>
                  <input type="text" value={formData.tomador.endereco.estado} onChange={(e) => handleInputChange('tomador.endereco.estado', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : ''} />
                </div>
              </div>
            </section>
            
            <section className="form-section">
              <h3>Dados do Serviço</h3>
              <div className="form-group">
                <label>ID de Integração do Serviço</label>
                <input
                  type="text"
                  value={formData.servico[0].idIntegracaoServico}
                  onChange={(e) => handleInputChange('servico.0.idIntegracaoServico', e.target.value)}
                  onBlur={handleServicoIdIntegracaoBlur}
                  readOnly={isServicoRegistered}
                  className={isServicoRegistered ? 'readonly-input' : ''}
                />
              </div>
              <div className="form-group">
                <label>Discriminação do Serviço *</label>
                <textarea
                  value={formData.servico[0].discriminacao}
                  onChange={(e) => handleInputChange('servico.0.discriminacao', e.target.value)}
                  rows="4"
                  required
                  readOnly={isServicoRegistered}
                  className={isServicoRegistered ? 'readonly-input' : ''}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Valor do Serviço (R$) *</label>
                  <input
                    type="text"
                    ref={servicoValorInputRef}
                    value={formData.servico[0].valor.servico}
                    onChange={() => {
                      const unmasked = servicoValorMaskRef.current.unmaskedValue;
                      const value = unmasked === '' ? 0 : parseFloat(unmasked);
                      handleInputChange('servico.0.valor.servico', value);
                    }}
                    required
                    readOnly={isServicoRegistered}
                    className={isServicoRegistered ? 'readonly-input' : ''}
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
