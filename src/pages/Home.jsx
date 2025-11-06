import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NFSeCard from '../components/NFSeCard';
import { listNFSe } from '../services/nfseService';
import './Home.css';

const Home = () => {
  const [nfseList, setNfseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNFSe();
  }, []);

  const loadNFSe = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listNFSe();
      // Handle different response structures
      if (Array.isArray(data)) {
        setNfseList(data);
      } else if (data.items && Array.isArray(data.items)) {
        setNfseList(data.items);
      } else if (data.data && Array.isArray(data.data)) {
        setNfseList(data.data);
      } else {
        setNfseList([]);
      }
    } catch (err) {
      console.error('Error loading NFS-e:', err);
      setError('Erro ao carregar NFS-e. Verifique suas configurações de API.');
      setNfseList([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h2>Minhas NFS-e</h2>
        <button className="btn-primary" onClick={() => navigate('/nfse/new')}>
          + Nova NFS-e
        </button>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Carregando NFS-e...</p>
        </div>
      )}

      {error && (
        <div className="error-state">
          <p>{error}</p>
          <button className="btn-secondary" onClick={loadNFSe}>
            Tentar Novamente
          </button>
        </div>
      )}

      {!loading && !error && nfseList.length === 0 && (
        <div className="empty-state">
          <h3>Nenhuma NFS-e encontrada</h3>
          <p>Comece criando sua primeira nota fiscal de serviço.</p>
          <button className="btn-primary" onClick={() => navigate('/nfse/new')}>
            Criar NFS-e
          </button>
        </div>
      )}

      {!loading && !error && nfseList.length > 0 && (
        <div className="nfse-grid">
          {nfseList.map((nfse, index) => (
            <NFSeCard key={nfse.id || index} nfse={nfse} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
