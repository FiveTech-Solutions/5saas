import React, { useEffect, useState } from 'react';
import logger from '../utils/logger';
import { useNavigate } from 'react-router-dom';
import { getCategories, deleteCategory } from '../services/categoryService';
import { Delete, Edit, Add } from '@mui/icons-material';
import CategoryForm from './CategoryForm';
import { useToast } from '../contexts/ToastContext';
import './CategoryList.css';

const CategoryList = () => {
    const navigate = useNavigate();
    const toast = useToast();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategoryId, setEditingCategoryId] = useState(null);

    const loadCategories = async () => {
        try {
            setLoading(true);
            const data = await getCategories();
            setCategories(data);
        } catch (e) {
            logger.error('Error loading categories', e);
            toast.error('Erro ao carregar categorias');
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
            toast.success('Categoria excluída');
            loadCategories();
        } catch (e) {
            logger.error('Error deleting', e);
            toast.error('Erro ao excluir categoria');
        }
    };

    const handleOpenModal = (categoryId = null) => {
        setEditingCategoryId(categoryId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingCategoryId(null);
    };

    const handleFormSuccess = () => {
        loadCategories();
        handleCloseModal();
    };

    return (
        <div className="category-list-container">
            <h2>Categorias</h2>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
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
                                    <button className="btn-icon" onClick={() => handleOpenModal(cat.id)} title="Editar">
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

            {isModalOpen && (
                <CategoryForm
                    categoryId={editingCategoryId}
                    onClose={handleCloseModal}
                    onSuccess={handleFormSuccess}
                />
            )}
        </div>
    );
};

export default CategoryList;
