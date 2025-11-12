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
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, TablePagination
} from '@mui/material';
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
  const [page, setPage] = useState(0); // Material UI TablePagination é 0-indexed
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
        setPage(0); // Resetar paginação local ao carregar novas notas
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

  // Lógica de paginação local para Material UI
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0); // Voltar para a primeira página ao mudar o número de linhas por página
  };

  const currentNfses = nfseList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
        <TableContainer component={Paper} className="nfse-table-container">
          <Table className="nfse-table" aria-label="Tabela de NFS-e">
            <TableHead>
              <TableRow>
                <TableCell>Número</TableCell>
                <TableCell>Emissão</TableCell>
                <TableCell>Tomador</TableCell>
                <TableCell align="right">Valor</TableCell>
                <TableCell>Situação</TableCell>
                <TableCell>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {currentNfses.map((nfseItem) => (
                <TableRow key={nfseItem.id} onClick={() => navigate(`/nfse/${nfseItem.id}`)} style={{ cursor: 'pointer' }}>
                  <TableCell component="th" scope="row">
                    {nfseItem.numeroNfse || nfseItem.id}
                  </TableCell>
                  <TableCell>{formatDate(nfseItem.emissao)}</TableCell>
                  <TableCell>{nfseItem.tomador || 'N/A'}</TableCell>
                  <TableCell align="right">{formatCurrency(nfseItem.valorServico || 0)}</TableCell>
                  <TableCell>
                    <span className={`nfse-status-badge ${getStatusClass(nfseItem.situacao)}`}>
                      {nfseItem.situacao || 'Processando'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <button className="btn-icon" onClick={(e) => { e.stopPropagation(); navigate(`/nfse/${nfseItem.id}`); }}>
                      Detalhes
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={nfseList.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />

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
        </TableContainer>
      )}
    </div>
  );
};

export default Home;

