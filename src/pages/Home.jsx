import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, Doughnut } from 'react-chartjs-2';
import { format, subDays } from 'date-fns';
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
import { consultarNotasPorPeriodo } from '../services/nfseService'; // Importar o serviço correto
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency, formatDate } from '../utils/helpers'; // Importar helpers
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
  
  // Estados para filtros e paginação da API
  const [filtros, setFiltros] = useState({
    dataInicial: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dataFinal: format(new Date(), 'yyyy-MM-dd'),
  });
  const [paginacaoApi, setPaginacaoApi] = useState({ // Renomeado para evitar conflito
    hashProximaPagina: null,
    temMais: false
  });

  // Estados para paginação local
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    // As notas já virão filtradas pelos últimos 30 dias pela API
    const recentNotes = notes; 

    // 1. KPI Stats
    const totalValue = recentNotes.reduce((sum, n) => sum + (n.valorServico || 0), 0);
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
      const date = new Date(n.emissao).toISOString().split('T')[0]; // Usar 'emissao' da nota
      dailyValues[date] = (dailyValues[date] || 0) + (n.valorServico || 0);
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
      const status = n.situacao || 'Desconhecido'; // Usar 'situacao' da nota
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

  const loadNFSe = async (resetPagina = true) => {
    try {
      setLoading(true);
      setError(null);

      const response = await consultarNotasPorPeriodo({
        cpfCnpj: '08187168000160', // CNPJ mockado conforme solicitado
        dataInicial: filtros.dataInicial,
        dataFinal: filtros.dataFinal,
        hashProximaPagina: resetPagina ? null : paginacaoApi.hashProximaPagina
      });

      const fetchedNotes = response.notas || [];

      if (resetPagina) {
        setNfseList(fetchedNotes);
        setCurrentPage(1); // Resetar paginação local ao carregar novas notas
        processDashboardData(fetchedNotes); // Processar dados para o dashboard
      } else {
        setNfseList(prev => [...prev, ...fetchedNotes]);
        processDashboardData([...nfseList, ...fetchedNotes]); // Re-processar com todas as notas
      }

      setPaginacaoApi({
        hashProximaPagina: response.hashProximaPagina,
        temMais: !!response.hashProximaPagina
      });

    } catch (err) {
      console.error('Erro ao carregar NFS-e:', err);
      setError('Erro ao carregar suas NFS-e.');
      setNfseList([]);
    } finally {
      setLoading(false);
    }
  };

  const carregarMaisApi = () => { // Renomeado para carregar mais da API
    if (paginacaoApi.temMais && !loading) {
      loadNFSe(false);
    }
  };

  // Lógica de paginação local
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNfses = nfseList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(nfseList.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom' } },
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
          <button className="btn-secondary" onClick={() => loadNFSe()}>
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
        <div className="nfse-table-container">
          <table className="nfse-table">
            <thead>
              <tr>
                <th>Número</th>
                <th>Emissão</th>
                <th>Tomador</th>
                <th>Valor</th>
                <th>Situação</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {currentNfses.map((nfseItem) => (
                <tr key={nfseItem.id} onClick={() => navigate(`/nfse/${nfseItem.id}`)}>
                  <td>{nfseItem.numeroNfse || nfseItem.id}</td>
                  <td>{formatDate(nfseItem.emissao)}</td>
                  <td>{nfseItem.tomador || 'N/A'}</td>
                  <td>{formatCurrency(nfseItem.valorServico || 0)}</td>
                  <td>
                    <span className={`nfse-status-badge ${getStatusClass(nfseItem.situacao)}`}>
                      {nfseItem.situacao || 'Processando'}
                    </span>
                  </td>
                  <td>
                    {/* Aqui você pode adicionar botões de ação como visualizar, baixar PDF, etc. */}
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/nfse/${nfseItem.id}`); }}>
                      Detalhes
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Controles de Paginação Local */}
          <div className="pagination-controls">
            <button 
              onClick={() => paginate(currentPage - 1)} 
              disabled={currentPage === 1 || loading}
              className="btn-secondary"
            >
              Anterior
            </button>
            <span>Página {currentPage} de {totalPages}</span>
            <button 
              onClick={() => paginate(currentPage + 1)} 
              disabled={currentPage === totalPages || loading}
              className="btn-secondary"
            >
              Próxima
            </button>
          </div>

          {/* Botão para carregar mais da API, se houver */}
          {paginacaoApi.temMais && (
            <div className="paginacao-api-load-more">
              <button 
                onClick={carregarMaisApi} 
                className="btn-primary"
                disabled={loading}
              >
                {loading ? 'Carregando mais notas...' : 'Carregar Mais Notas da API'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;

