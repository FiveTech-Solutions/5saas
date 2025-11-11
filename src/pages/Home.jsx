import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import NFSeCard from '../components/NFSeCard';
import { listNfses } from '../services/nfseSupabaseService';
import { useAuth } from '../contexts/AuthContext';
import './Home.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const Home = () => {
  const [nfseList, setNfseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for dashboard data
  const [dashboardStats, setDashboardStats] = useState({ totalValue: 0, totalNotes: 0, avgTicket: 0 });
  const [lineChartData, setLineChartData] = useState({ labels: [], datasets: [] });
  const [doughnutChartData, setDoughnutChartData] = useState({ labels: [], datasets: [] });

  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadNFSe();
    }
  }, [user]);

  const processDashboardData = (notes) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentNotes = notes.filter(n => new Date(n.created_at) > thirtyDaysAgo);

    // 1. KPI Stats
    const totalValue = recentNotes.reduce((sum, n) => sum + (n.nfse_data?.servico[0]?.valor?.servico || 0), 0);
    const totalNotes = recentNotes.length;
    const avgTicket = totalNotes > 0 ? totalValue / totalNotes : 0;
    setDashboardStats({ totalValue, totalNotes, avgTicket });

    // 2. Line Chart Data (Value per day)
    const dailyValues = {};
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dailyValues[date.toISOString().split('T')[0]] = 0;
    }
    recentNotes.forEach(n => {
      const date = new Date(n.created_at).toISOString().split('T')[0];
      dailyValues[date] = (dailyValues[date] || 0) + (n.nfse_data?.servico[0]?.valor?.servico || 0);
    });
    const lineLabels = Object.keys(dailyValues).sort();
    const lineValues = lineLabels.map(label => dailyValues[label]);
    setLineChartData({
      labels: lineLabels.map(l => new Date(l).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
      datasets: [{
        label: 'Valor Emitido (R$)',
        data: lineValues,
        borderColor: '#4f46e5',
        backgroundColor: 'rgba(79, 70, 229, 0.1)',
        fill: true,
        tension: 0.3,
      }],
    });

    // 3. Doughnut Chart Data (Status)
    const statusCounts = notes.reduce((acc, n) => {
      const status = n.status || 'Desconhecido';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});
    setDoughnutChartData({
      labels: Object.keys(statusCounts),
      datasets: [{
        data: Object.values(statusCounts),
        backgroundColor: ['#34d399', '#fbbf24', '#f87171', '#9ca3af'], // Green, Amber, Red, Gray
        hoverBackgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#6b7280'],
      }],
    });
  };

  const loadNFSe = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listNfses();
      setNfseList(data || []);
      processDashboardData(data || []); // Process data for dashboard
    } catch (err) {
      console.error('Error loading NFS-e from Supabase:', err);
      setError('Erro ao carregar suas NFS-e do banco de dados.');
      setNfseList([]);
    } finally {
      setLoading(false);
    }
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
  };

  return (
    <div className="home-container">
      {/* Dashboard Section */}
      <section className="dashboard-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <h4>Valor Emitido (30d)</h4>
            <p>{dashboardStats.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
          <div className="kpi-card">
            <h4>Notas Emitidas (30d)</h4>
            <p>{dashboardStats.totalNotes}</p>
          </div>
          <div className="kpi-card">
            <h4>Ticket Médio (30d)</h4>
            <p>{dashboardStats.avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
          </div>
        </div>
        <div className="chart-grid">
          <div className="chart-container">
            <h3>Valores por Dia</h3>
            <div className="chart-wrapper">
              <Line options={chartOptions} data={lineChartData} />
            </div>
          </div>
          <div className="chart-container">
            <h3>Status das Notas</h3>
             <div className="chart-wrapper">
              <Doughnut options={chartOptions} data={doughnutChartData} />
            </div>
          </div>
        </div>
      </section>

      {/* NFS-e List Section */}
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
