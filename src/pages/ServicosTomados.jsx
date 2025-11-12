import React, { useState, useEffect } from 'react';
import { listNfses } from '../services/nfseSupabaseService';
import { useAuth } from '../contexts/AuthContext';
import './ServicosTomados.css'; // Assuming you'll create a CSS file for this page

const ServicosTomados = () => {
  const { user } = useAuth();
  const [nfses, setNfses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNfses = async () => {
      try {
        setLoading(true);
        const data = await listNfses();
        setNfses(data);
      } catch (err) {
        console.error("Error fetching NFSe list:", err);
        setError("Failed to load services. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchNfses();
  }, []);

  if (loading) {
    return <div className="loading-state">Loading services...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="servicos-tomados-container">
      <h1>Serviços Tomados</h1>
      {nfses.length === 0 ? (
        <p>No services found.</p>
      ) : (
        <div className="nfse-list">
          {nfses.map((nfse) => (
            <div key={nfse.id} className="nfse-card">
              <h3>NFSe ID: {nfse.id}</h3>
              <p><strong>Protocol:</strong> {nfse.protocol}</p>
              <p><strong>Integration ID:</strong> {nfse.id_integracao}</p>
              <p><strong>Status:</strong> {nfse.status}</p>
              <p><strong>Tomador:</strong> {nfse.nfse_data?.tomador?.razaoSocial || 'N/A'}</p>
              <p><strong>Service Description:</strong> {nfse.nfse_data?.servico?.[0]?.discriminacao || 'N/A'}</p>
              <p><strong>Service Value:</strong> R$ {nfse.nfse_data?.servico?.[0]?.valor?.servico?.toFixed(2) || '0.00'}</p>
              <p><strong>Created At:</strong> {new Date(nfse.created_at).toLocaleString()}</p>
              {/* You can add more details or a link to a detail page here */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServicosTomados;