import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TextField, Button, Switch, FormControlLabel } from '@mui/material';
import { Add, ArrowBack } from '@mui/icons-material';
import { createCategory, getCategory, updateCategory } from '../services/categoryService';
import './CategoryForm.css';

const CategoryForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEdit = Boolean(id);

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
                    console.error('Erro ao buscar categoria', e);
                    alert('Não foi possível carregar a categoria.');
                }
            };
            fetchCategory();
        }
    }, [isEdit, id]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCategory(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
                alert('Categoria atualizada com sucesso!');
            } else {
                await createCategory(payload);
                alert('Categoria criada com sucesso!');
            }
            navigate('/categorias');
        } catch (error) {
            console.error('Erro ao salvar categoria', error);
            alert('Falha ao salvar categoria. Verifique o console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="category-form-container">
            <h2>{isEdit ? 'Editar Categoria' : 'Cadastrar Categoria'}</h2>
            <form onSubmit={handleSubmit} className="category-form">
                <TextField
                    label="Nome"
                    name="name"
                    value={category.name}
                    onChange={handleChange}
                    required
                    fullWidth
                    margin="normal"
                />
                <TextField
                    label="Slug"
                    name="slug"
                    value={category.slug}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
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
                    label="Ícone (nome da Material UI icon)"
                    name="icon"
                    value={category.icon}
                    onChange={handleChange}
                    fullWidth
                    margin="normal"
                />
                <FormControlLabel
                    control={<Switch checked={category.active} onChange={handleChange} name="active" />}
                    label="Ativa"
                />
                <Button type="submit" variant="contained" color="primary" disabled={loading} style={{ marginTop: '1rem' }}>
                    {isEdit ? 'Atualizar' : 'Criar'}
                </Button>
                <Button variant="outlined" style={{ marginTop: '1rem', marginLeft: '1rem' }} onClick={() => navigate('/categorias')}>
                    <ArrowBack /> Cancelar
                </Button>
            </form>
        </div>
    );
};

export default CategoryForm;
