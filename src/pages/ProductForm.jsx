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
        categoria_id: '',
        ncm: '',
        cest: '',
        cfop: '',
        origem_mercadoria: '0'
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
                        categoria_id: data.category?.id || '',
                        ncm: data.ncm || '',
                        cest: data.cest || '',
                        cfop: data.cfop || '',
                        origem_mercadoria: data.origem_mercadoria || '0'
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
                categoria_id: '',
                ncm: '',
                cest: '',
                cfop: '',
                origem_mercadoria: '0'
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
                origem_mercadoria: product.origem_mercadoria || '',
                ncm: product.ncm || '',
                cest: product.cest || '',
                cfop: product.cfop || ''
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
                category_id: product.categoria_id || null,
                ncm: product.ncm || null,
                cest: product.cest || null,
                cfop: product.cfop || null,
                origem_mercadoria: product.origem_mercadoria || '0'
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
        <FormModal
            isOpen={true}
            onClose={handleClose}
            title={isEdit ? 'Editar Produto' : 'Novo Produto'}
            loading={loading}
            actions={
                <>
                    <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Salvando...' : 'Salvar'}
                    </button>
                </>
            }
        >
            <form className="product-form" onSubmit={handleSubmit}>
                <div className="form-grid">
                    <div className="form-full-width">
                        <TextField
                            label="Nome do Produto"
                            name="nome"
                            value={product.nome}
                            onChange={handleChange}
                            error={!!errors.nome}
                            helperText={errors.nome}
                            fullWidth
                            variant="outlined"
                            required
                            autoFocus
                        />
                    </div>

                    <TextField
                        label="Código"
                        name="codigo"
                        value={product.codigo}
                        onChange={handleChange}
                        error={!!errors.codigo}
                        helperText={errors.codigo}
                        fullWidth
                        variant="outlined"
                        required
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
                        error={!!errors.preco_venda}
                        helperText={errors.preco_venda}
                        fullWidth
                        variant="outlined"
                        required
                    />

                    <FormControl fullWidth variant="outlined" error={!!errors.unidade_medida} required>
                        <InputLabel>Unidade</InputLabel>
                        <Select
                            name="unidade_medida"
                            value={product.unidade_medida}
                            onChange={handleChange}
                            label="Unidade"
                        >
                            <MenuItem value="UN">Unidade (UN)</MenuItem>
                            <MenuItem value="KG">Quilograma (KG)</MenuItem>
                            <MenuItem value="L">Litro (L)</MenuItem>
                            <MenuItem value="M">Metro (M)</MenuItem>
                            <MenuItem value="CX">Caixa (CX)</MenuItem>
                        </Select>
                        {errors.unidade_medida && <span className="error-text">{errors.unidade_medida}</span>}
                    </FormControl>

                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', gridColumn: 'span 2' }}>
                        <FormControl fullWidth variant="outlined" error={!!errors.categoria_id}>
                            <InputLabel>Categoria</InputLabel>
                            <Select
                                name="categoria_id"
                                value={product.categoria_id}
                                onChange={handleChange}
                                label="Categoria"
                            >
                                <MenuItem value="">
                                    <em>Selecione...</em>
                                </MenuItem>
                                {categories.map(cat => (
                                    <MenuItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.categoria_id && <span className="error-text">{errors.categoria_id}</span>}
                        </FormControl>
                        <IconButton
                            color="primary"
                            onClick={() => setCategoryModalOpen(true)}
                            title="Nova Categoria"
                            style={{ marginTop: '4px' }}
                        >
                            <AddIcon />
                        </IconButton>
                    </div>
                </div>

                <div className="form-section-divider">
                    <h3>Informações Fiscais (Opcional)</h3>
                </div>

                <div className="form-grid">
                    <TextField
                        label="NCM"
                        name="ncm"
                        value={product.ncm}
                        onChange={handleChange}
                        error={!!errors.ncm}
                        helperText={errors.ncm || "Ex: 12345678"}
                        fullWidth
                        variant="outlined"
                        inputProps={{ maxLength: 8 }}
                    />

                    <TextField
                        label="CEST"
                        name="cest"
                        value={product.cest}
                        onChange={handleChange}
                        error={!!errors.cest}
                        helperText={errors.cest}
                        fullWidth
                        variant="outlined"
                        inputProps={{ maxLength: 7 }}
                    />

                    <TextField
                        label="CFOP"
                        name="cfop"
                        value={product.cfop}
                        onChange={handleChange}
                        error={!!errors.cfop}
                        helperText={errors.cfop || "Ex: 5102"}
                        fullWidth
                        variant="outlined"
                        inputProps={{ maxLength: 4 }}
                    />

                    <div className="form-full-width">
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Origem da Mercadoria</InputLabel>
                            <Select
                                name="origem_mercadoria"
                                value={product.origem_mercadoria}
                                onChange={handleChange}
                                label="Origem da Mercadoria"
                            >
                                <MenuItem value="0">0 - Nacional</MenuItem>
                                <MenuItem value="1">1 - Estrangeira (Importação direta)</MenuItem>
                                <MenuItem value="2">2 - Estrangeira (Adquirida no mercado interno)</MenuItem>
                            </Select>
                        </FormControl>
                    </div>
                </div>
            </form>

            <AddCategoryModal
                isOpen={categoryModalOpen}
                onClose={() => setCategoryModalOpen(false)}
                onCategoryCreated={handleCategoryCreated}
            />
        </FormModal>
    );
};

export default ProductForm;
