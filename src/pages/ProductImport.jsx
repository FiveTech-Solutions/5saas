
import React, { useState, useEffect } from 'react';
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
    LinearProgress,
    TextField,
    InputAdornment
} from '@mui/material';
import { CloudUpload, ArrowBack, Save } from '@mui/icons-material';
import { createProductsBatch } from '../services/productService';
import { NumericFormat } from 'react-number-format';

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

            // Inicializar produtos com valores padrão se necessário
            const productsWithDefaults = products.map(p => ({
                ...p,
                margem_lucro: p.margem_lucro || 0,
                preco_venda: p.preco_venda || p.preco_custo // Se venda for 0, sugere custo inicial
            }));

            setParsedProducts(productsWithDefaults);
            setSuccess(`${products.length} produto(s) encontrado(s) no XML.Revise os dados abaixo antes de importar.`);
        } catch (err) {
            logger.error('Error parsing XML:', err);
            setError(err.message || 'Erro ao processar arquivo XML');
        } finally {
            setLoading(false);
        }
    };

    const handleProductChange = (index, field, value) => {
        const updatedProducts = [...parsedProducts];
        const product = { ...updatedProducts[index] };

        if (field === 'nome') {
            product.nome = value;
        } else if (field === 'margem_lucro') {
            const margem = parseFloat(value) || 0;
            product.margem_lucro = margem;
            // Recalcula preço de venda baseado na margem
            // Preço Venda = Custo + (Custo * Margem / 100)
            product.preco_venda = product.preco_custo * (1 + margem / 100);
        } else if (field === 'preco_venda') {
            const venda = parseFloat(value) || 0;
            product.preco_venda = venda;
            // Recalcula margem baseada no preço de venda
            // Margem = ((Venda - Custo) / Custo) * 100
            if (product.preco_custo > 0) {
                product.margem_lucro = ((venda - product.preco_custo) / product.preco_custo) * 100;
            }
        }

        updatedProducts[index] = product;
        setParsedProducts(updatedProducts);
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
                    Faça upload do arquivo XML da Nota Fiscal Eletrônica. Você poderá revisar e ajustar os preços antes de finalizar a importação.
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

                {loading && parsedProducts.length === 0 && (
                    <Box display="flex" alignItems="center" gap={2} mt={2}>
                        <CircularProgress size={24} />
                        <Typography>Processando arquivo...</Typography>
                    </Box>
                )}
            </Paper>

            {loading && parsedProducts.length > 0 && (
                <Box sx={{ width: '100%', mb: 3 }}>
                    <LinearProgress variant="determinate" value={progress} />
                    <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                        Importando produtos... {progress}%
                    </Typography>
                </Box>
            )}

            {parsedProducts.length > 0 && !loading && (
                <Paper sx={{ p: 3 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Typography variant="h6">
                            Produtos Encontrados ({parsedProducts.length})
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            onClick={handleImportProducts}
                        >
                            Confirmar Importação
                        </Button>
                    </Box>

                    <TableContainer sx={{ maxHeight: 600 }}>
                        <Table stickyHeader size="small">
                            <TableHead>
                                <TableRow>
                                    <TableCell>Código</TableCell>
                                    <TableCell width="30%">Nome do Produto</TableCell>
                                    <TableCell>Unidade</TableCell>
                                    <TableCell>Custo (R$)</TableCell>
                                    <TableCell width="15%">Margem (%)</TableCell>
                                    <TableCell width="15%">Venda (R$)</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {parsedProducts.map((product, index) => (
                                    <TableRow key={index}>
                                        <TableCell>{product.codigo}</TableCell>
                                        <TableCell>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                value={product.nome}
                                                onChange={(e) => handleProductChange(index, 'nome', e.target.value)}
                                            />
                                        </TableCell>
                                        <TableCell>{product.unidade}</TableCell>
                                        <TableCell>
                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.preco_custo)}
                                        </TableCell>
                                        <TableCell>
                                            <NumericFormat
                                                customInput={TextField}
                                                size="small"
                                                fullWidth
                                                value={product.margem_lucro}
                                                onValueChange={(values) => handleProductChange(index, 'margem_lucro', values.floatValue)}
                                                decimalScale={2}
                                                fixedDecimalScale
                                                suffix="%"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <NumericFormat
                                                customInput={TextField}
                                                size="small"
                                                fullWidth
                                                value={product.preco_venda}
                                                onValueChange={(values) => handleProductChange(index, 'preco_venda', values.floatValue)}
                                                decimalScale={2}
                                                fixedDecimalScale
                                                prefix="R$ "
                                                thousandSeparator="."
                                                decimalSeparator=","
                                            />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}
        </div>
    );
};

export default ProductImport;
