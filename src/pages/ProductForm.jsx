import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import { getProduct, createProduct, updateProduct, getProducts } from '../services/productService';
import './ProductForm.css';

const ProductForm = () => {
    const navigate = useNavigate();
    const { id } = useParams(); // if editing, id will be present
    const isEdit = Boolean(id);

    const [product, setProduct] = useState({
        nome: '',
        codigo: '',
        preco_venda: '',
        unidade_medida: 'UN',
        categoria_id: ''
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    // Load categories for select (simple fetch of products with distinct categories)
    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await getProducts();
                const unique = [];
                data.forEach(p => {
                    if (p.category && !unique.find(c => c.id === p.category.id)) {
                        unique.push(p.category);
                    }
                });
                setCategories(unique);
            } catch (e) {
                console.error('Erro ao carregar categorias', e);
            }
        };
        loadCategories();
    }, []);

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
                    console.error('Erro ao buscar produto', e);
                    alert('Não foi possível carregar o produto.');
                }
            };
            fetchProduct();
        }
    }, [isEdit, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                alert('Produto atualizado com sucesso!');
            } else {
                await createProduct(payload);
                alert('Produto criado com sucesso!');
            }
            navigate('/produtos');
        } catch (error) {
            console.error('Erro ao salvar produto', error);
            alert('Falha ao salvar o produto. Verifique o console para detalhes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-form-container">
            <h2>{isEdit ? 'Editar Produto' : 'Cadastrar Produto'}</h2>
            <form onSubmit={handleSubmit} className="product-form">
                <TextField
                    label="Nome"
                    name="nome"
                    value={product.nome}
                    onChange={handleChange}
                    required
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Código"
                    name="codigo"
                    value={product.codigo}
                    onChange={handleChange}
                    required
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Preço de Venda"
                    name="preco_venda"
                    type="number"
                    value={product.preco_venda}
                    onChange={handleChange}
                    required
                    fullWidth
                    margin="normal"
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel id="unidade-label">Unidade</InputLabel>
                    <Select
                        labelId="unidade-label"
                        label="Unidade"
                        name="unidade_medida"
                        value={product.unidade_medida}
                        onChange={handleChange}
                    >
                        <MenuItem value="UN">UN</MenuItem>
                        <MenuItem value="KG">KG</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                    <InputLabel id="categoria-label">Categoria</InputLabel>
                    <Select
                        labelId="categoria-label"
                        label="Categoria"
                        name="categoria_id"
                        value={product.categoria_id}
                        onChange={handleChange}
                    >
                        {categories.map(cat => (
                            <MenuItem key={cat.id} value={cat.id}>{cat.name}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    style={{ marginTop: '1rem' }}
                >
                    {isEdit ? 'Atualizar' : 'Criar'}
                </Button>
                <Button
                    variant="outlined"
                    style={{ marginTop: '1rem', marginLeft: '1rem' }}
                    onClick={() => navigate('/produtos')}
                >
                    Cancelar
                </Button>
            </form>
        </div>
    );
};

export default ProductForm;
