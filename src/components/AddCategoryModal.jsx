import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Alert,
} from '@mui/material';
import { createCategory } from '../services/categoryService';
import logger from '../utils/logger';

const AddCategoryModal = ({ open, onClose, onCategoryCreated }) => {
    const [categoryData, setCategoryData] = useState({
        name: '',
        description: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCategoryData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const generateSlug = (name) => {
        return name
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove acentos
            .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
            .replace(/(^-|-$)/g, ''); // Remove hífens do início e fim
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!categoryData.name.trim()) {
            setError('Nome da categoria é obrigatório');
            return;
        }

        setLoading(true);
        try {
            const slug = generateSlug(categoryData.name);
            const newCategory = await createCategory({
                name: categoryData.name,
                slug,
                description: categoryData.description,
                active: true,
            });

            logger.debug('Category created:', newCategory);

            // Reset form
            setCategoryData({ name: '', description: '' });

            // Notify parent component
            if (onCategoryCreated) {
                onCategoryCreated(newCategory);
            }

            onClose();
        } catch (err) {
            logger.error('Error creating category:', err);
            setError('Erro ao criar categoria. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setCategoryData({ name: '', description: '' });
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Nova Categoria</DialogTitle>
            <form onSubmit={handleSubmit}>
                <DialogContent>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <TextField
                        autoFocus
                        margin="dense"
                        name="name"
                        label="Nome da Categoria"
                        type="text"
                        fullWidth
                        required
                        value={categoryData.name}
                        onChange={handleChange}
                        disabled={loading}
                    />

                    <TextField
                        margin="dense"
                        name="description"
                        label="Descrição (opcional)"
                        type="text"
                        fullWidth
                        multiline
                        rows={3}
                        value={categoryData.description}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} disabled={loading}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Categoria'}
                    </Button>
                </DialogActions>
            </form>
        </Dialog>
    );
};

export default AddCategoryModal;
