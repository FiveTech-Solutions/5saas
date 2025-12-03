import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, MenuItem, Select, InputLabel, FormControl, IconButton, InputAdornment } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { NumericFormat } from 'react-number-format';
import { getProduct, createProduct, updateProduct } from '../services/productService';
import { getCategories } from '../services/categoryService';
import { productSchema } from '../schemas/productSchema';
import AddCategoryModal from '../components/AddCategoryModal';
import FormModal from '../components/FormModal';
import { useToast } from '../contexts/ToastContext';
import './ProductForm.css';

const ProductForm = ({ productId, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const id = productId || paramId;
    const isEdit = Boolean(id);
    const toast = useToast();

    const [product, setProduct] = useState({
        nome: '',
        codigo: '',
        preco_venda: '',
        unidade_medida: 'UN',
        categoria_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [categoryModalOpen, setCategoryModalOpen] = useState(false);

    // Load categories
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data || []);
        } catch (e) {
            logger.error('Erro ao carregar categorias', e);
            toast.error('Erro ao carregar categorias');
        }
    };

    // Load product details when editing
    useEffect(() => {
        if (isEdit) {
            const fetchProduct = async () => {
                try {
                    const data = await getProduct(id);
                    setProduct({
                        nome: data.nome || '',
                        codigo: data.codigo || '',
                        preco_venda: data.price?.[0]?.preco_venda || '',
                        unidade_medida: data.unidade_medida || 'UN',
                        categoria_id: data.category?.id || ''
                    });
                } catch (e) {
                    logger.error('Erro ao buscar produto', e);
                    toast.error('Não foi possível carregar o produto.');
                    if (onClose) onClose();
                    else navigate('/produtos');
                }
            };
            fetchProduct();
        } else {
            // Reset form when not editing (important for modal reuse)
            setProduct({
                nome: '',
                codigo: '',
                preco_venda: '',
                unidade_medida: 'UN',
                categoria_id: ''
            });
        }
    }, [isEdit, id, navigate, toast, onClose]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handlePriceChange = (values) => {
        setProduct(prev => ({ ...prev, preco_venda: values.floatValue || '' }));
        if (errors.preco_venda) {
            setErrors(prev => ({ ...prev, preco_venda: null }));
        }
    };

    const validateForm = () => {
        try {
            const dataToValidate = {
                ...product,
                preco_venda: Number(product.preco_venda),
                category_id: product.categoria_id || '',
                origem_mercadoria: '',
            };

            productSchema.parse(dataToValidate);
            setErrors({});
            return true;
        } catch (err) {
            if (err.errors) {
                const newErrors = {};
                err.errors.forEach(error => {
                    const field = error.path[0];
                    const formField = field === 'category_id' ? 'categoria_id' : field;
                    newErrors[formField] = error.message;
                });
                setErrors(newErrors);
            }
            return false;
        }
    };

    const handleClose = () => {
        if (onClose) onClose();
        else navigate('/produtos');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        if (!validateForm()) {
            toast.warning('Por favor, corrija os erros no formulário.');
            return;
        }

        setLoading(true);
        try {
            const payload = {
                nome: product.nome,
                codigo: product.codigo,
                preco_venda: Number(product.preco_venda),
                unidade_medida: product.unidade_medida,
                category_id: product.categoria_id || null
            };
            if (isEdit) {
                await updateProduct(id, payload);
                toast.success('Produto atualizado com sucesso!');
            } else {
                await createProduct(payload);
                toast.success('Produto criado com sucesso!');
            }
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            logger.error('Erro ao salvar produto', error);
            toast.error('Falha ao salvar o produto. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleCategoryCreated = (newCategory) => {
        // Reload categories and select the new one
        loadCategories();
        setProduct(prev => ({ ...prev, categoria_id: newCategory.id }));
        toast.success('Categoria adicionada com sucesso!');
    };

    return (
        <>
            <FormModal
                isOpen={true}
                onClose={handleClose}
                title={isEdit ? 'Editar Produto' : 'Cadastrar Produto'}
                onSubmit={handleSubmit}
                loading={loading}
                submitLabel={isEdit ? 'Atualizar' : 'Criar'}
                cancelLabel="Cancelar"
            >
                <form id="product-form" onSubmit={handleSubmit}>
                    <TextField
                        label="Nome"
                        name="nome"
                        value={product.nome}
                        onChange={handleChange}
                        required
                        fullWidth
                        error={!!errors.nome}
                        helperText={errors.nome}
                        margin="normal"
                        autoFocus
                    />
                    <TextField
                        label="Código"
                        name="codigo"
                        value={product.codigo}
                        onChange={handleChange}
                        required
                        fullWidth
                        error={!!errors.codigo}
                        helperText={errors.codigo}
                        margin="normal"
                    />
                    <NumericFormat
                        customInput={TextField}
                        label="Preço de Venda"
                        value={product.preco_venda}
                        onValueChange={handlePriceChange}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="R$ "
                        decimalScale={2}
                        fixedDecimalScale
                        allowNegative={false}
                        required
                        fullWidth
                        error={!!errors.preco_venda}
                        helperText={errors.preco_venda}
                        margin="normal"
                    />
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="unidade-label">Unidade de Medida</InputLabel>
                        <Select
                            labelId="unidade-label"
                            label="Unidade de Medida"
                            name="unidade_medida"
                            value={product.unidade_medida}
                            onChange={handleChange}
                        >
                            <MenuItem value="UN">UN</MenuItem>
                            <MenuItem value="KG">KG</MenuItem>
                            <MenuItem value="L">L</MenuItem>
                            <MenuItem value="M">M</MenuItem>
                            <MenuItem value="CX">CX</MenuItem>
                            <MenuItem value="PC">PC</MenuItem>
                        </Select>
                        {errors.unidade_medida && <p style={{ color: '#d32f2f', fontSize: '0.75rem', marginLeft: '14px', marginTop: '3px' }}>{errors.unidade_medida}</p>}
                    </FormControl>
                    <FormControl fullWidth margin="normal">
                        <InputLabel id="categoria-label">Categoria</InputLabel>
                        <Select
                            labelId="categoria-label"
                            label="Categoria"
                            name="categoria_id"
                            value={product.categoria_id}
                            onChange={handleChange}
                            endAdornment={
                                <InputAdornment position="end" sx={{ mr: 2 }}>
                                    <IconButton
                                        edge="end"
                                        onClick={() => setCategoryModalOpen(true)}
                                        size="small"
                                        color="primary"
                                        title="Adicionar nova categoria"
                                    >
                                        <AddIcon />
                                    </IconButton>
                                </InputAdornment>
                            }
                        >
                            <MenuItem value="">Nenhuma</MenuItem>
                            {categories.map(cat => (
                                <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </form>
            </FormModal>

            <AddCategoryModal
                open={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onCategoryCreated={handleCategoryCreated}
            />
        </>
    );
};

export default ProductForm;
