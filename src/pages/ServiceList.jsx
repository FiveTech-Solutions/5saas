import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, IconButton, Box, Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { getServicoPlugNotas } from '../services/plugnotasService'; // Assuming this can fetch a single service
import './ServiceList.css'; // Assuming you'll create a CSS file for this

const ServiceList = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Placeholder for fetching services. In a real app, you'd have an endpoint to list all services.
  // For now, we'll simulate a list or fetch by known IDs if available.
  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        setError(null);
        // Simulate fetching a list of services.
        // In a real application, you would call an API that returns a list of services.
        // Example: const response = await plugnotasService.getAllServices();
        // For now, we'll use a static placeholder or try to fetch a known service.
        const placeholderServices = [
          {
            idIntegracao: 'A001XT',
            codigo: '1.02',
            discriminacao: 'Descrição dos serviços prestados, utilize | para quebra de linha na impressão.',
            valor: { servico: 100.50 },
            cnae: '4751201',
          },
          {
            idIntegracao: 'B002YZ',
            codigo: '2.01',
            discriminacao: 'Consultoria em TI',
            valor: { servico: 250.00 },
            cnae: '6204000',
          },
          // Add more placeholder services as needed
        ];
        setServices(placeholderServices);
      } catch (err) {
        console.error("Erro ao carregar serviços:", err);
        setError('Falha ao carregar a lista de serviços.');
      } finally {
        setLoading(false);
      }
    };

    fetchServices();
  }, []);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleEdit = (serviceId) => {
    // Implement edit logic, e.g., navigate to a service edit form
    console.log('Edit service:', serviceId);
    // navigate(`/servicos/editar/${serviceId}`);
  };

  const handleDelete = (serviceId) => {
    // Implement delete logic
    console.log('Delete service:', serviceId);
    if (window.confirm(`Tem certeza que deseja excluir o serviço com ID ${serviceId}?`)) {
      // Call API to delete service
      // After successful deletion, update the services list
      setServices(prev => prev.filter(s => s.idIntegracao !== serviceId));
    }
  };

  if (loading) {
    return <div className="loading-state">Carregando serviços...</div>;
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  return (
    <div className="service-list-container">
      <div className="list-header">
        <h2>Serviços Cadastrados</h2>
        <button className="btn-primary" onClick={() => navigate('/servicos/cadastrar')}>
          Cadastrar Novo Serviço
        </button>
      </div>

      {services.length === 0 ? (
        <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
          Nenhum serviço cadastrado.
        </Typography>
      ) : (
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 600 }}>
            <Table stickyHeader aria-label="tabela de serviços">
              <TableHead>
                <TableRow>
                  <TableCell>ID Integração</TableCell>
                  <TableCell>Código</TableCell>
                  <TableCell>Discriminação</TableCell>
                  <TableCell align="right">Valor (R$)</TableCell>
                  <TableCell>CNAE</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((service) => (
                    <TableRow key={service.idIntegracao}>
                      <TableCell>{service.idIntegracao}</TableCell>
                      <TableCell>{service.codigo}</TableCell>
                      <TableCell>{service.discriminacao}</TableCell>
                      <TableCell align="right">
                        {service.valor?.servico ? `R$ ${service.valor.servico.toFixed(2).replace('.', ',')}` : 'N/A'}
                      </TableCell>
                      <TableCell>{service.cnae}</TableCell>
                      <TableCell align="center">
                        <IconButton aria-label="editar" onClick={() => handleEdit(service.idIntegracao)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton aria-label="excluir" onClick={() => handleDelete(service.idIntegracao)}>
                          <DeleteIcon />
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
            count={services.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Linhas por página:"
            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
          />
        </Paper>
      )}
    </div>
  );
};

export default ServiceList;
