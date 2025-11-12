import React, { useState, useEffect } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  TablePagination, IconButton, Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import './Desif.css';

const Desif = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [declarationForm, setDeclarationForm] = useState({
    periodoReferencia: '',
    tipoDeclaracao: 'mensal', // mensal, retificadora, etc.
    xmlFile: null,
    xmlContent: '', // To hold content if manually pasted or read
  });

  const [declarations, setDeclarations] = useState([]); // Placeholder for past declarations
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    // Simulate fetching past declarations
    setLoading(true);
    setTimeout(() => {
      setDeclarations([
        { id: '1', periodo: '2023-01', tipo: 'Mensal', status: 'Enviado', dataEnvio: '2023-02-10' },
        { id: '2', periodo: '2023-02', tipo: 'Mensal', status: 'Processando', dataEnvio: '2023-03-15' },
        { id: '3', periodo: '2023-03', tipo: 'Retificadora', status: 'Erro', dataEnvio: '2023-04-20' },
      ]);
      setLoading(false);
    }, 1000);
  }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setDeclarationForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDeclarationForm(prev => ({ ...prev, xmlFile: file }));
      // Optionally read file content for display/preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setDeclarationForm(prev => ({ ...prev, xmlContent: event.target.result }));
      };
      reader.readAsText(file);
    } else {
      setDeclarationForm(prev => ({ ...prev, xmlFile: null, xmlContent: '' }));
    }
  };

  const handleXmlContentChange = (e) => {
    setDeclarationForm(prev => ({ ...prev, xmlContent: e.target.value }));
  };

  const handleSubmitDeclaration = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!declarationForm.periodoReferencia || !declarationForm.tipoDeclaracao || (!declarationForm.xmlFile && !declarationForm.xmlContent)) {
      setError('Por favor, preencha o período de referência, o tipo de declaração e forneça um arquivo XML ou cole o conteúdo.');
      setLoading(false);
      return;
    }

    try {
      // Simulate API call for submission
      console.log('Submitting DES-IF declaration:', declarationForm);
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay

      const newDeclaration = {
        id: String(declarations.length + 1),
        periodo: declarationForm.periodoReferencia,
        tipo: declarationForm.tipoDeclaracao === 'mensal' ? 'Mensal' : 'Retificadora', // Map to display text
        status: 'Enviado',
        dataEnvio: new Date().toLocaleString(),
      };
      setDeclarations(prev => [...prev, newDeclaration]);
      setSuccess('Declaração DES-IF enviada com sucesso!');
      setDeclarationForm({
        periodoReferencia: '',
        tipoDeclaracao: 'mensal',
        xmlFile: null,
        xmlContent: '',
      });
    } catch (err) {
      console.error("Erro ao enviar declaração DES-IF:", err);
      setError(err.message || 'Erro ao enviar declaração DES-IF.');
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

  const handleViewDetails = (id) => {
    console.log('View details for declaration:', id);
    // Implement logic to show declaration details
  };

  const handleDownload = (id) => {
    console.log('Download declaration:', id);
    // Implement logic to download the declaration file
  };

  return (
    <div className="desif-container">
      <div className="desif-header">
        <h1>Declaração Eletrônica de Serviços de Instituições Financeiras (DES-IF)</h1>
      </div>

      {error && <div className="alert alert-error"><p>{error}</p></div>}
      {success && <div className="alert alert-success"><p>{success}</p></div>}

      <section className="desif-form-section">
        <h2>Enviar Nova Declaração DES-IF</h2>
        <form onSubmit={handleSubmitDeclaration} className="desif-form">
          <div className="form-row">
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 200 }}>
              <InputLabel id="periodo-referencia-label">Período de Referência *</InputLabel>
              <TextField
                labelId="periodo-referencia-label"
                type="month"
                name="periodoReferencia"
                value={declarationForm.periodoReferencia}
                onChange={handleFormChange}
                required
                InputLabelProps={{ shrink: true }}
              />
            </FormControl>
            <FormControl variant="outlined" sx={{ m: 1, minWidth: 200 }}>
              <InputLabel id="tipo-declaracao-label">Tipo de Declaração *</InputLabel>
              <Select
                labelId="tipo-declaracao-label"
                id="tipoDeclaracao"
                name="tipoDeclaracao"
                value={declarationForm.tipoDeclaracao}
                onChange={handleFormChange}
                label="Tipo de Declaração"
                required
              >
                <MenuItem value="mensal">Mensal</MenuItem>
                <MenuItem value="retificadora">Retificadora</MenuItem>
              </Select>
            </FormControl>
          </div>

          <div className="form-group file-upload-group">
            <input
              accept=".xml"
              style={{ display: 'none' }}
              id="xml-upload-button"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="xml-upload-button">
              <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}>
                Upload XML
              </Button>
            </label>
            {declarationForm.xmlFile && (
              <Typography variant="body2" sx={{ ml: 2 }}>
                Arquivo selecionado: {declarationForm.xmlFile.name}
              </Typography>
            )}
          </div>

          <div className="form-group">
            <TextField
              label="Ou cole o conteúdo XML aqui"
              multiline
              rows={10}
              fullWidth
              name="xmlContent"
              value={declarationForm.xmlContent}
              onChange={handleXmlContentChange}
              variant="outlined"
              margin="normal"
            />
          </div>

          <div className="form-actions">
            <Button type="submit" variant="contained" color="primary" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Declaração'}
            </Button>
          </div>
        </form>
      </section>

      <section className="desif-list-section">
        <h2>Declarações Anteriores</h2>
        {loading ? (
          <div className="loading-state">Carregando declarações...</div>
        ) : declarations.length === 0 ? (
          <Typography variant="h6" color="textSecondary" align="center" sx={{ mt: 4 }}>
            Nenhuma declaração DES-IF encontrada.
          </Typography>
        ) : (
          <Paper sx={{ width: '100%', overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 440 }}>
              <Table stickyHeader aria-label="tabela de declarações DES-IF">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>Período</TableCell>
                    <TableCell>Tipo</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Data de Envio</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {declarations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((declaration) => (
                      <TableRow key={declaration.id}>
                        <TableCell>{declaration.id}</TableCell>
                        <TableCell>{declaration.periodo}</TableCell>
                        <TableCell>{declaration.tipo}</TableCell>
                        <TableCell>{declaration.status}</TableCell>
                        <TableCell>{declaration.dataEnvio}</TableCell>
                        <TableCell align="center">
                          <IconButton aria-label="ver detalhes" onClick={() => handleViewDetails(declaration.id)}>
                            <VisibilityIcon />
                          </IconButton>
                          <IconButton aria-label="download" onClick={() => handleDownload(declaration.id)}>
                            <DownloadIcon />
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
              count={declarations.length}
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

export default Desif;