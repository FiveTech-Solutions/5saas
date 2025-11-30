import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { getProducts, deleteProduct } from '../services/productService';
import { Add, Edit, Delete, Search, FilterList } from '@mui/icons-material';
import './ProductList.css';

const ProductList = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        loadProducts();
    }, [categoryFilter]);

    const loadProducts = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (categoryFilter) filters.category_id = categoryFilter;

            const data = await getProducts(filters);
            setProducts(data);
        } catch (error) {
            logger.error('Error loading products:', error);
            alert('Erro ao carregar produtos');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este produto?')) return;

        try {
            await deleteProduct(id);
            alert('Produto excluído com sucesso!');
            loadProducts();
        } catch (error) {
            logger.error('Error deleting product:', error);
            alert('Erro ao excluir produto');
        }
    };

    const filteredProducts = products.filter(product =>
        product.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatPrice = (price) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(price);
    };

    return (
        <div className="product-list-container">
            <div className="page-header">
                <h1>Produtos</h1>
                <button
                    className="btn btn-primary"
                    onClick={() => navigate('/produtos/new')}
                >
                    <Add /> Novo Produto
                </button>
            </div>

            <div className="filters-section">
                <div className="search-box">
                    <Search />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn btn-secondary">
                    <FilterList /> Filtros
                </button>
            </div>

            {loading ? (
                <div className="loading">Carregando produtos...</div>
            ) : (
                <div className="products-grid">
                    {filteredProducts.length === 0 ? (
                        <div className="empty-state">
                            <p>Nenhum produto encontrado</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate('/produtos/new')}
                            >
                                Cadastrar Primeiro Produto
                            </button>
                        </div>
                    ) : (
                        <table className="products-table">
                            <thead>
                                <tr>
                                    <th>Código</th>
                                    <th>Nome</th>
                                    <th>Categoria</th>
                                    <th>Preço</th>
                                    <th>Estoque</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProducts.map((product) => (
                                    <tr key={product.id}>
                                        <td>{product.codigo}</td>
                                        <td>
                                            <div className="product-name">
                                                <strong>{product.nome}</strong>
                                                {product.descricao && (
                                                    <small>{product.descricao.substring(0, 50)}...</small>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="category-badge">
                                                {product.category?.name || 'Sem categoria'}
                                            </span>
                                        </td>
                                        <td className="price-cell">
                                            {product.price?.[0]?.preco_venda
                                                ? formatPrice(product.price[0].preco_venda)
                                                : '-'}
                                        </td>
                                        <td>
                                            <span className={`stock-badge ${product.stock?.[0]?.quantidade_atual <= product.stock?.[0]?.quantidade_minima
                                                    ? 'low-stock'
                                                    : 'in-stock'
                                                }`}>
                                                {product.stock?.[0]?.quantidade_atual || 0} {product.unidade_medida}
                                            </span>
                                        </td>
                                        <td className="actions-cell">
                                            <button
                                                className="btn-icon"
                                                onClick={() => navigate(`/produtos/edit/${product.id}`)}
                                                title="Editar"
                                            >
                                                <Edit />
                                            </button>
                                            <button
                                                className="btn-icon btn-danger"
                                                onClick={() => handleDelete(product.id)}
                                                title="Excluir"
                                            >
                                                <Delete />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProductList;
