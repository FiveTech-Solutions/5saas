import React, { useState, useEffect } from 'react';
import {
    Box,
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    InputAdornment,
    Alert,
    Tabs,
    Tab,
    Chip,
} from '@mui/material';
import {
    Add,
    Remove,
    Delete,
    Search,
    ShoppingCart,
    Payment,
    Clear,
    CheckCircle,
    History,
    Visibility,
    TrendingUp,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getProducts } from '../../services/productService';
import { createSale, getSales, getSalesStats } from '../../services/salesService';
import logger from '../../utils/logger';

const Sales = () => {
    const [activeTab, setActiveTab] = useState(0);
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState([]);
    const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [discount, setDiscount] = useState(0);
    const [successMessage, setSuccessMessage] = useState('');

    // Histórico
    const [salesHistory, setSalesHistory] = useState([]);
    const [salesStats, setSalesStats] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
    const [dateFilter, setDateFilter] = useState({
        startDate: format(new Date(), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 1) {
            loadSalesHistory();
            loadSalesStats();
        }
    }, [activeTab, dateFilter]);

    useEffect(() => {
        if (searchTerm) {
            const filtered = products.filter(
                (p) =>
                    p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.codigo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    p.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase())
            );
            setFilteredProducts(filtered);
        } else {
            setFilteredProducts(products);
        }
    }, [searchTerm, products]);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            logger.error('Error loading products:', error);
        }
    };

    const loadSalesHistory = async () => {
        try {
            const data = await getSales(dateFilter);
            setSalesHistory(data);
        } catch (error) {
            logger.error('Error loading sales history:', error);
        }
    };

    const loadSalesStats = async () => {
        try {
            const stats = await getSalesStats(dateFilter.startDate, dateFilter.endDate);
            setSalesStats(stats);
        } catch (error) {
            logger.error('Error loading sales stats:', error);
        }
    };

    const addToCart = (product) => {
        const existingItem = cart.find((item) => item.id === product.id);
        if (existingItem) {
            updateQuantity(product.id, existingItem.quantity + 1);
        } else {
            setCart([
                ...cart,
                {
                    id: product.id,
                    nome: product.nome,
                    codigo: product.codigo,
                    preco: product.price?.[0]?.preco_venda || 0,
                    quantity: 1,
                },
            ]);
        }
        setSearchTerm('');
    };

    const updateQuantity = (productId, newQuantity) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
        } else {
            setCart(
                cart.map((item) =>
                    item.id === productId ? { ...item, quantity: newQuantity } : item
                )
            );
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.id !== productId));
    };

    const clearCart = () => {
        setCart([]);
        setDiscount(0);
    };

    const calculateSubtotal = () => {
        return cart.reduce((sum, item) => sum + item.preco * item.quantity, 0);
    };

    const calculateTotal = () => {
        const subtotal = calculateSubtotal();
        return subtotal - discount;
    };

    const handlePayment = () => {
        setPaymentDialogOpen(true);
        setPaymentAmount(calculateTotal().toFixed(2));
    };

    const confirmPayment = async () => {
        try {
            const saleData = {
                items: cart,
                subtotal: calculateSubtotal(),
                discount,
                total: calculateTotal(),
                paymentMethod,
            };

            await createSale(saleData);

            setSuccessMessage('Venda finalizada com sucesso!');
            clearCart();
            setPaymentDialogOpen(false);
            setPaymentMethod('');

            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (error) {
            logger.error('Error creating sale:', error);
        }
    };

    const viewSaleDetails = (sale) => {
        setSelectedSale(sale);
        setDetailsDialogOpen(true);
    };

    return (
        <Box sx={{ p: 3, height: '100vh', display: 'flex', flexDirection: 'column' }}>
            {successMessage && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
                    {successMessage}
                </Alert>
            )}

            <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab icon={<ShoppingCart />} label="Nova Venda" iconPosition="start" />
                <Tab icon={<History />} label="Histórico" iconPosition="start" />
            </Tabs>

            {activeTab === 0 && (
                <Grid container spacing={3} sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    {/* Produtos */}
                    <Grid item xs={12} md={7} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Typography variant="h5" gutterBottom>
                                    Produtos
                                </Typography>

                                <TextField
                                    fullWidth
                                    placeholder="Buscar por nome, código ou código de barras..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    sx={{ mb: 2 }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search />
                                            </InputAdornment>
                                        ),
                                        endAdornment: searchTerm && (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={() => setSearchTerm('')}>
                                                    <Clear />
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />

                                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                                    <Grid container spacing={2}>
                                        {filteredProducts.map((product) => (
                                            <Grid item xs={12} sm={6} md={4} key={product.id}>
                                                <Card
                                                    sx={{
                                                        cursor: 'pointer',
                                                        '&:hover': { boxShadow: 3 },
                                                        transition: 'box-shadow 0.2s',
                                                    }}
                                                    onClick={() => addToCart(product)}
                                                >
                                                    <CardContent>
                                                        <Typography variant="subtitle1" noWrap>
                                                            {product.nome}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary">
                                                            Cód: {product.codigo}
                                                        </Typography>
                                                        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
                                                            R$ {(product.price?.[0]?.preco_venda || 0).toFixed(2)}
                                                        </Typography>
                                                    </CardContent>
                                                </Card>
                                            </Grid>
                                        ))}
                                    </Grid>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    {/* Carrinho */}
                    <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Card sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                    <Typography variant="h5">
                                        <ShoppingCart sx={{ mr: 1, verticalAlign: 'middle' }} />
                                        Carrinho
                                    </Typography>
                                    {cart.length > 0 && (
                                        <Button
                                            size="small"
                                            color="error"
                                            startIcon={<Delete />}
                                            onClick={clearCart}
                                        >
                                            Limpar
                                        </Button>
                                    )}
                                </Box>

                                {cart.length === 0 ? (
                                    <Box
                                        sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'text.secondary',
                                        }}
                                    >
                                        <Typography>Carrinho vazio</Typography>
                                    </Box>
                                ) : (
                                    <>
                                        <TableContainer sx={{ flexGrow: 1, overflow: 'auto', mb: 2 }}>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow>
                                                        <TableCell>Produto</TableCell>
                                                        <TableCell align="center">Qtd</TableCell>
                                                        <TableCell align="right">Preço</TableCell>
                                                        <TableCell align="right">Total</TableCell>
                                                        <TableCell align="center">Ações</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {cart.map((item) => (
                                                        <TableRow key={item.id}>
                                                            <TableCell>
                                                                <Typography variant="body2">{item.nome}</Typography>
                                                                <Typography variant="caption" color="text.secondary">
                                                                    {item.codigo}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Box display="flex" alignItems="center" justifyContent="center">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    >
                                                                        <Remove fontSize="small" />
                                                                    </IconButton>
                                                                    <Typography sx={{ mx: 1 }}>{item.quantity}</Typography>
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    >
                                                                        <Add fontSize="small" />
                                                                    </IconButton>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">R$ {item.preco.toFixed(2)}</TableCell>
                                                            <TableCell align="right">
                                                                R$ {(item.preco * item.quantity).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <IconButton
                                                                    size="small"
                                                                    color="error"
                                                                    onClick={() => removeFromCart(item.id)}
                                                                >
                                                                    <Delete fontSize="small" />
                                                                </IconButton>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>

                                        <Divider sx={{ my: 2 }} />

                                        <Box>
                                            <Box display="flex" justifyContent="space-between" mb={1}>
                                                <Typography>Subtotal:</Typography>
                                                <Typography>R$ {calculateSubtotal().toFixed(2)}</Typography>
                                            </Box>

                                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                                                <Typography>Desconto:</Typography>
                                                <TextField
                                                    size="small"
                                                    type="number"
                                                    value={discount}
                                                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                                                    sx={{ width: 120 }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">R$</InputAdornment>,
                                                    }}
                                                />
                                            </Box>

                                            <Divider sx={{ my: 1 }} />

                                            <Box display="flex" justifyContent="space-between" mb={2}>
                                                <Typography variant="h6">Total:</Typography>
                                                <Typography variant="h6" color="primary">
                                                    R$ {calculateTotal().toFixed(2)}
                                                </Typography>
                                            </Box>

                                            <Button
                                                fullWidth
                                                variant="contained"
                                                size="large"
                                                startIcon={<Payment />}
                                                onClick={handlePayment}
                                                disabled={cart.length === 0}
                                            >
                                                Finalizar Venda
                                            </Button>
                                        </Box>
                                    </>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            )}

            {activeTab === 1 && (
                <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                    {/* Filtros */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Grid container spacing={2} alignItems="center">
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Data Inicial"
                                        type="date"
                                        value={dateFilter.startDate}
                                        onChange={(e) => setDateFilter({ ...dateFilter, startDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        fullWidth
                                        label="Data Final"
                                        type="date"
                                        value={dateFilter.endDate}
                                        onChange={(e) => setDateFilter({ ...dateFilter, endDate: e.target.value })}
                                        InputLabelProps={{ shrink: true }}
                                    />
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Estatísticas */}
                    {salesStats && (
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Total de Vendas
                                        </Typography>
                                        <Typography variant="h4">{salesStats.totalSales}</Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Faturamento
                                        </Typography>
                                        <Typography variant="h4" color="success.main">
                                            R$ {salesStats.totalRevenue.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid item xs={12} sm={4}>
                                <Card>
                                    <CardContent>
                                        <Typography color="text.secondary" gutterBottom>
                                            Ticket Médio
                                        </Typography>
                                        <Typography variant="h4">
                                            R$ {salesStats.averageTicket.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>
                    )}

                    {/* Tabela de Vendas */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Vendas Realizadas
                            </Typography>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Data/Hora</TableCell>
                                            <TableCell>Itens</TableCell>
                                            <TableCell>Pagamento</TableCell>
                                            <TableCell align="right">Subtotal</TableCell>
                                            <TableCell align="right">Desconto</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                            <TableCell align="center">Ações</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {salesHistory.map((sale) => (
                                            <TableRow key={sale.id}>
                                                <TableCell>
                                                    {format(new Date(sale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                                </TableCell>
                                                <TableCell>{sale.items?.length || 0} itens</TableCell>
                                                <TableCell>
                                                    <Chip label={sale.payment_method} size="small" />
                                                </TableCell>
                                                <TableCell align="right">R$ {sale.subtotal.toFixed(2)}</TableCell>
                                                <TableCell align="right">R$ {sale.discount.toFixed(2)}</TableCell>
                                                <TableCell align="right">
                                                    <Typography variant="body1" fontWeight="bold">
                                                        R$ {sale.total.toFixed(2)}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="center">
                                                    <IconButton size="small" onClick={() => viewSaleDetails(sale)}>
                                                        <Visibility />
                                                    </IconButton>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>
                </Box>
            )}

            {/* Dialog de Pagamento */}
            <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Finalizar Pagamento</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="h5" align="center" color="primary" gutterBottom>
                            Total: R$ {paymentAmount}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ mt: 3, mb: 2 }}>
                            Forma de Pagamento:
                        </Typography>

                        <Grid container spacing={2}>
                            {['Dinheiro', 'Cartão Débito', 'Cartão Crédito', 'PIX'].map((method) => (
                                <Grid item xs={6} key={method}>
                                    <Button
                                        fullWidth
                                        variant={paymentMethod === method ? 'contained' : 'outlined'}
                                        onClick={() => setPaymentMethod(method)}
                                    >
                                        {method}
                                    </Button>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setPaymentDialogOpen(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={confirmPayment}
                        disabled={!paymentMethod}
                        startIcon={<CheckCircle />}
                    >
                        Confirmar Pagamento
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Detalhes da Venda */}
            <Dialog open={detailsDialogOpen} onClose={() => setDetailsDialogOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>Detalhes da Venda</DialogTitle>
                <DialogContent>
                    {selectedSale && (
                        <Box sx={{ mt: 2 }}>
                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Data/Hora
                                    </Typography>
                                    <Typography variant="body1">
                                        {format(new Date(selectedSale.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="text.secondary">
                                        Forma de Pagamento
                                    </Typography>
                                    <Typography variant="body1">{selectedSale.payment_method}</Typography>
                                </Grid>
                            </Grid>

                            <Typography variant="subtitle2" gutterBottom>
                                Itens da Venda:
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Produto</TableCell>
                                            <TableCell align="center">Quantidade</TableCell>
                                            <TableCell align="right">Preço Unit.</TableCell>
                                            <TableCell align="right">Total</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {selectedSale.items?.map((item, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{item.nome}</TableCell>
                                                <TableCell align="center">{item.quantity}</TableCell>
                                                <TableCell align="right">R$ {item.preco.toFixed(2)}</TableCell>
                                                <TableCell align="right">R$ {(item.preco * item.quantity).toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Box sx={{ mt: 3 }}>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography>Subtotal:</Typography>
                                    <Typography>R$ {selectedSale.subtotal.toFixed(2)}</Typography>
                                </Box>
                                <Box display="flex" justifyContent="space-between" mb={1}>
                                    <Typography>Desconto:</Typography>
                                    <Typography>R$ {selectedSale.discount.toFixed(2)}</Typography>
                                </Box>
                                <Divider sx={{ my: 1 }} />
                                <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6">Total:</Typography>
                                    <Typography variant="h6" color="primary">
                                        R$ {selectedSale.total.toFixed(2)}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDetailsDialogOpen(false)}>Fechar</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Sales;
