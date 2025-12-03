import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Switch, FormControlLabel } from '@mui/material';
import { createCategory, getCategory, updateCategory } from '../services/categoryService';
import FormModal from '../components/FormModal';
import { useToast } from '../contexts/ToastContext';
import './CategoryForm.css';

const CategoryForm = ({ categoryId, onClose, onSuccess }) => {
    const navigate = useNavigate();
    const { id: paramId } = useParams();
    const id = categoryId || paramId;
    const isEdit = Boolean(id);
    const toast = useToast();

    const [category, setCategory] = useState({
        name: '',
        slug: '',
        description: '',
        icon: '',
        active: true,
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isEdit) {
            const fetchCategory = async () => {
                try {
                    const data = await getCategory(id);
                    setCategory({
                        name: data.name || '',
                        slug: data.slug || '',
                        description: data.description || '',
                        icon: data.icon || '',
                        active: data.active ?? true,
                    });
                } catch (e) {
                    logger.error('Erro ao buscar categoria', e);
                    toast.error('Não foi possível carregar a categoria.');
                    if (onClose) onClose();
                    else navigate('/categorias');
                }
            };
            fetchCategory();
        } else {
            setCategory({
                name: '',
                slug: '',
                description: '',
                icon: '',
                active: true,
            });
        }
    }, [isEdit, id, navigate, toast, onClose]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleClose = () => {
        if (onClose) onClose();
        else navigate('/categorias');
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();
        setLoading(true);
        try {
            const payload = {
                name: category.name,
                slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
                description: category.description,
                icon: category.icon,
                active: category.active,
            };
            if (isEdit) {
                await updateCategory(id, payload);
                toast.success('Categoria atualizada com sucesso!');
            } else {
                await createCategory(payload);
                toast.success('Categoria criada com sucesso!');
            }
            if (onSuccess) onSuccess();
            handleClose();
        } catch (error) {
            logger.error('Erro ao salvar categoria', error);
            toast.error('Falha ao salvar categoria. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <FormModal
            isOpen={true}
            onClose={handleClose}
            title={isEdit ? 'Editar Categoria' : 'Cadastrar Categoria'}
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel={isEdit ? 'Atualizar' : 'Criar'}
            cancelLabel="Cancelar"
        >
            <form id="category-form" onSubmit={handleSubmit}>
                <TextField
                    label="Nome"
                    name="name"
                    value={category.name}
                    onChange={handleChange}
                    required
                    fullWidth
                    margin="normal"
                    autoFocus
                />
                <TextField
                    label="Slug"
                    name="slug"
                    value={category.slug}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Deixe em branco para gerar automaticamente"
                />
                <TextField
                    label="Descrição"
                    name="description"
                    value={category.description}
                    onChange={handleChange}
                    multiline
                    rows={3}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Ícone (Material UI)"
                    name="icon"
                    value={category.icon}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                    helperText="Ex: Inventory, Category, LocalOffer"
                />
                <FormControlLabel
                    control={<Switch checked={category.active} onChange={handleChange} name="active" />}
                    label="Ativa"
                    style={{ marginTop: '1rem' }}
                />
            </form>
        </FormModal>
    );
};

export default CategoryForm;
