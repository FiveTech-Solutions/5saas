import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, IconButton, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import DescriptionIcon from '@mui/icons-material/Description';
import './AuditoriaSimplesNacional.css';

const companies = [
  { id: '1', name: 'Empresa Alfa Ltda', cnpj: '11.111.111/0001-11' },
  { id: '2', name: 'Empresa Beta S.A.', cnpj: '22.222.222/0001-22' },
  { id: '3', name: 'Empresa Gama Eireli', cnpj: '33.333.333/0001-33' },
];

const initialAuditHistory = [
  { id: 'AUD001', company: 'Empresa Alfa Ltda', periodo: '2023-01', status: 'Concluída', resultado: 'Conforme', dataAuditoria: '2023-02-10' },
  { id: 'AUD002', company: 'Empresa Beta S.A.', periodo: '2023-02', status: 'Em Andamento', resultado: 'N/A', dataAuditoria: '2023-03-15' },
  { id: 'AUD003', company: 'Empresa Gama Eireli', periodo: '2023-03', status: 'Concluída', resultado: 'Com Discrepâncias', dataAuditoria: '2023-04-20' },
];

const AuditoriaSimplesNacional = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [auditParams, setAuditParams] = useState({
    companyId: '',
    periodo: '',
  });

  const [auditResults, setAuditResults] = useState(null); // To display current audit results
  const [auditHistory, setAuditHistory] = useState(initialAuditHistory);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleParamChange = (e) => {
    const { name, value } = e.target;
    setAuditParams(prev => ({ ...prev, [name]: value }));
  };

  const handleStartAudit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);
    setAuditResults(null);

    if (!auditParams.companyId || !auditParams.periodo) {
      setError('Por favor, selecione a empresa e o período para iniciar a auditoria.');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call for audit
      console.log('Iniciando auditoria Simples Nacional:', auditParams);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      const selectedCompany = companies.find(c => c.id === auditParams.companyId);
      const resultStatus = Math.random() > 0.5 ? 'Conforme' : 'Com Discrepâncias';

      const newAuditResult = {
        company: selectedCompany.name,
        periodo: auditParams.periodo,
        status: 'Concluída',
        resultado: resultStatus,
        dataAuditoria: new Date().toLocaleString(),
        details: {
          receitaBruta: Math.floor(Math.random() * 100000) + 10000,
          aliquotaAplicada: (Math.random() * 5 + 1).toFixed(2) + '%',
          impostoDevido: (Math.random() * 5000 + 500).toFixed(2),
          discrepanciasEncontradas: resultStatus === 'Com Discrepâncias' ? ['Diferença de receita', 'NF-e não declarada'] : [],
        }
      };
      setAuditResults(newAuditResult);
      setAuditHistory(prev => [...prev, { id: `AUD${prev.length + 1}`, ...newAuditResult }]);
      setSuccess('Auditoria concluída com sucesso!');
    } catch (err) {
      console.error("Erro ao iniciar auditoria:", err);
      setError(err.message || 'Erro ao iniciar auditoria.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewReport = (id) => {
    console.log('Ver relatório da auditoria:', id);
    // Implement logic to show audit report details
  };

  return (
    <div className="auditoria-simples-nacional-container">
      <div className="auditoria-simples-nacional-header">
        <h1>Auditoria - Simples Nacional</h1>
      </div>

      {error && <div className="alert alert-error"><p>{error}</p></div>}
      {success && <div className="alert alert-success"><p>{success}</p></div>}

      <section className="audit-parameters-section">
        <h2>Parâmetros da Auditoria</h2>
        <form onSubmit={handleStartAudit} className="audit-params-form">
          <div className="form-row">
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 250 }}>
              <InputLabel id="company-select-label">Empresa *</InputLabel>
              <Select
                labelId="company-select-label"
                id="companyId"
                name="companyId"
                value={auditParams.companyId}
                onChange={handleParamChange}
                label="Empresa"
                required
              >
                <MenuItem value="">
                  <em>Selecione uma empresa</em>
                </MenuItem>
                {companies.map(company => (
                  <MenuItem key={company.id} value={company.id}>{company.name} ({company.cnpj})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 200 }}>
              <InputLabel id="periodo-label">Período *</InputLabel>
              <TextField
                labelId="periodo-label"
                type="month"
                name="periodo"
                value={auditParams.periodo}
                onChange={handleParamChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
          </div>
          <div className="form-actions">
            <Button type="submit" variant="contained" color="primary" startIcon={<SearchIcon />} disabled={loading}>
              {loading ? 'Iniciando...' : 'Iniciar Auditoria'}
            </Button>
          </div>
        </form>
      </section>

      {auditResults && (
        <section className="audit-results-section">
          <h2>Resultado da Auditoria Recente</h2>
          <Paper sx={{ padding: 2, mb: 2 }}>
            <Typography variant="h6">Empresa: {auditResults.company}</Typography>
            <Typography variant="body1">Período: {auditResults.periodo}</Typography>
            <Typography variant="body1">Status: {auditResults.status}</Typography>
            <Typography variant="body1">Resultado: <span className={auditResults.resultado === 'Conforme' ? 'result-conforme' : 'result-discrepancias'}>{auditResults.resultado}</span></Typography>
            <Typography variant="body1">Data da Auditoria: {auditResults.dataAuditoria}</Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1">Detalhes:</Typography>
              <Typography variant="body2">Receita Bruta: R$ {auditResults.details.receitaBruta.toFixed(2).replace('.', ',')}</Typography>
              <Typography variant="body2">Alíquota Aplicada: {auditResults.details.aliquotaAplicada}</Typography>
              <Typography variant="body2">Imposto Devido: R$ {auditResults.details.impostoDevido.replace('.', ',')}</Typography>
              {auditResults.details.discrepanciasEncontradas.length > 0 && (
                <Box>
                  <Typography variant="body2" color="error">Discrepâncias Encontradas:</Typography>
                  <ul>
                    {auditResults.details.discrepanciasEncontradas.map((disc, index) => (
                      <li key={index}><Typography variant="body2" color="error">{disc}</Typography></li>
                    ))}
                  </ul>
                </Box>
              )}
            </Box>
          </Paper>
        </section>
      )}

      <section className="audit-history-section">
        <h2>Histórico de Auditorias</h2>
        {auditHistory.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
            Nenhum histórico de auditoria encontrado.
          </Typography>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="tabela de histórico de auditorias">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Resultado</TableCell>
                    <TableCell>Data Auditoria</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {auditHistory
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((audit) => (
                      <TableRow key={audit.id}>
                        <TableCell>{audit.id}</TableCell>
                        <TableCell>{audit.company}</TableCell>
                        <TableCell>{audit.periodo}</TableCell>
                        <TableCell>{audit.status}</TableCell>
                        <TableCell>
                          <span className={audit.resultado === 'Conforme' ? 'result-conforme' : 'result-discrepancias'}>
                            {audit.resultado}
                          </span>
                        </TableCell>
                        <TableCell>{audit.dataAuditoria}</TableCell>
                        <TableCell align="center">
                          <IconButton aria-label="ver relatório" onClick={() => handleViewReport(audit.id)}>
                            <DescriptionIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={auditHistory.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage="Linhas por página:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
            />
          </Paper>
        )}
      </section>
    </div>
  );
};

export default AuditoriaSimplesNacional;