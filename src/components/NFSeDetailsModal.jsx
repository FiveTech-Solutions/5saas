import React from 'react';
import './NFSeDetailsModal.css'; // We'll create this CSS file

const NFSeDetailsModal = ({ isOpen, onClose, nfseData }) => {
  if (!isOpen || !nfseData) return null;

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return 'N/A';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatCpfCnpj = (cpfCnpj) => {
    if (!cpfCnpj) return 'N/A';
    const cleaned = cpfCnpj.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    if (cleaned.length === 14) {
      return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    return cpfCnpj;
  };

  const renderAddress = (address) => {
    if (!address) return 'N/A';
    return (
      <>
        {address.logradouro}, {address.numero} {address.complemento && `- ${address.complemento}`}<br />
        {address.bairro} - {address.descricaoCidade}/{address.estado}<br />
        CEP: {address.cep}
      </>
    );
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content nfse-details-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Detalhes da NFS-e #{nfseData.numeroNfse || nfseData.idIntegracao}</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <div className="details-section">
            <h4>Informações Gerais</h4>
            <p><strong>ID Integração:</strong> {nfseData.idIntegracao}</p>
            <p><strong>Número NFS-e:</strong> {nfseData.numeroNfse || 'N/A'}</p>
            <p><strong>Protocolo:</strong> {nfseData.protocol || 'N/A'}</p>
            <p><strong>Situação:</strong> {nfseData.status || nfseData.retorno?.situacao || 'N/A'}</p>
            <p><strong>Data Emissão:</strong> {nfseData.rps?.dataEmissao ? new Date(nfseData.rps.dataEmissao).toLocaleDateString('pt-BR') : 'N/A'}</p>
            <p><strong>Valor Total:</strong> {formatCurrency(nfseData.servico?.[0]?.valor?.servico)}</p>
          </div>

          <div className="details-section">
            <h4>Prestador</h4>
            <p><strong>CPF/CNPJ:</strong> {formatCpfCnpj(nfseData.prestador?.cpfCnpj)}</p>
            <p><strong>Razão Social:</strong> {nfseData.prestador?.razaoSocial}</p>
            <p><strong>Nome Fantasia:</strong> {nfseData.prestador?.nomeFantasia || 'N/A'}</p>
            <p><strong>Email:</strong> {nfseData.prestador?.email || 'N/A'}</p>
            <p><strong>Telefone:</strong> {nfseData.prestador?.telefone?.ddd ? `(${nfseData.prestador.telefone.ddd}) ${nfseData.prestador.telefone.numero}` : 'N/A'}</p>
            <p><strong>Endereço:</strong> {renderAddress(nfseData.prestador?.endereco)}</p>
          </div>

          <div className="details-section">
            <h4>Tomador</h4>
            <p><strong>CPF/CNPJ:</strong> {formatCpfCnpj(nfseData.tomador?.cpfCnpj)}</p>
            <p><strong>Razão Social:</strong> {nfseData.tomador?.razaoSocial}</p>
            <p><strong>Email:</strong> {nfseData.tomador?.email || 'N/A'}</p>
            <p><strong>Telefone:</strong> {nfseData.tomador?.telefone?.ddd ? `(${nfseData.tomador.telefone.ddd}) ${nfseData.tomador.telefone.numero}` : 'N/A'}</p>
            <p><strong>Endereço:</strong> {renderAddress(nfseData.tomador?.endereco)}</p>
          </div>

          {nfseData.servico && nfseData.servico.length > 0 && (
            <div className="details-section">
              <h4>Serviço</h4>
              <p><strong>Código:</strong> {nfseData.servico[0].codigo}</p>
              <p><strong>Discriminação:</strong> {nfseData.servico[0].discriminacao}</p>
              <p><strong>Valor Serviço:</strong> {formatCurrency(nfseData.servico[0].valor?.servico)}</p>
              {nfseData.servico[0].iss && (
                <>
                  <p><strong>ISS Retido:</strong> {nfseData.servico[0].iss.retido ? 'Sim' : 'Não'}</p>
                  <p><strong>Alíquota ISS:</strong> {nfseData.servico[0].iss.aliquota}%</p>
                </>
              )}
            </div>
          )}

          {nfseData.retorno && (
            <div className="details-section">
              <h4>Retorno da Prefeitura</h4>
              <p><strong>Situação:</strong> {nfseData.retorno.situacao}</p>
              <p><strong>Protocolo Prefeitura:</strong> {nfseData.retorno.protocoloPrefeitura || 'N/A'}</p>
              <p><strong>Mensagem:</strong> {nfseData.retorno.mensagemRetorno || 'N/A'}</p>
              <p><strong>Data Autorização:</strong> {nfseData.retorno.dataAutorizacao ? new Date(nfseData.retorno.dataAutorizacao).toLocaleDateString('pt-BR') : 'N/A'}</p>
              <p><strong>Código Verificação:</strong> {nfseData.retorno.codigoVerificacao || 'N/A'}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default NFSeDetailsModal;
