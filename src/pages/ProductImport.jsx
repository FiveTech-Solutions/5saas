import React, { useState } from 'react';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import {
    Button,
    Paper,
    Typography,
    Alert,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Box,
    LinearProgress
} from '@mui/material';
import { CloudUpload, ArrowBack } from '@mui/icons-material';
import { createProductsBatch } from '../services/productService';

const ProductImport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [parsedProducts, setParsedProducts] = useState([]);
    const [progress, setProgress] = useState(0);

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.xml')) {
            setError('Por favor, selecione um arquivo XML válido');
            return;
        }

        setLoading(true);
        setError(null);
        setParsedProducts([]);

        try {
            const text = await file.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, 'text/xml');

            // Check for parsing errors
            const parserError = xmlDoc.querySelector('parsererror');
            if (parserError) {
                throw new Error('Arquivo XML inválido ou corrompido');
            }

            // Validar se é uma NF-e válida
            const { validateNFeXML, parseNFeXML } = await import('../utils/nfeXmlParser');

            if (!validateNFeXML(xmlDoc)) {
                throw new Error('XML não é uma NF-e válida ou não contém produtos');
            }

            // Extrair produtos usando o parser dedicado
            const products = parseNFeXML(xmlDoc);

            if (products.length === 0) {
                throw new Error('Nenhum produto encontrado no XML');
            }

            setParsedProducts(products);
            setSuccess(`${products.length} produto(s) encontrado(s) no XML`);
        } catch (err) {
            logger.error('Error parsing XML:', err);
            setError(err.message || 'Erro ao processar arquivo XML');
        } finally {
            setLoading(false);
        }
    };

    const handleImportProducts = async () => {
        setLoading(true);
        setError(null);
        setProgress(0);

        try {
            const results = await createProductsBatch(parsedProducts, (processed, total) => {
                const percentage = Math.round((processed / total) * 100);
                setProgress(percentage);
            });

            if (results) {
                let message = `Importação concluída: ${results.success} produto(s) importado(s).`;

                if (results.duplicates > 0) {
                    message += ` ${results.duplicates} produto(s) duplicado(s) ignorado(s).`;
                }

                if (results.failed > 0) {
                    message += ` ${results.failed} falha(s).`;
                }

                setSuccess(message);

                if (results.success > 0) {
                    setTimeout(() => {
                        navigate('/produtos');
                    }, 2000);
                }
            }
        } catch (err) {
            logger.error('Error importing products:', err);
            setError('Erro ao importar produtos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
            <Box display="flex" alignItems="center" gap={2} mb={3}>
                <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/produtos')}
                >
                    Voltar
                </Button>
                <Typography variant="h4">Importar Produtos de NF-e</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                    Selecione o arquivo XML da NF-e
                </Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                    Faça upload do arquivo XML da Nota Fiscal Eletrônica para importar os produtos automaticamente.
                </Typography>

                <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUpload />}
                    disabled={loading}
                >
                    {loading ? 'Processando...' : 'Selecionar Arquivo XML'}
                    <input
                        type="file"
                        hidden
                        accept=".xml"
                        onChange={handleFileUpload}
                    />
                </Button>

                {loading && (
                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <CircularProgress size={24} />
                        <Typography>Processando arquivo...</Typography>
                    </Box>
                )}
            </Paper>

            {parsedProducts.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>
                        Produtos Encontrados ({parsedProducts.length})
                    </Typography>

                    <TableContainer sx={{ mb: 2 }}>
                        <Table size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Código</TableCell>
                                    <TableCell>Nome</TableCell>
                                    <TableCell>NCM</TableCell>
                                    <TableCell>Unidade</TableCell>
                                    <TableCell align="right">Preço</TableCell>
                                    <TableCell align="center">Impostos</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {parsedProducts.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{product.codigo}</TableCell>
                                        <TableCell>{product.nome}</TableCell>
                                        <TableCell>{product.ncm}</TableCell>
                                        <TableCell>{product.unidade}</TableCell>
                                        <TableCell align="right">
                                            R$ {product.preco_venda.toFixed(2)}
                                        </TableCell>
                                        <TableCell align="center">
                                            {product.impostos && product.impostos.length > 0 ? (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        backgroundColor: 'success.light',
                                                        color: 'success.dark',
                                                        px: 1,
                                                        py: 0.5,
                                                        borderRadius: 1,
                                                        fontSize: '0.75rem',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    {product.impostos.length} imposto(s)
                                                </Box>
                                            ) : (
                                                <Box
                                                    component="span"
                                                    sx={{
                                                        color: 'text.secondary',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    Nenhum
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleImportProducts}
                        disabled={loading}
                    >
                        {loading ? 'Importando...' : 'Importar Produtos'}
                    </Button>

                    {loading && (
                        <Box sx={{ width: '100%', mt: 2 }}>
                            <LinearProgress variant="determinate" value={progress} />
                            <Typography variant="caption" color="textSecondary" align="center" display="block" mt={1}>
                                {progress}% concluído
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}
        </div>
    );
};

export default ProductImport;
