import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { emitirNFe } from '../../services/nfeTechnospeedService';
import { createNFe } from '../../services/nfeService';
import { getProducts } from '../../services/productService';
import { getCustomers } from '../../services/customerService';
import logger from '../../utils/logger';
import {
    TextField,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Grid,
    Paper,
    Typography,
    Stepper,
    Step,
    StepLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress,
    Alert,
    Snackbar,
    Switch, FormControlLabel,
} from '@mui/material';
import { Delete as DeleteIcon, Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import './NFeForm.css';

const steps = ['Dados Gerais', 'Destinatário', 'Produtos', 'Pagamento', 'Resumo'];

const NFeForm = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeStep, setActiveStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    // Data Lists
    const [productsList, setProductsList] = useState([]);
    const [customersList, setCustomersList] = useState([]);

    // Form State
    const [formData, setFormData] = useState({
        naturezaOperacao: 'VENDA DE MERCADORIA',
        tipoOperacao: '1', // 1-Saída
        finalidade: '1', // 1-Normal
        presencial: '1', // 1-Presencial
        consumidorFinal: false,
        dataEmissao: new Date().toISOString().split('T')[0],
    });

    const [destinatario, setDestinatario] = useState({
        cpfCnpj: '',
        razaoSocial: '',
        email: '',
        endereco: {
            logradouro: '',
            numero: '',
            bairro: '',
            codigoCidade: '',
            descricaoCidade: '',
            estado: '',
            cep: ''
        }
    });

    const [items, setItems] = useState([]);
    const [payments, setPayments] = useState([{ meio: '01', valor: 0, aVista: true }]);

    // Modal State for Products
    const [openProductModal, setOpenProductModal] = useState(false);
    const [showTaxes, setShowTaxes] = useState(false);
    const [currentItem, setCurrentItem] = useState({
        produtoId: '',
        codigo: '',
        descricao: '',
        ncm: '',
        cest: '',
        cfop: '5101',
        unidade: 'UN',
        quantidade: 1,
        valorUnitario: 0,
        valorTotal: 0,
        tributos: {
            icms: { cst: '00', aliquota: 0, baseCalculo: 0, valor: 0 },
            pis: { cst: '99', aliquota: 0, baseCalculo: 0, valor: 0 },
            cofins: { cst: '99', aliquota: 0, baseCalculo: 0, valor: 0 }
        }
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            // Load products
            const products = await getProducts();
            setProductsList(products || []);

            // Load customers (mock for now if service doesn't exist)
            // const customers = await getCustomers();
            // setCustomersList(customers || []);
        } catch (err) {
            logger.error('Error loading initial data:', err);
            setError('Erro ao carregar dados iniciais.');
        }
    };

    const handleNext = () => {
        if (validateStep(activeStep)) {
            setActiveStep((prevActiveStep) => prevActiveStep + 1);
        }
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const validateStep = (step) => {
        switch (step) {
            case 0: // Dados Gerais
                if (!formData.naturezaOperacao) {
                    setError('Informe a natureza da operação');
                    return false;
                }
                return true;
            case 1: // Destinatário
                if (!destinatario.cpfCnpj || !destinatario.razaoSocial) {
                    setError('Informe CPF/CNPJ e Razão Social do destinatário');
                    return false;
                }
                return true;
            case 2: // Produtos
                if (items.length === 0) {
                    setError('Adicione pelo menos um produto');
                    return false;
                }
                return true;
            case 3: // Pagamento
                const totalPagamentos = payments.reduce((sum, p) => sum + Number(p.valor), 0);
                const totalNota = items.reduce((sum, i) => sum + Number(i.valorTotal), 0);
                if (Math.abs(totalPagamentos - totalNota) > 0.01) {
                    setError(`Valor dos pagamentos (R$ ${totalPagamentos.toFixed(2)}) difere do total da nota (R$ ${totalNota.toFixed(2)})`);
                    return false;
                }
                return true;
            default:
                return true;
        }
    };

    const handleAddItem = () => {
        if (!currentItem.descricao || !currentItem.valorUnitario || !currentItem.quantidade) {
            setError('Preencha os dados do item');
            return;
        }

        const newItem = {
            ...currentItem,
            valorTotal: currentItem.quantidade * currentItem.valorUnitario,
            // Recalculate taxes based on total value
            tributos: {
                ...currentItem.tributos,
                icms: { ...currentItem.tributos.icms, baseCalculo: currentItem.quantidade * currentItem.valorUnitario },
                pis: { ...currentItem.tributos.pis, baseCalculo: currentItem.quantidade * currentItem.valorUnitario },
                cofins: { ...currentItem.tributos.cofins, baseCalculo: currentItem.quantidade * currentItem.valorUnitario }
            }
        };

        setItems([...items, newItem]);
        setOpenProductModal(false);
        resetCurrentItem();

        // Update payment total automatically if single payment
        if (payments.length === 1) {
            const newTotal = [...items, newItem].reduce((sum, i) => sum + i.valorTotal, 0);
            setPayments([{ ...payments[0], valor: newTotal }]);
        }
    };

    const resetCurrentItem = () => {
        setCurrentItem({
            produtoId: '',
            codigo: '',
            descricao: '',
            ncm: '',
            cest: '',
            cfop: '5101',
            unidade: 'UN',
            quantidade: 1,
            valorUnitario: 0,
            valorTotal: 0,
            tributos: {
                icms: { cst: '00', aliquota: 0, baseCalculo: 0, valor: 0 },
                pis: { cst: '99', aliquota: 0, baseCalculo: 0, valor: 0 },
                cofins: { cst: '99', aliquota: 0, baseCalculo: 0, valor: 0 }
            }
        });
    };

    const handleProductSelect = (productId) => {
        const product = productsList.find(p => p.id === productId);
        if (product) {
            setCurrentItem({
                ...currentItem,
                produtoId: product.id,
                codigo: product.codigo || product.id.substring(0, 6),
                descricao: product.nome,
                ncm: product.ncm || '',
                cest: product.cest || '',
                valorUnitario: product.preco_venda || 0,
                unidade: product.unidade || 'UN'
            });
        }
    };

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            // 1. Prepare Payload for Technospeed
            const payload = [{
                idIntegracao: crypto.randomUUID(), // Generate unique ID
                presencial: formData.presencial,
                consumidorFinal: formData.consumidorFinal,
                natureza: formData.naturezaOperacao,
                emitente: {
                    cpfCnpj: '08187168000160' // Should come from company settings
                },
                destinatario: {
                    cpfCnpj: destinatario.cpfCnpj.replace(/\D/g, ''),
                    razaoSocial: destinatario.razaoSocial,
                    email: destinatario.email,
                    endereco: {
                        tipoLogradouro: destinatario.endereco.logradouro.split(' ')[0] || 'Rua',
                        logradouro: destinatario.endereco.logradouro,
                        numero: destinatario.endereco.numero,
                        bairro: destinatario.endereco.bairro,
                        codigoCidade: destinatario.endereco.codigoCidade,
                        descricaoCidade: destinatario.endereco.descricaoCidade,
                        estado: destinatario.endereco.estado,
                        cep: destinatario.endereco.cep.replace(/\D/g, '')
                    }
                },
                itens: items.map((item, index) => ({
                    codigo: item.codigo || (index + 1).toString(),
                    descricao: item.descricao,
                    ncm: item.ncm.replace(/\D/g, ''),
                    cest: item.cest ? item.cest.replace(/\D/g, '') : undefined,
                    cfop: item.cfop,
                    valorUnitario: {
                        comercial: Number(item.valorUnitario),
                        tributavel: Number(item.valorUnitario)
                    },
                    valor: Number(item.valorTotal),
                    tributos: {
                        icms: {
                            origem: "0", // Nacional
                            cst: item.tributos.icms.cst,
                            baseCalculo: {
                                modalidadeDeterminacao: 0,
                                valor: Number(item.tributos.icms.baseCalculo)
                            },
                            aliquota: Number(item.tributos.icms.aliquota),
                            valor: Number(item.tributos.icms.valor)
                        },
                        pis: {
                            cst: item.tributos.pis.cst,
                            baseCalculo: {
                                valor: Number(item.tributos.pis.baseCalculo),
                                quantidade: 0
                            },
                            aliquota: Number(item.tributos.pis.aliquota),
                            valor: Number(item.tributos.pis.valor)
                        },
                        cofins: {
                            cst: item.tributos.cofins.cst,
                            baseCalculo: {
                                valor: Number(item.tributos.cofins.baseCalculo)
                            },
                            aliquota: Number(item.tributos.cofins.aliquota),
                            valor: Number(item.tributos.cofins.valor)
                        }
                    }
                })),
                pagamentos: payments.map(p => ({
                    aVista: p.aVista,
                    meio: p.meio,
                    valor: Number(p.valor)
                })),
                responsavelTecnico: {
                    cpfCnpj: "08187168000160",
                    nome: "Technospeed",
                    email: "contato@tecnospeed.com.br",
                    telefone: {
                        ddd: "44",
                        numero: "30379500"
                    }
                }
            }];

            logger.debug('Sending NF-e payload:', payload);

            const response = await emitirNFe(payload);

            // 3. Save to Supabase (Internal Record)
            // Note: In a real app, you might want to save *before* sending to ensure data integrity
            // await createNFe({ ... });

            setSuccess('NF-e enviada com sucesso! Protocolo: ' + (response.protocol || 'N/A'));

            // Redirect after delay
            setTimeout(() => {
                navigate('/nfe');
            }, 3000);

        } catch (err) {
            logger.error('Error emitting NF-e:', err);
            setError(err.message || 'Erro ao emitir NF-e');
        } finally {
            setLoading(false);
        }
    };

    // Render Steps
    const renderGeneralData = () => (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Natureza da Operação"
                    value={formData.naturezaOperacao}
                    onChange={(e) => setFormData({ ...formData, naturezaOperacao: e.target.value })}
                />
            </Grid>
            <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                    <InputLabel>Tipo Operação</InputLabel>
                    <Select
                        value={formData.tipoOperacao}
                        label="Tipo Operação"
                        onChange={(e) => setFormData({ ...formData, tipoOperacao: e.target.value })}
                    >
                        <MenuItem value="1">Saída</MenuItem>
                        <MenuItem value="0">Entrada</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
                <FormControl fullWidth>
                    <InputLabel>Presença</InputLabel>
                    <Select
                        value={formData.presencial}
                        label="Presença"
                        onChange={(e) => setFormData({ ...formData, presencial: e.target.value })}
                    >
                        <MenuItem value="1">Presencial</MenuItem>
                        <MenuItem value="2">Internet</MenuItem>
                        <MenuItem value="9">Outros</MenuItem>
                    </Select>
                </FormControl>
            </Grid>
        </Grid>
    );

    const renderDestinatario = () => (
        <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="CPF/CNPJ"
                    value={destinatario.cpfCnpj}
                    onChange={(e) => setDestinatario({ ...destinatario, cpfCnpj: e.target.value })}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Razão Social / Nome"
                    value={destinatario.razaoSocial}
                    onChange={(e) => setDestinatario({ ...destinatario, razaoSocial: e.target.value })}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Email"
                    value={destinatario.email}
                    onChange={(e) => setDestinatario({ ...destinatario, email: e.target.value })}
                />
            </Grid>
            <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Endereço</Typography>
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField
                    fullWidth
                    label="CEP"
                    value={destinatario.endereco.cep}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, cep: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={6}>
                <TextField
                    fullWidth
                    label="Logradouro"
                    value={destinatario.endereco.logradouro}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, logradouro: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField
                    fullWidth
                    label="Número"
                    value={destinatario.endereco.numero}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, numero: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label="Bairro"
                    value={destinatario.endereco.bairro}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, bairro: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={4}>
                <TextField
                    fullWidth
                    label="Cidade (Nome)"
                    value={destinatario.endereco.descricaoCidade}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, descricaoCidade: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField
                    fullWidth
                    label="Cód. IBGE"
                    value={destinatario.endereco.codigoCidade}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, codigoCidade: e.target.value } })}
                />
            </Grid>
            <Grid item xs={12} md={2}>
                <TextField
                    fullWidth
                    label="UF"
                    value={destinatario.endereco.estado}
                    onChange={(e) => setDestinatario({ ...destinatario, endereco: { ...destinatario.endereco, estado: e.target.value } })}
                />
            </Grid>
        </Grid>
    );

    const renderProducts = () => (
        <div>
            <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setOpenProductModal(true)}
                sx={{ mb: 2 }}
            >
                Adicionar Produto
            </Button>

            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead>
                        <TableRow>
                            <TableCell>Código</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell align="right">Qtd</TableCell>
                            <TableCell align="right">Valor Unit.</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="center">Ações</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {items.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.codigo}</TableCell>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell align="right">{item.quantidade}</TableCell>
                                <TableCell align="right">R$ {Number(item.valorUnitario).toFixed(2)}</TableCell>
                                <TableCell align="right">R$ {Number(item.valorTotal).toFixed(2)}</TableCell>
                                <TableCell align="center">
                                    <IconButton onClick={() => {
                                        const newItems = [...items];
                                        newItems.splice(index, 1);
                                        setItems(newItems);
                                    }}>
                                        <DeleteIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {items.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center">Nenhum produto adicionado</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <div className="totals-section">
                <div className="total-row grand-total">
                    <span>Total da Nota</span>
                    <span>R$ {items.reduce((sum, i) => sum + Number(i.valorTotal), 0).toFixed(2)}</span>
                </div>
            </div>
        </div>
    );

    const renderPayments = () => (
        <Grid container spacing={2}>
            {payments.map((payment, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                            <InputLabel>Meio de Pagamento</InputLabel>
                            <Select
                                value={payment.meio}
                                label="Meio de Pagamento"
                                onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].meio = e.target.value;
                                    setPayments(newPayments);
                                }}
                            >
                                <MenuItem value="01">Dinheiro</MenuItem>
                                <MenuItem value="02">Cheque</MenuItem>
                                <MenuItem value="03">Cartão de Crédito</MenuItem>
                                <MenuItem value="04">Cartão de Débito</MenuItem>
                                <MenuItem value="15">Boleto Bancário</MenuItem>
                                <MenuItem value="17">PIX</MenuItem>
                                <MenuItem value="90">Sem Pagamento</MenuItem>
                                <MenuItem value="99">Outros</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Valor"
                            type="number"
                            value={payment.valor}
                            onChange={(e) => {
                                const newPayments = [...payments];
                                newPayments[index].valor = e.target.value;
                                setPayments(newPayments);
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} md={4} sx={{ display: 'flex', alignItems: 'center' }}>
                        <FormControl fullWidth>
                            <InputLabel>Condição</InputLabel>
                            <Select
                                value={payment.aVista ? 'vista' : 'prazo'}
                                label="Condição"
                                onChange={(e) => {
                                    const newPayments = [...payments];
                                    newPayments[index].aVista = e.target.value === 'vista';
                                    setPayments(newPayments);
                                }}
                            >
                                <MenuItem value="vista">À Vista</MenuItem>
                                <MenuItem value="prazo">A Prazo</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </React.Fragment>
            ))}
        </Grid>
    );

    const renderSummary = () => (
        <div className="summary-section">
            <Typography variant="h6" gutterBottom>Resumo da NF-e</Typography>

            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Emitente</Typography>
                        <Typography variant="body1">CNPJ: 08.187.168/0001-60</Typography>
                        <Typography variant="body1">Natureza: {formData.naturezaOperacao}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">Destinatário</Typography>
                        <Typography variant="body1">{destinatario.razaoSocial}</Typography>
                        <Typography variant="body2">{destinatario.cpfCnpj}</Typography>
                        <Typography variant="body2">{destinatario.endereco.descricaoCidade} - {destinatario.endereco.estado}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary" gutterBottom>Itens ({items.length})</Typography>
                        {items.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', padding: '4px 0' }}>
                                <span>{item.quantidade}x {item.descricao}</span>
                                <span>R$ {Number(item.valorTotal).toFixed(2)}</span>
                            </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', fontWeight: 'bold' }}>
                            <span>TOTAL</span>
                            <span>R$ {items.reduce((sum, i) => sum + Number(i.valorTotal), 0).toFixed(2)}</span>
                        </div>
                    </Paper>
                </Grid>
            </Grid>
        </div>
    );

    return (
        <div className="nfe-form-container">
            <div className="nfe-header">
                <h2>Emissão de NF-e</h2>
            </div>

            <Stepper activeStep={activeStep} className="nfe-stepper">
                {steps.map((label, index) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

            <div className="form-section">
                {activeStep === 0 && renderGeneralData()}
                {activeStep === 1 && renderDestinatario()}
                {activeStep === 2 && renderProducts()}
                {activeStep === 3 && renderPayments()}
                {activeStep === 4 && renderSummary()}
            </div>

            <div className="form-actions">
                <Button
                    disabled={activeStep === 0}
                    onClick={handleBack}
                    variant="outlined"
                >
                    Voltar
                </Button>

                {activeStep === steps.length - 1 ? (
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Emitir NF-e'}
                    </Button>
                ) : (
                    <Button
                        variant="contained"
                        onClick={handleNext}
                    >
                        Próximo
                    </Button>
                )}
            </div>

            {/* Product Modal */}
            <Dialog open={openProductModal} onClose={() => setOpenProductModal(false)} maxWidth="md" fullWidth>
                <DialogTitle>Adicionar Produto</DialogTitle>
                <DialogContent>
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                        <Grid item xs={12}>
                            <FormControl fullWidth>
                                <InputLabel>Selecionar Produto Cadastrado</InputLabel>
                                <Select
                                    value={currentItem.produtoId}
                                    label="Selecionar Produto Cadastrado"
                                    onChange={(e) => handleProductSelect(e.target.value)}
                                >
                                    <MenuItem value=""><em>Nenhum (Preenchimento Manual)</em></MenuItem>
                                    {productsList.map(p => (
                                        <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="Código"
                                value={currentItem.codigo}
                                onChange={(e) => setCurrentItem({ ...currentItem, codigo: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <TextField
                                fullWidth
                                label="Descrição"
                                value={currentItem.descricao}
                                onChange={(e) => setCurrentItem({ ...currentItem, descricao: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="NCM"
                                value={currentItem.ncm}
                                onChange={(e) => setCurrentItem({ ...currentItem, ncm: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={2}>
                            <TextField
                                fullWidth
                                label="CFOP"
                                value={currentItem.cfop}
                                onChange={(e) => setCurrentItem({ ...currentItem, cfop: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Valor Unitário"
                                type="number"
                                value={currentItem.valorUnitario}
                                onChange={(e) => setCurrentItem({ ...currentItem, valorUnitario: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Quantidade"
                                type="number"
                                value={currentItem.quantidade}
                                onChange={(e) => setCurrentItem({ ...currentItem, quantidade: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="Total"
                                value={(currentItem.quantidade * currentItem.valorUnitario).toFixed(2)}
                                disabled
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <Typography variant="subtitle2" sx={{ mt: 2 }}>Impostos (Simplificado)</Typography>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="CST ICMS"
                                value={currentItem.tributos.icms.cst}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tributos: { ...currentItem.tributos, icms: { ...currentItem.tributos.icms, cst: e.target.value } }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="CST PIS"
                                value={currentItem.tributos.pis.cst}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tributos: { ...currentItem.tributos, pis: { ...currentItem.tributos.pis, cst: e.target.value } }
                                })}
                            />
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <TextField
                                fullWidth
                                label="CST COFINS"
                                value={currentItem.tributos.cofins.cst}
                                onChange={(e) => setCurrentItem({
                                    ...currentItem,
                                    tributos: { ...currentItem.tributos, cofins: { ...currentItem.tributos.cofins, cst: e.target.value } }
                                })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenProductModal(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={handleAddItem}>Adicionar</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default NFeForm;
