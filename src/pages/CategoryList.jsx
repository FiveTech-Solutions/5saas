import React, { useEffect, useState } from 'react';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { getCategories, deleteCategory } from '../services/categoryService';
import { Delete, Edit, Add } from '@mui/icons-material';
import './CategoryList.css';

const CategoryList = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (e) {
            logger.error('Error loading categories', e);
            alert('Erro ao carregar categorias');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []);

    const handleDelete = async (id) => {
        if (!window.confirm('Confirma exclusão da categoria?')) return;
        try {
            await deleteCategory(id);
            alert('Categoria excluída');
            loadCategories();
        } catch (e) {
            logger.error('Error deleting', e);
            alert('Erro ao excluir categoria');
        }
    };

    return (
        <div className="category-list-container">
            <h2>Categorias</h2>
            <button className="btn btn-primary" onClick={() => navigate('/categorias/novo')}>
                <Add /> Nova Categoria
            </button>
            {loading ? (
                <p>Carregando...</p>
            ) : (
                <table className="category-table">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Slug</th>
                            <th>Ativa</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {categories.map(cat => (
                            <tr key={cat.id}>
                                <td>{cat.name}</td>
                                <td>{cat.slug}</td>
                                <td>{cat.active ? 'Sim' : 'Não'}</td>
                                <td>
                                    <button className="btn-icon" onClick={() => navigate(`/categorias/editar/${cat.id}`)} title="Editar">
                                        <Edit />
                                    </button>
                                    <button className="btn-icon btn-danger" onClick={() => handleDelete(cat.id)} title="Excluir">
                                        <Delete />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CategoryList;
