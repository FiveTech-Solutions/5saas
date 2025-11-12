import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';
import './NFSeCard.css';

const NFSeCard = ({ nfse }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/nfse/${nfse.id}`);
  };

  const getStatusClass = (situacao) => {
    switch (situacao?.toUpperCase()) {
      case 'CONCLUIDO':
        return 'status-success';
      case 'CANCELADO':
        return 'status-cancelled';
      case 'ERRO':
        return 'status-error';
      case 'PROCESSANDO':
        return 'status-pending';
      default:
        return 'status-pending';
    }
  };

  return (
    <div className="nfse-card" onClick={handleClick}>
      <div className="nfse-card-header">
        <div>
          <h3 className="nfse-number">NFS-e #{nfse.numeroNfse || nfse.id}</h3>
          <p className="nfse-date">{formatDate(nfse.emissao)}</p>
        </div>
        <span className={`nfse-status ${getStatusClass(nfse.situacao)}`}>
          {nfse.situacao || 'Processando'}
        </span>
      </div>
      
      <div className="nfse-card-body">
        <div className="nfse-info">
          <label>Tomador:</label>
          <span>{nfse.tomador || 'N/A'}</span>
        </div>
        
        <div className="nfse-info">
          <label>Serviço:</label>
          <span>{nfse.mensagem?.substring(0, 50) || 'Serviço Prestado'}...</span>
        </div>
        
        <div className="nfse-info">
          <label>Valor:</label>
          <span className="nfse-value">
            {formatCurrency(nfse.valorServico || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFSeCard;
