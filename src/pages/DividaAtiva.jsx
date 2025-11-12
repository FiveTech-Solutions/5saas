import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, IconButton, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import './DividaAtiva.css';

const initialDebts = [
  { id: 'DA001', devedor: 'Empresa A Ltda', cpfCnpj: '11.222.333/0001-44', valor: 1500.75, dataVencimento: '2023-01-15', status: 'Em Aberto' },
  { id: 'DA002', devedor: 'João Silva', cpfCnpj: '123.456.789-00', valor: 300.00, dataVencimento: '2022-11-01', status: 'Atrasado' },
  { id: 'DA003', devedor: 'Maria Oliveira', cpfCnpj: '987.654.321-99', valor: 800.50, dataVencimento: '2023-03-20', status: 'Em Negociação' },
  { id: 'DA004', devedor: 'Empresa B S.A.', cpfCnpj: '44.555.666/0001-77', valor: 2500.00, dataVencimento: '2023-02-10', status: 'Em Aberto' },
  { id: 'DA005', devedor: 'Pedro Souza', cpfCnpj: '111.222.333-44', valor: 120.00, dataVencimento: '2022-10-05', status: 'Atrasado' },
  { id: 'DA006', devedor: 'Empresa C Ltda', cpfCnpj: '77.888.999/0001-11', valor: 5000.00, dataVencimento: '2023-04-01', status: 'Em Aberto' },
  { id: 'DA007', devedor: 'Ana Costa', cpfCnpj: '555.666.777-88', valor: 450.00, dataVencimento: '2023-01-25', status: 'Pago' },
  { id: 'DA008', devedor: 'Carlos Pereira', cpfCnpj: '222.333.444-55', valor: 90.00, dataVencimento: '2023-03-01', status: 'Atrasado' },
  { id: 'DA009', devedor: 'Empresa D Eireli', cpfCnpj: '33.444.555/0001-22', valor: 1800.00, dataVencimento: '2023-02-28', status: 'Em Negociação' },
  { id: 'DA010', devedor: 'Fernanda Lima', cpfCnpj: '666.777.888-99', valor: 600.00, dataVencimento: '2023-04-10', status: 'Em Aberto' },
];

const DividaAtiva = () => {
  const [debts, setDebts] = useState(initialDebts);
  const [filteredDebts, setFilteredDebts] = useState(initialDebts);
  const [loading, setLoading] = useState(false); // Simulate loading
  const [error, setError] = useState(null);

  const [filterDevedor, setFilterDevedor] = useState('');
  const [filterCpfCnpj, setFilterCpfCnpj] = useState('');
  const [filterStatus, setFilterStatus] = useState('Todos');

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Apply filters
    let currentFilteredDebts = debts.filter(debt => {
      const matchesDevedor = debt.devedor.toLowerCase().includes(filterDevedor.toLowerCase());
      const matchesCpfCnpj = debt.cpfCnpj.includes(filterCpfCnpj);
      const matchesStatus = filterStatus === 'Todos' || debt.status === filterStatus;
      return matchesDevedor && matchesCpfCnpj && matchesStatus;
    });
    setFilteredDebts(currentFilteredDebts);
    setPage(0); // Reset page when filters change
  }, [debts, filterDevedor, filterCpfCnpj, filterStatus]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    if (name === 'filterDevedor') setFilterDevedor(value);
    if (name === 'filterCpfCnpj') setFilterCpfCnpj(value);
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
    console.log('Ver detalhes da dívida:', id);
    // Implement logic to show debt details, e.g., open a modal or navigate
  };

  const handleUpdateStatus = (id) => {
    console.log('Atualizar status da dívida:', id);
    // Implement logic to update debt status, e.g., open a modal with status options
  };

  if (loading) {
    return <div className="loading-state">Carregando dívidas...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const availableStatuses = ['Todos', ...new Set(debts.map(debt => debt.status))];

  return (
    <div className="divida-ativa-container">
      <div className="divida-ativa-header">
        <h1>Dívida Ativa</h1>
      </div>

      <section className="divida-ativa-filters">
        <h2>Filtros</h2>
        <div className="filter-row">
          <TextField
            label="Devedor"
            variant="outlined"
            name="filterDevedor"
            value={filterDevedor}
            onChange={handleFilterChange}
            sx={{ m: 1, flexGrow: 1 }}
          />
          <TextField
            label="CPF/CNPJ"
            variant="outlined"
            name="filterCpfCnpj"
            value={filterCpfCnpj}
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

      <section className="divida-ativa-list">
        <h2>Dívidas Cadastradas</h2>
        {filteredDebts.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
            Nenhuma dívida encontrada com os filtros aplicados.
          </Typography>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 600 }}>
              <Table stickyHeader aria-label="tabela de dívida ativa">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Devedor</TableCell>
                    <TableCell>CPF/CNPJ</TableCell>
                    <TableCell align="right">Valor (R$)</TableCell>
                    <TableCell>Data Vencimento</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredDebts
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((debt) => (
                      <TableRow key={debt.id}>
                        <TableCell>{debt.id}</TableCell>
                        <TableCell>{debt.devedor}</TableCell>
                        <TableCell>{debt.cpfCnpj}</TableCell>
                        <TableCell align="right">
                          {`R$ ${debt.valor.toFixed(2).replace('.', ',')}`}
                        </TableCell>
                        <TableCell>{debt.dataVencimento}</TableCell>
                        <TableCell>{debt.status}</TableCell>
                        <TableCell align="center">
                          <IconButton aria-label="ver detalhes" onClick={() => handleViewDetails(debt.id)}>
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton aria-label="atualizar status" onClick={() => handleUpdateStatus(debt.id)}>
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
              count={filteredDebts.length}
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

export default DividaAtiva;