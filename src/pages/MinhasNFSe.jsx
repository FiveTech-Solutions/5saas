import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  consultarNotasPorPeriodo,
  baixarPdfNota,
  baixarXmlNota,
  enviarNotaPorEmail,
  cancelarNota
} from '../services/nfseService';
import { useAuth } from '../contexts/AuthContext';
import './MinhasNFSe.css';
import {
  Search,
  FilterList,
  Download,
  Visibility,
  Cancel,
  CheckCircle,
  Pending,
  Error as ErrorIcon,
  CalendarToday,
  Receipt,
  Business,
  AttachMoney,
  Email,
  Description,
  GetApp
} from '@mui/icons-material';

const MinhasNFSe = () => {
  const { user } = useAuth();

  // Estados para filtros e dados
  const [notas, setNotas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({
    dataInicial: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dataFinal: format(new Date(), 'yyyy-MM-dd'),
    situacao: '',
    tomador: ''
  });
  const [paginacao, setPaginacao] = useState({
    hashProximaPagina: null,
    temMais: false
  });

  // Estados para ações das notas
  const [emailModal, setEmailModal] = useState({ aberto: false, nota: null });
  const [cancelModal, setCancelModal] = useState({ aberto: false, nota: null });
  const [emailDestinos, setEmailDestinos] = useState('');
  const [motivoCancelamento, setMotivoCancelamento] = useState('Cancelamento a pedido do Prestador');
  const [codigoCancelamento, setCodigoCancelamento] = useState('9');
  const [processandoAcao, setProcessandoAcao] = useState(false);

  // Opções de situação
  const situacoes = [
    { value: '', label: 'Todas as situações' },
    { value: 'CONCLUIDO', label: 'Concluído' },
    { value: 'PROCESSANDO', label: 'Processando' },
    { value: 'ERRO', label: 'Erro' },
    { value: 'CANCELADO', label: 'Cancelado' }
  ];

  // Funções de ação das notas
  const handleBaixarPdf = async (nota) => {
    try {
      setProcessandoAcao(true);
      await baixarPdfNota(nota.id);
    } catch (error) {
      setError('Erro ao baixar PDF: ' + error.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleBaixarXml = async (nota) => {
    try {
      setProcessandoAcao(true);
      await baixarXmlNota(nota.id);
    } catch (error) {
      setError('Erro ao baixar XML: ' + error.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleEnviarEmail = async () => {
    if (!emailDestinos.trim()) {
      setError('Por favor, informe ao menos um destinatário');
      return;
    }

    try {
      setProcessandoAcao(true);
      const destinatarios = emailDestinos.split(',').map(email => email.trim());
      await enviarNotaPorEmail(emailModal.nota.id, destinatarios);
      setEmailModal({ aberto: false, nota: null });
      setEmailDestinos('');
      setError('');
      // Mostrar sucesso (você pode adicionar um toast aqui)
      console.log('Email enviado com sucesso!');
    } catch (error) {
      setError('Erro ao enviar email: ' + error.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  const handleCancelarNota = async () => {
    try {
      setProcessandoAcao(true);
      await cancelarNota(cancelModal.nota.id, codigoCancelamento, motivoCancelamento);
      setCancelModal({ aberto: false, nota: null });
      setMotivoCancelamento('Cancelamento a pedido do Prestador');
      setCodigoCancelamento('9');
      setError('');
      // Atualizar a lista de notas
      buscarNotas();
      console.log('Nota cancelada com sucesso!');
    } catch (error) {
      setError('Erro ao cancelar nota: ' + error.message);
    } finally {
      setProcessandoAcao(false);
    }
  };

  // Função para buscar notas
  const buscarNotas = async (resetPagina = true) => {
    setLoading(true);
    setError('');

    try {
      // Para desenvolvimento, vamos usar o CNPJ da empresa cadastrada
      // Em produção, isso deve vir dos dados da empresa do usuário

      const response = await consultarNotasPorPeriodo({
        cpfCnpj: '08187168000160', dataInicial: filtros.dataInicial || null,
        dataFinal: filtros.dataFinal || null,
        hashProximaPagina: resetPagina ? null : paginacao.hashProximaPagina
      });

      let notasFiltradas = response.notas || [];

      // Aplicar filtros locais
      if (filtros.situacao) {
        notasFiltradas = notasFiltradas.filter(nota => nota.situacao === filtros.situacao);
      }

      if (filtros.tomador) {
        notasFiltradas = notasFiltradas.filter(nota =>
          nota.tomador && nota.tomador.includes(filtros.tomador)
        );
      }

      if (resetPagina) {
        setNotas(notasFiltradas);
      } else {
        setNotas(prev => [...prev, ...notasFiltradas]);
      }

      setPaginacao({
        hashProximaPagina: response.hashProximaPagina,
        temMais: !!response.hashProximaPagina
      });
    } catch (err) {
      setError('Erro ao buscar notas: ' + err.message);
      console.error('Erro na busca:', err);
    } finally {
      setLoading(false);
    }
  };

  // Simular API call (temporário - remover quando usar a API real)
  const consultarNotasPorPeriodo_Mock = async (params) => {
    // Mock data para demonstração
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      hashProximaPagina: Math.random() > 0.7 ? "next_page_hash" : null,
      notas: [
        {
          id: "5adf347aa679c716ea3c5234",
          idIntegracao: "9228980",
          emissao: "07/05/2018",
          tipoAutorizacao: "WEBSERVICE",
          situacao: "CONCLUIDO",
          prestador: "18189174000160",
          tomador: "18189174000160",
          valorServico: 10.5,
          numeroNfse: "3960",
          protocoloPrefeitura: "123",
          serie: "1",
          lote: 173283,
          codigoVerificacao: "54D1D813E",
          autorizacao: "07/05/2018",
          mensagem: "RPS Autorizada com sucesso",
          pdf: "https://api.sandbox.plugnotas.com.br/nfse/imprimir/5afb267d9b0a890277ee08fe",
          xml: "https://api.sandbox.plugnotas.com.br/nfse/xml/5afb267d9b0a890277ee08fe",
          numero: 123
        },
        {
          id: "5adf347aa679c716ea3c5235",
          idIntegracao: "9228981",
          emissao: "08/05/2018",
          tipoAutorizacao: "WEBSERVICE",
          situacao: "PROCESSANDO",
          prestador: "18189174000160",
          tomador: "12345678901234",
          valorServico: 25.75,
          numeroNfse: "3961",
          protocoloPrefeitura: "124",
          serie: "1",
          lote: 173284,
          codigoVerificacao: "54D1D813F",
          autorizacao: "08/05/2018",
          mensagem: "RPS em processamento",
          pdf: null,
          xml: null,
          numero: 124
        },
        // ... mais notas mock
      ]
    };
  };

  // Carregar notas ao montar componente
  useEffect(() => {
    buscarNotas();
  }, []);

  // Função para aplicar filtros
  const aplicarFiltros = () => {
    buscarNotas(true);
  };

  // Função para resetar filtros
  const resetarFiltros = () => {
    setFiltros({
      dataInicial: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
      dataFinal: format(new Date(), 'yyyy-MM-dd'),
      situacao: '',
      tomador: ''
    });
  };

  // Função para carregar mais notas
  const carregarMais = () => {
    if (paginacao.temMais && !loading) {
      buscarNotas(false);
    }
  };

  // Função para obter ícone da situação
  const getIconeSituacao = (situacao) => {
    switch (situacao) {
      case 'CONCLUIDO':
        return <CheckCircle className="status-icon status-concluido" />;
      case 'PROCESSANDO':
        return <Pending className="status-icon status-processando" />;
      case 'ERRO':
        return <ErrorIcon className="status-icon status-erro" />;
      case 'CANCELADO':
        return <Cancel className="status-icon status-cancelado" />;
      default:
        return <Receipt className="status-icon" />;
    }
  };

  // Função para formatar moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  };

  return (
    <div className="minhas-nfse">
      <div className="page-header">
        <h1>
          <Receipt className="page-icon" />
          Minhas NFS-e
        </h1>
        <p className="page-description">
          Consulte e gerencie suas Notas Fiscais de Serviço Eletrônicas
        </p>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <div className="filtros-header">
          <h3>
            <FilterList />
            Filtros de Busca
          </h3>
        </div>

        <div className="filtros-grid">
          <div className="filtro-grupo">
            <label htmlFor="dataInicial">
              <CalendarToday className="input-icon" />
              Data Inicial
            </label>
            <input
              id="dataInicial"
              type="date"
              value={filtros.dataInicial}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataInicial: e.target.value }))}
              className="filtro-input"
            />
          </div>

          <div className="filtro-grupo">
            <label htmlFor="dataFinal">
              <CalendarToday className="input-icon" />
              Data Final
            </label>
            <input
              id="dataFinal"
              type="date"
              value={filtros.dataFinal}
              onChange={(e) => setFiltros(prev => ({ ...prev, dataFinal: e.target.value }))}
              className="filtro-input"
            />
          </div>

          <div className="filtro-grupo">
            <label htmlFor="situacao">Situação</label>
            <select
              id="situacao"
              value={filtros.situacao}
              onChange={(e) => setFiltros(prev => ({ ...prev, situacao: e.target.value }))}
              className="filtro-input"
            >
              {situacoes.map(opcao => (
                <option key={opcao.value} value={opcao.value}>
                  {opcao.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filtro-grupo">
            <label htmlFor="tomador">
              <Business className="input-icon" />
              Tomador (CPF/CNPJ)
            </label>
            <input
              id="tomador"
              type="text"
              placeholder="Digite CPF ou CNPJ"
              value={filtros.tomador}
              onChange={(e) => setFiltros(prev => ({ ...prev, tomador: e.target.value }))}
              className="filtro-input"
            />
          </div>
        </div>

        <div className="filtros-acoes">
          <button onClick={aplicarFiltros} className="btn-primary" disabled={loading}>
            <Search />
            Buscar
          </button>
          <button onClick={resetarFiltros} className="btn-secondary">
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="error-message">
          <ErrorIcon />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && notas.length === 0 && (
        <div className="loading">
          <div className="loading-spinner"></div>
          Carregando notas...
        </div>
      )}

      {/* Lista de Notas */}
      {notas.length > 0 && (
        <div className="notas-container">
          <div className="notas-header">
            <h3>Resultados ({notas.length} nota{notas.length !== 1 ? 's' : ''})</h3>
          </div>

          <div className="notas-grid">
            {notas.map(nota => (
              <div key={nota.id} className="nota-card">
                <div className="nota-header">
                  <div className="nota-numero">
                    <Receipt />
                    NFS-e #{nota.numeroNfse}
                  </div>
                  <div className="nota-situacao">
                    {getIconeSituacao(nota.situacao)}
                    <span className={`situacao-text situacao-${nota.situacao?.toLowerCase()}`}>
                      {nota.situacao}
                    </span>
                  </div>
                </div>

                <div className="nota-info">
                  <div className="info-item">
                    <strong>Emissão:</strong>
                    <span>{nota.emissao}</span>
                  </div>
                  <div className="info-item">
                    <strong>Valor:</strong>
                    <span className="valor">{formatarMoeda(nota.valorServico)}</span>
                  </div>
                  <div className="info-item">
                    <strong>Tomador:</strong>
                    <span>{nota.tomador}</span>
                  </div>
                  {nota.protocoloPrefeitura && (
                    <div className="info-item">
                      <strong>Protocolo:</strong>
                      <span>{nota.protocoloPrefeitura}</span>
                    </div>
                  )}
                </div>

                <div className="nota-acoes">
                  <button
                    className="btn-acao btn-visualizar"
                    title="Visualizar Detalhes"
                  >
                    <Visibility />
                  </button>

                  <button
                    className="btn-acao btn-download"
                    title="Baixar PDF"
                    onClick={() => handleBaixarPdf(nota)}
                    disabled={processandoAcao}
                  >
                    <GetApp />
                  </button>

                  <button
                    className="btn-acao btn-xml"
                    title="Baixar XML"
                    onClick={() => handleBaixarXml(nota)}
                    disabled={processandoAcao}
                  >
                    <Description />
                  </button>

                  <button
                    className="btn-acao btn-email"
                    title="Enviar por Email"
                    onClick={() => setEmailModal({ aberto: true, nota })}
                    disabled={processandoAcao}
                  >
                    <Email />
                  </button>

                  {nota.situacao === 'CONCLUIDO' && (
                    <button
                      className="btn-acao btn-cancelar"
                      title="Cancelar Nota"
                      onClick={() => setCancelModal({ aberto: true, nota })}
                      disabled={processandoAcao}
                    >
                      <Cancel />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Paginação */}
          {paginacao.temMais && (
            <div className="paginacao">
              <button
                onClick={carregarMais}
                className="btn-carregar-mais"
                disabled={loading}
              >
                {loading ? 'Carregando...' : 'Carregar Mais'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Sem resultados */}
      {!loading && notas.length === 0 && !error && (
        <div className="sem-resultados">
          <Receipt className="sem-resultados-icon" />
          <h3>Nenhuma nota encontrada</h3>
          <p>Tente ajustar os filtros de busca ou verificar o período selecionado.</p>
        </div>
      )}

      {/* Modal de Email */}
      {emailModal.aberto && (
        <div className="modal-overlay" onClick={() => setEmailModal({ aberto: false, nota: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Enviar NFSe por Email</h3>
              <button
                className="modal-close"
                onClick={() => setEmailModal({ aberto: false, nota: null })}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p><strong>Nota:</strong> {emailModal.nota?.numeroNfse || emailModal.nota?.numero}</p>
              <p><strong>Emissão:</strong> {emailModal.nota?.emissao}</p>

              <div className="form-group">
                <label>Destinatários (separados por vírgula):</label>
                <textarea
                  value={emailDestinos}
                  onChange={(e) => setEmailDestinos(e.target.value)}
                  placeholder="exemplo@email.com, outro@email.com"
                  rows={3}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setEmailModal({ aberto: false, nota: null })}
                disabled={processandoAcao}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleEnviarEmail}
                disabled={processandoAcao || !emailDestinos.trim()}
              >
                {processandoAcao ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cancelamento */}
      {cancelModal.aberto && (
        <div className="modal-overlay" onClick={() => setCancelModal({ aberto: false, nota: null })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Cancelar NFSe</h3>
              <button
                className="modal-close"
                onClick={() => setCancelModal({ aberto: false, nota: null })}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p><strong>Nota:</strong> {cancelModal.nota?.numeroNfse || cancelModal.nota?.numero}</p>
              <p><strong>Emissão:</strong> {cancelModal.nota?.emissao}</p>
              <p><strong>Valor:</strong> R$ {cancelModal.nota?.valorServico?.toFixed(2)}</p>

              <div className="form-group">
                <label>Código de Cancelamento:</label>
                <select
                  value={codigoCancelamento}
                  onChange={(e) => setCodigoCancelamento(e.target.value)}
                >
                  <option value="1">1 - Erro na Emissão</option>
                  <option value="2">2 - Serviço não Prestado</option>
                  <option value="9">9 - Outros</option>
                </select>
              </div>

              <div className="form-group">
                <label>Motivo do Cancelamento:</label>
                <textarea
                  value={motivoCancelamento}
                  onChange={(e) => setMotivoCancelamento(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento"
                  rows={3}
                />
              </div>

              <div className="alert-warning">
                <strong>Atenção:</strong> Esta ação não pode ser desfeita. A nota será cancelada permanentemente.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setCancelModal({ aberto: false, nota: null })}
                disabled={processandoAcao}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={handleCancelarNota}
                disabled={processandoAcao || !motivoCancelamento.trim()}
              >
                {processandoAcao ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinhasNFSe;
