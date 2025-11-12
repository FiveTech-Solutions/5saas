import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  getNFSePDF,
  getNFSeXML,
  cancelNFSe,
  sendNFSeByEmail,
} from '../services/nfseService';
import { getNFSeDetails } from '../services/plugnotasService'; // Import getNFSeDetails
import { downloadFile, formatCurrency, formatDate } from '../utils/helpers';
import './NFSeDetails.css';

const NFSeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth(); // <-- Get user profile
  const [nfse, setNfse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [emailData, setEmailData] = useState({ email: '' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    const loadNFSeDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getNFSeDetails(id); // Use getNFSeDetails from plugnotasService
        setNfse(data);
      } catch (err) {
        console.error('Error loading NFS-e details:', err);
        setError('Erro ao carregar detalhes da NFS-e.');
      } finally {
        setLoading(false);
      }
    };
    
    loadNFSeDetails();
  }, [id]);

  const reloadNFSeDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNFSeDetails(id); // Use getNFSeDetails from plugnotasService
      setNfse(data);
    } catch (err) {
      console.error('Error loading NFS-e details:', err);
      setError('Erro ao carregar detalhes da NFS-e.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setActionLoading('pdf');
      // Assuming getNFSePDF still works with the PlugNotas ID
      const blob = await getNFSePDF(id); 
      downloadFile(blob, `nfse-${id}.pdf`);
    } catch (err) {
      console.error('Error downloading PDF:', err);
      alert('Erro ao baixar PDF. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadXML = async () => {
    try {
      setActionLoading('xml');
      // Assuming getNFSeXML still works with the PlugNotas ID
      const blob = await getNFSeXML(id);
      downloadFile(blob, `nfse-${id}.xml`);
    } catch (err) {
      console.error('Error downloading XML:', err);
      alert('Erro ao baixar XML. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendEmail = async () => {
    if (!emailData.email) {
      alert('Por favor, informe um email.');
      return;
    }

    try {
      setActionLoading('email');
      // Assuming sendNFSeByEmail still works with the PlugNotas ID
      await sendNFSeByEmail(id, emailData);
      alert('Email enviado com sucesso!');
      setShowEmailModal(false);
      setEmailData({ email: '' });
    } catch (err) {
      console.error('Error sending email:', err);
      alert('Erro ao enviar email. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason) {
      alert('Por favor, informe o motivo do cancelamento.');
      return;
    }

    if (!window.confirm('Tem certeza que deseja cancelar esta NFS-e?')) {
      return;
    }

    try {
      setActionLoading('cancel');
      // Assuming cancelNFSe still works with the PlugNotas ID
      await cancelNFSe(id, { motivo: cancelReason });
      alert('NFS-e cancelada com sucesso!');
      setShowCancelModal(false);
      reloadNFSeDetails(); // Reload to get updated status
    } catch (err) {
      console.error('Error canceling NFS-e:', err);
      alert('Erro ao cancelar NFS-e. Tente novamente.');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
      case 'concluido': // PlugNotas status
      case 'autorizado':
      case 'processado':
        return 'status-success';
      case 'cancelado':
        return 'status-cancelled';
      case 'erro':
      case 'rejeitado':
        return 'status-error';
      default:
        return 'status-pending';
    }
  };

  if (loading) {
    return (
      <div className="details-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando detalhes...</p>
        </div>
      </div>
    );
  }

  if (error || !nfse) {
    return (
      <div className="details-container">
        <div className="error-state">
          <p>{error || 'NFS-e não encontrada'}</p>
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Voltar
          </button>
        </div>
      </div>
    );
  }

  const isCancelled = nfse.status?.toLowerCase() === 'cancelado';

  return (
    <div className="details-container">
      <div className="details-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Voltar
          </button>
          <h2>NFS-e #{nfse.numeroNfse || nfse.id}</h2>
          <span className={`status-badge ${getStatusClass(nfse.status)}`}>
            {nfse.status || 'Processando'}
          </span>
        </div>
      </div>

      <div className="details-content">
        <div className="details-section">
          <h3>Informações Gerais</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Data de Emissão:</label>
              <span>{formatDate(nfse.rps?.dataEmissao || nfse.dataEmissao)}</span>
            </div>
            <div className="info-item">
              <label>Valor Total:</label>
              <span className="value-highlight">
                {formatCurrency(nfse.servico?.[0]?.valor?.servico || 0)}
              </span>
            </div>
            {nfse.numeroNfse && (
              <div className="info-item">
                <label>Número:</label>
                <span>{nfse.numeroNfse}</span>
              </div>
            )}
            {nfse.retorno?.codigoVerificacao && (
              <div className="info-item">
                <label>Código de Verificação:</label>
                <span>{nfse.retorno.codigoVerificacao}</span>
              </div>
            )}
            {nfse.protocol && (
              <div className="info-item">
                <label>Protocolo:</label>
                <span>{nfse.protocol}</span>
              </div>
            )}
          </div>
        </div>

        <div className="details-section">
          <h3>Prestador</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Razão Social:</label>
              <span>{nfse.prestador?.razaoSocial || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>CNPJ:</label>
              <span>{nfse.prestador?.cpfCnpj || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Inscrição Municipal:</label>
              <span>{nfse.prestador?.inscricaoMunicipal || 'N/A'}</span>
            </div>
            {nfse.prestador?.email && (
              <div className="info-item">
                <label>Email:</label>
                <span>{nfse.prestador.email}</span>
              </div>
            )}
            {nfse.prestador?.telefone && (
              <div className="info-item">
                <label>Telefone:</label>
                <span>({nfse.prestador.telefone.ddd}) {nfse.prestador.telefone.numero}</span>
              </div>
            )}
          </div>
        </div>

        <div className="details-section">
          <h3>Tomador</h3>
          <div className="info-grid">
            <div className="info-item">
              <label>Nome/Razão Social:</label>
              <span>{nfse.tomador?.razaoSocial || nfse.tomador?.nomeFantasia || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>CPF/CNPJ:</label>
              <span>{nfse.tomador?.cpfCnpj || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{nfse.tomador?.email || 'N/A'}</span>
            </div>
            {nfse.tomador?.endereco && (
              <div className="info-item full-width">
                <label>Endereço:</label>
                <span>
                  {nfse.tomador.endereco.logradouro}, {nfse.tomador.endereco.numero}
                  {nfse.tomador.endereco.complemento && ` - ${nfse.tomador.endereco.complemento}`}
                  {' - '}{nfse.tomador.endereco.bairro}
                  {' - '}{nfse.tomador.endereco.descricaoCidade} - {nfse.tomador.endereco.estado}
                  {' - '}{nfse.tomador.endereco.cep}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="details-section">
          <h3>Serviço</h3>
          <div className="info-grid">
            <div className="info-item full-width">
              <label>Discriminação:</label>
              <span>{nfse.servico?.[0]?.discriminacao || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Código do Serviço:</label>
              <span>{nfse.servico?.[0]?.codigo || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>CNAE:</label>
              <span>{nfse.servico?.[0]?.cnae || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Valor dos Serviços:</label>
              <span>{formatCurrency(nfse.servico?.[0]?.valor?.servico || 0)}</span>
            </div>
            <div className="info-item">
              <label>Alíquota ISS:</label>
              <span>{nfse.servico?.[0]?.iss?.aliquota || 0}%</span>
            </div>
            <div className="info-item">
              <label>ISS Retido:</label>
              <span>{nfse.servico?.[0]?.iss?.retido ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <button
            className="btn-action"
            onClick={handleDownloadPDF}
            disabled={actionLoading === 'pdf'}
          >
            {actionLoading === 'pdf' ? 'Baixando...' : '📄 Baixar PDF'}
          </button>
          <button
            className="btn-action"
            onClick={handleDownloadXML}
            disabled={actionLoading === 'xml'}
          >
            {actionLoading === 'xml' ? 'Baixando...' : '📋 Baixar XML'}
          </button>
          <button
            className="btn-action"
            onClick={() => setShowEmailModal(true)}
            disabled={actionLoading === 'email'}
          >
            ✉️ Enviar por Email
          </button>
          {profile?.role === 'admin' && !isCancelled && (
            <button
              className="btn-action btn-danger"
              onClick={() => setShowCancelModal(true)}
              disabled={actionLoading === 'cancel'}
            >
              ❌ Cancelar NFS-e
            </button>
          )}
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Enviar NFS-e por Email</h3>
            <div className="form-group">
              <label>Email do destinatário:</label>
              <input
                type="email"
                value={emailData.email}
                onChange={(e) => setEmailData({ email: e.target.value })}
                placeholder="exemplo@email.com"
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowEmailModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-primary"
                onClick={handleSendEmail}
                disabled={actionLoading === 'email'}
              >
                {actionLoading === 'email' ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cancelar NFS-e</h3>
            <div className="form-group">
              <label>Motivo do cancelamento:</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows="4"
                placeholder="Informe o motivo do cancelamento..."
              />
            </div>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowCancelModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-danger"
                onClick={handleCancel}
                disabled={actionLoading === 'cancel'}
              >
                {actionLoading === 'cancel' ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFSeDetails;
