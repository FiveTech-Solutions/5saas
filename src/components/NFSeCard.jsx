import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatDate } from '../utils/helpers';
import './NFSeCard.css';

const NFSeCard = ({ nfse }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/nfse/${nfse.id}`);
  };

  const getStatusClass = (status) => {
    switch (status?.toLowerCase()) {
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

  return (
    <div className="nfse-card" onClick={handleClick}>
      <div className="nfse-card-header">
        <div>
          <h3 className="nfse-number">NFS-e #{nfse.numero || nfse.id}</h3>
          <p className="nfse-date">{formatDate(nfse.dataEmissao || nfse.createdAt)}</p>
        </div>
        <span className={`nfse-status ${getStatusClass(nfse.status)}`}>
          {nfse.status || 'Processando'}
        </span>
      </div>
      
      <div className="nfse-card-body">
        <div className="nfse-info">
          <label>Tomador:</label>
          <span>{nfse.tomador?.razaoSocial || nfse.tomador?.nome || 'N/A'}</span>
        </div>
        
        <div className="nfse-info">
          <label>Serviço:</label>
          <span>{nfse.servico?.discriminacao?.substring(0, 50) || 'N/A'}...</span>
        </div>
        
        <div className="nfse-info">
          <label>Valor:</label>
          <span className="nfse-value">
            {formatCurrency(nfse.servico?.valorServicos || nfse.valor || 0)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default NFSeCard;
