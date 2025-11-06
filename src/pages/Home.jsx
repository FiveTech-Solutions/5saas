import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NFSeCard from '../components/NFSeCard';
import { listNfses } from '../services/nfseSupabaseService'; // Updated import
import { useAuth } from '../contexts/AuthContext'; // Import useAuth
import './Home.css';

const Home = () => {
  const [nfseList, setNfseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth(); // Get user from auth context

  useEffect(() => {
    if (user) {
      loadNFSe();
    }
  }, [user]);

  const loadNFSe = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listNfses(); // Use the new service function
      setNfseList(data || []);
    } catch (err) {
      console.error('Error loading NFS-e from Supabase:', err);
      setError('Erro ao carregar suas NFS-e do banco de dados.');
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
          {nfseList.map((nfseItem) => (
            <NFSeCard key={nfseItem.id} nfse={nfseItem.nfse_data} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
