import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, IconButton, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import './AuditoriaAutosInfracao.css';

const initialInfractionNotices = [
  { id: 'AI001', empresaCpf: 'Empresa X Ltda (11.111.111/0001-11)', descricao: 'Falta de recolhimento de ISS', dataInfracao: '2023-01-20', valor: 2500.00, status: 'Em Aberto' },
  { id: 'AI002', empresaCpf: 'João da Silva (123.456.789-00)', descricao: 'Declaração fora do prazo', dataInfracao: '2023-02-15', valor: 500.00, status: 'Atrasado' },
  { id: 'AI003', empresaCpf: 'Empresa Y S.A. (22.222.222/0001-22)', descricao: 'Divergência de informações', dataInfracao: '2023-03-01', valor: 12000.00, status: 'Em Recurso' },
  { id: 'AI004', empresaCpf: 'Maria Oliveira (987.654.321-99)', descricao: 'Não apresentação de documentos', dataInfracao: '2023-01-05', valor: 300.00, status: 'Pago' },
  { id: 'AI005', empresaCpf: 'Empresa Z Eireli (33.333.333/0001-33)', descricao: 'Falta de licença de funcionamento', dataInfracao: '2023-04-10', valor: 8000.00, status: 'Em Aberto' },
];

const AuditoriaAutosInfracao = () => {
  const [infractionNotices, setInfractionNotices] = useState(initialInfractionNotices);
  const [filteredNotices, setFilteredNotices] = useState(initialInfractionNotices);
  const [loading, setLoading] = useState(false); // Simulate loading
  const [error, setError] = useState(null);

  const [filterEmpresaCpf, setFilterEmpresaCpf] = useState('');
  const [filterDescricao, setFilterDescricao] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Apply filters
    let currentFilteredNotices = infractionNotices.filter(notice => {
      const matchesEmpresaCpf = notice.empresaCpf.toLowerCase().includes(filterEmpresaCpf.toLowerCase());
      const matchesDescricao = notice.descricao.toLowerCase().includes(filterDescricao.toLowerCase());
      const matchesStatus = filterStatus === 'Todos' || notice.status === filterStatus;
      return matchesEmpresaCpf && matchesDescricao && matchesStatus;
    });
    setFilteredNotices(currentFilteredNotices);
    setPage(0); // Reset page when filters change
  }, [infractionNotices, filterEmpresaCpf, filterDescricao, filterStatus]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filterEmpresaCpf') setFilterEmpresaCpf(value);
    if (name === 'filterDescricao') setFilterDescricao(value);
    if (name === 'filterStatus') setFilterStatus(value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewDetails = (id) => {
    console.log('Ver detalhes do auto de infração:', id);
    // Implement logic to show infraction notice details, e.g., open a modal or navigate
  };

  const handleUpdateStatus = (id) => {
    console.log('Atualizar status do auto de infração:', id);
    // Implement logic to update infraction notice status, e.g., open a modal with status options
  };

  if (loading) {
    return <div className="loading-state">Carregando autos de infração...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const availableStatuses = ['Todos', ...new Set(infractionNotices.map(notice => notice.status))];

  return (
    <div className="auditoria-autos-infracao-container">
      <div className="auditoria-autos-infracao-header">
        <h1>Auditoria - Autos de Infração</h1>
      </div>

      <section className="infraction-filters">
        <h2>Filtros</h2>
        <div className="filter-row">
          <TextField
            label="Empresa/CPF"
            variant="outlined"
            name="filterEmpresaCpf"
            value={filterEmpresaCpf}
            onChange={handleFilterChange}
            sx={{ m: 1, flexGrow: 1 }}
          />
          <TextField
            label="Descrição"
            variant="outlined"
            name="filterDescricao"
            value={filterDescricao}
            onChange={handleFilterChange}
            sx={{ m: 1, flexGrow: 1 }}
          />
          <FormControl variant="outlined" sx={{ m: 1, minWidth: 180 }}>
            <InputLabel id="filter-status-label">Status</InputLabel>
            <Select
              labelId="filter-status-label"
              id="filterStatus"
              name="filterStatus"
              value={filterStatus}
              onChange={handleFilterChange}
              label="Status"
            >
              {availableStatuses.map(status => (
                <MenuItem key={status} value={status}>{status}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>
      </section>

      <section className="infraction-list">
        <h2>Autos de Infração Cadastrados</h2>
        {filteredNotices.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
            Nenhum auto de infração encontrado com os filtros aplicados.
          </Typography>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="tabela de autos de infração">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Empresa/CPF</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Data Infração</TableCell>
                    <TableCell align="right">Valor (R$)</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredNotices
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((notice) => (
                      <TableRow key={notice.id}>
                        <TableCell>{notice.id}</TableCell>
                        <TableCell>{notice.empresaCpf}</TableCell>
                        <TableCell>{notice.descricao}</TableCell>
                        <TableCell>{notice.dataInfracao}</TableCell>
                        <TableCell align="right">
                          {`R$ ${notice.valor.toFixed(2).replace('.', ',')}`}
                        </TableCell>
                        <TableCell>{notice.status}</TableCell>
                        <TableCell align="center">
                          <IconButton aria-label="ver detalhes" onClick={() => handleViewDetails(notice.id)}>
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton aria-label="atualizar status" onClick={() => handleUpdateStatus(notice.id)}>
                            <EditIcon />
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
              count={filteredNotices.length}
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

export default AuditoriaAutosInfracao;