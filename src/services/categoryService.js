import { supabase } from './supabase';
import logger from '../utils/logger';

/**
 * Service para gerenciamento de categorias e subcategorias de produtos
 */

// ================================================================
// CATEGORIAS
// ================================================================

/**
 * Lista todas as categorias ativas
 */
export const getCategories = async () => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching categories:', error);
        throw new Error('Erro ao buscar categorias');
    }
};

/**
 * Busca uma categoria por ID
 */
export const getCategory = async (id) => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching category:', error);
        throw new Error('Erro ao buscar categoria');
    }
};

/**
 * Cria uma nova categoria
 * Apenas administradores podem criar categorias
 */
export const createCategory = async (categoryData) => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .insert([{
                name: categoryData.name,
                slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, '-'),
                description: categoryData.description,
                icon: categoryData.icon,
                requires_details: categoryData.requires_details || false,
                detail_schema: categoryData.detail_schema || null,
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error creating category:', error);
        throw new Error('Erro ao criar categoria');
    }
};

/**
 * Atualiza uma categoria existente
 */
export const updateCategory = async (id, categoryData) => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .update({
                name: categoryData.name,
                slug: categoryData.slug,
                description: categoryData.description,
                icon: categoryData.icon,
                requires_details: categoryData.requires_details,
                detail_schema: categoryData.detail_schema,
                active: categoryData.active,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error updating category:', error);
        throw new Error('Erro ao atualizar categoria');
    }
};

/**
 * Desativa uma categoria (soft delete)
 */
export const deleteCategory = async (id) => {
    try {
        const { data, error } = await supabase
            .from('product_categories')
            .update({ active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error deleting category:', error);
        throw new Error('Erro ao deletar categoria');
    }
};

// ================================================================
// SUBCATEGORIAS
// ================================================================

/**
 * Lista subcategorias de uma categoria
 */
export const getSubcategories = async (categoryId) => {
    try {
        const { data, error } = await supabase
            .from('product_subcategories')
            .select('*')
            .eq('category_id', categoryId)
            .eq('active', true)
            .order('name');

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching subcategories:', error);
        throw new Error('Erro ao buscar subcategorias');
    }
};

/**
 * Cria uma nova subcategoria
 */
export const createSubcategory = async (subcategoryData) => {
    try {
        const { data, error } = await supabase
            .from('product_subcategories')
            .insert([{
                category_id: subcategoryData.category_id,
                name: subcategoryData.name,
                slug: subcategoryData.slug || subcategoryData.name.toLowerCase().replace(/\s+/g, '-'),
                description: subcategoryData.description,
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error creating subcategory:', error);
        throw new Error('Erro ao criar subcategoria');
    }
};

/**
 * Atualiza uma subcategoria
 */
export const updateSubcategory = async (id, subcategoryData) => {
    try {
        const { data, error } = await supabase
            .from('product_subcategories')
            .update({
                name: subcategoryData.name,
                slug: subcategoryData.slug,
                description: subcategoryData.description,
                active: subcategoryData.active,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error updating subcategory:', error);
        throw new Error('Erro ao atualizar subcategoria');
    }
};

/**
 * Desativa uma subcategoria
 */
export const deleteSubcategory = async (id) => {
    try {
        const { data, error } = await supabase
            .from('product_subcategories')
            .update({ active: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error deleting subcategory:', error);
        throw new Error('Erro ao deletar subcategoria');
    }
};

// ================================================================
// CÓDIGOS AUXILIARES
// ================================================================

/**
 * Busca códigos NCM
 */
export const searchNCM = async (query) => {
    try {
        const { data, error } = await supabase
            .from('ncm_codes')
            .select('*')
            .or(`codigo.ilike.%${query}%,descricao.ilike.%${query}%`)
            .limit(20);

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error searching NCM:', error);
        throw new Error('Erro ao buscar NCM');
    }
};

/**
 * Busca códigos CFOP
 */
export const searchCFOP = async (query, tipoOperacao = null) => {
    try {
        let queryBuilder = supabase
            .from('cfop_codes')
            .select('*')
            .or(`codigo.ilike.%${query}%,descricao.ilike.%${query}%`);

        if (tipoOperacao) {
            queryBuilder = queryBuilder.eq('tipo_operacao', tipoOperacao);
        }

        const { data, error } = await queryBuilder.limit(20);

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error searching CFOP:', error);
        throw new Error('Erro ao buscar CFOP');
    }
};

/**
 * Busca códigos CST
 */
export const searchCST = async (tipoImposto = 'ICMS') => {
    try {
        const { data, error } = await supabase
            .from('cst_codes')
            .select('*')
            .eq('tipo_imposto', tipoImposto)
            .order('codigo');

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error searching CST:', error);
        throw new Error('Erro ao buscar CST');
    }
};
