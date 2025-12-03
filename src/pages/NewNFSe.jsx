import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createNFSe as createNFSeExternal } from '../services/nfseService';
import { createNfse as createNfseSupabase } from '../services/nfseSupabaseService';
import { getCustomers } from '../services/customerService';
import { getCompanyDetailsByCnpj, registerTomadorPlugNotas, getTomadorPlugNotas, registerServicoPlugNotas, getServicoPlugNotas } from '../services/plugnotasService';
import { getAddressFromCEP } from '../services/viaCepService';
import { useAuth } from '../contexts/AuthContext';
import { useAppState } from '../contexts/StateContext';
import { useToast } from '../contexts/ToastContext';
import CustomerSelector from '../components/CustomerSelector';
import AddCustomerModal from '../components/AddCustomerModal';
import { useIMask } from 'react-imask';
import logger from '../utils/logger';
import { nfseSchema } from '../schemas/nfseSchema';
import './NewNFSe.css';

const generateIdIntegracao = () => `ID-${Date.now()}`;

const NewNFSe = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPageData, setPageData } = useAppState();
  const toast = useToast();

  const pageState = getPageData('newNFSe') || {};

  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [pageLoading, setPageLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [isCustomerModalOpen, setCustomerModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(pageState.selectedCustomer || null);
  const [isTomadorRegistered, setIsTomadorRegistered] = useState(false);
  const [isServicoRegistered, setIsServicoRegistered] = useState(false);

  const [formData, setFormData] = useState(pageState.formData || {
    idIntegracao: generateIdIntegracao(),
    prestador: { cpfCnpj: '' },
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
        idIntegracaoServico: '',
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
      return { mask: '000.000.000-00', lazy: false, unmask: true };
    }
    return { mask: '00.000.000/0000-00', lazy: false, unmask: true };
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
    if (cleanedCpfCnpj.length !== 11 && cleanedCpfCnpj.length !== 14) {
      setIsTomadorRegistered(false);
      toast.warning('CPF/CNPJ inválido. Por favor, insira um CPF ou CNPJ válido.');
      return;
    }

    try {
      setLoading(true);
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
        toast.info('Tomador encontrado na PlugNotas.');
      } else {
        setIsTomadorRegistered(false);
        toast.info('Tomador não encontrado na PlugNotas. Preencha os dados para registro.');
      }
    } catch (err) {
      logger.error('Error fetching tomador from PlugNotas:', err);
      toast.error(err.message || 'Erro ao consultar tomador na PlugNotas.');
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
          }],
        }));
        toast.info('Serviço encontrado na PlugNotas.');
      } else {
        setIsServicoRegistered(false);
        toast.info('Serviço não encontrado na PlugNotas. Preencha os dados para registro.');
      }
    } catch (err) {
      logger.error('Error fetching service from PlugNotas:', err);
      toast.error(err.message || 'Erro ao consultar serviço na PlugNotas.');
      setIsServicoRegistered(false);
    } finally {
      setLoading(false);
    }
  };


  const prevFormDataRef = useRef();
  const prevSelectedCustomerRef = useRef();

  useEffect(() => {
    if (JSON.stringify(formData) !== JSON.stringify(prevFormDataRef.current) ||
      JSON.stringify(selectedCustomer) !== JSON.stringify(prevSelectedCustomerRef.current)) {
      setPageData('newNFSe', { formData, selectedCustomer });
      prevFormDataRef.current = formData;
      prevSelectedCustomerRef.current = selectedCustomer;
    }
  }, [formData, selectedCustomer, setPageData]);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setPageLoading(true);
        const [customerList, plugnotasCompanyData] = await Promise.all([
          getCustomers(),
          getCompanyDetailsByCnpj('08187168000160')
        ]);

        if (!plugnotasCompanyData || !plugnotasCompanyData.cpf_cnpj) {
          toast.error('Não foi possível carregar os dados do prestador da PlugNotas.');
          setPageLoading(false);
          return;
        }

        setCustomers(customerList);

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
        logger.error('Failed to load initial data:', err);
        toast.error('Falha ao carregar dados iniciais. Tente novamente.');
      } finally {
        setPageLoading(false);
      }
    };
    loadInitialData();
  }, [toast]);

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
          descricaoCidade: customer.endereco?.cidade || '',
        },
      },
    }));
    toast.info(`Cliente ${customer.razao_social} selecionado.`);
  };

  const handleCustomerCreated = (newCustomer) => {
    setCustomers(prev => [...prev, newCustomer].sort((a, b) => a.razao_social.localeCompare(b.razao_social)));
    handleSelectCustomer(newCustomer);
    toast.success('Cliente criado e selecionado com sucesso!');
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

    if (formErrors[path]) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[path];
        return newErrors;
      });
    }
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
      toast.success('Endereço encontrado e preenchido!');
    } else {
      toast.warning('CEP não encontrado.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const tomador = formData.tomador;
    const servico = formData.servico[0];

    try {
      const dataToValidate = {
        ...formData,
        servico: formData.servico.map(s => ({
          ...s,
          valor: {
            ...s.valor,
            servico: parseFloat(s.valor.servico) || 0
          }
        }))
      };

      nfseSchema.parse(dataToValidate);
      setFormErrors({});
    } catch (err) {
      if (err.errors) {
        const newErrors = {};
        err.errors.forEach(error => {
          const path = error.path.join('.');
          newErrors[path] = error.message;
        });
        setFormErrors(newErrors);
        toast.warning('Por favor, corrija os erros no formulário.');
        setLoading(false);
        return;
      }
    }

    if (!isServicoRegistered && !servico.idIntegracaoServico) {
      toast.warning('Por favor, preencha o ID de Integração do Serviço para registrar um novo serviço.');
      setLoading(false);
      return;
    }

    try {
      if (!isTomadorRegistered) {
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
            tipoLogradouro: tomador.endereco.tipoLogradouro || 'Rua',
            codigoPais: tomador.endereco.codigoPais || '1058',
            complemento: tomador.endereco.complemento || '',
            descricaoCidade: tomador.endereco.descricaoCidade,
            descricaoPais: tomador.endereco.descricaoPais || 'Brasil',
            tipoBairro: tomador.endereco.tipoBairro || 'Bairro',
          },
          inscricaoEstadual: tomador.inscricaoEstadual || '',
          inscricaoMunicipal: tomador.inscricaoMunicipal || '',
          nomeFantasia: tomador.nomeFantasia || tomador.razaoSocial,
        };
        await registerTomadorPlugNotas(tomadorPayload);
        setIsTomadorRegistered(true);
        toast.success('Tomador registrado com sucesso na PlugNotas!');
      }

      if (!isServicoRegistered) {
        setLoading(true);
        const servicoPayload = {
          codigo: servico.codigo,
          idIntegracao: servico.idIntegracaoServico,
          discriminacao: servico.discriminacao,
          codigoTributacao: servico.codigoTributacao,
          cnae: servico.cnae,
          iss: servico.iss,
          valor: {
            servico: parseFloat(servico.valor.servico),
            baseCalculo: parseFloat(servico.valor.servico),
          },
        };
        await registerServicoPlugNotas(servicoPayload);
        setIsServicoRegistered(true);
        toast.success('Serviço registrado com sucesso na PlugNotas!');
      }

      const servicoValor = parseFloat(formData.servico[0].valor.servico);
      if (isNaN(servicoValor)) {
        throw new Error('O valor do serviço não é um número válido.');
      }

      const payload = [{
        ...formData,
        servico: [{
          ...formData.servico[0],
          valor: {
            servico: servicoValor,
            descontoCondicionado: formData.servico[0].valor.descontoCondicionado || 0,
            descontoIncondicionado: formData.servico[0].valor.descontoIncondicionado || 0,
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

      toast.success('NFS-e enviada com sucesso!');
      navigate('/');
    } catch (err) {
      const errorMessage = err.message || (err.erros && err.erros.join(', ')) || 'Erro desconhecido.';
      toast.error(`Erro ao criar NFS-e: ${errorMessage}`);
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
                  onBlur={handleTomadorCpfCnpjBlur}
                  onChange={() => handleInputChange('tomador.cpfCnpj', tomadorCpfCnpjMaskRef.current.unmaskedValue)}
                  required
                  readOnly={isTomadorLocked || isTomadorRegistered}
                  className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : (formErrors['tomador.cpfCnpj'] ? 'input-error' : '')}
                />
                {formErrors['tomador.cpfCnpj'] && <span className="error-text">{formErrors['tomador.cpfCnpj']}</span>}
              </div>
              <div className="form-group">
                <label>Razão Social/Nome *</label>
                <input type="text" value={formData.tomador.razaoSocial} onChange={(e) => handleInputChange('tomador.razaoSocial', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : (formErrors['tomador.razaoSocial'] ? 'input-error' : '')} />
                {formErrors['tomador.razaoSocial'] && <span className="error-text">{formErrors['tomador.razaoSocial']}</span>}
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input type="email" value={formData.tomador.email} onChange={(e) => handleInputChange('tomador.email', e.target.value)} required readOnly={isTomadorLocked || isTomadorRegistered} className={(isTomadorLocked || isTomadorRegistered) ? 'readonly-input' : (formErrors['tomador.email'] ? 'input-error' : '')} />
                {formErrors['tomador.email'] && <span className="error-text">{formErrors['tomador.email']}</span>}
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
                className={isServicoRegistered ? 'readonly-input' : (formErrors['servico.0.discriminacao'] ? 'input-error' : '')}
              />
              {formErrors['servico.0.discriminacao'] && <span className="error-text">{formErrors['servico.0.discriminacao']}</span>}
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
                  className={isServicoRegistered ? 'readonly-input' : (formErrors['servico.0.valor.servico'] ? 'input-error' : '')}
                />
                {formErrors['servico.0.valor.servico'] && <span className="error-text">{formErrors['servico.0.valor.servico']}</span>}
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
