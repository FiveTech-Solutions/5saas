import { supabase } from './supabase';

/**
 * Service para gerenciamento de produtos
 */

// ================================================================
// CRUD DE PRODUTOS
// ================================================================

/**
 * Lista produtos com filtros opcionais
 */
export const getProducts = async (filters = {}) => {
    try {
        let query = supabase
            .from('products')
            .select(`
        *,
        category:product_categories(id, name, slug, icon),
        subcategory:product_subcategories(id, name, slug),
        price:product_prices(*),
        stock:product_stock(*)
      `)
            .eq('ativo', true)
            .order('nome');

        // Aplicar filtros
        if (filters.category_id) {
            query = query.eq('category_id', filters.category_id);
        }
        if (filters.subcategory_id) {
            query = query.eq('subcategory_id', filters.subcategory_id);
        }
        if (filters.search) {
            query = query.or(`nome.ilike.%${filters.search}%,codigo.ilike.%${filters.search}%,codigo_barras.ilike.%${filters.search}%`);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching products:', error);
        throw new Error('Erro ao buscar produtos');
    }
};

/**
 * Busca um produto por ID
 */
export const getProduct = async (id) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:product_categories(*),
        subcategory:product_subcategories(*),
        price:product_prices(*),
        stock:product_stock(*),
        taxes:product_taxes(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product:', error);
        throw new Error('Erro ao buscar produto');
    }
};

/**
 * Busca produto por código
 */
export const getProductByCode = async (codigo) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        *,
        category:product_categories(*),
        price:product_prices(*),
        stock:product_stock(*)
      `)
            .eq('codigo', codigo)
            .eq('ativo', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product by code:', error);
        return null;
    }
};

/**
 * Cria um novo produto
 */
export const createProduct = async (productData) => {
    try {
        // Buscar user_id e tenant_id do usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        // 1. Criar o produto
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert([{
                user_id: user.id,
                tenant_id: userData.tenant_id,
                category_id: productData.category_id,
                subcategory_id: productData.subcategory_id || null,
                codigo: productData.codigo,
                codigo_barras: productData.codigo_barras || null,
                nome: productData.nome,
                descricao: productData.descricao || null,
                unidade_medida: productData.unidade_medida || 'UN',
                ncm: productData.ncm || null,
                cest: productData.cest || null,
                cfop: productData.cfop || null,
                origem_mercadoria: productData.origem_mercadoria || '0',
                tipo_produto: productData.tipo_produto || 'produto',
                detalhes_especificos: productData.detalhes_especificos || null,
            }])
            .select()
            .single();

        if (productError) throw productError;

        // 2. Criar preço do produto
        if (productData.preco_venda) {
            const { error: priceError } = await supabase
                .from('product_prices')
                .insert([{
                    product_id: product.id,
                    preco_custo: productData.preco_custo || 0,
                    preco_venda: productData.preco_venda,
                    margem_lucro: productData.margem_lucro || null,
                }]);

            if (priceError) throw priceError;
        }

        // 3. Criar estoque do produto
        const { error: stockError } = await supabase
            .from('product_stock')
            .insert([{
                product_id: product.id,
                quantidade_atual: productData.quantidade_inicial || 0,
                quantidade_minima: productData.quantidade_minima || 0,
                quantidade_maxima: productData.quantidade_maxima || null,
                localizacao: productData.localizacao || null,
            }]);

        if (stockError) throw stockError;

        // 4. Criar impostos do produto (se fornecidos)
        if (productData.impostos && productData.impostos.length > 0) {
            const taxesData = productData.impostos.map(tax => ({
                product_id: product.id,
                tipo_imposto: tax.tipo_imposto,
                regime_tributario: tax.regime_tributario || 'simples_nacional',
                aliquota: tax.aliquota,
                base_calculo: tax.base_calculo || 100,
                reducao_base_calculo: tax.reducao_base_calculo || 0,
                cst: tax.cst || null,
                modalidade_bc: tax.modalidade_bc || null,
            }));

            const { error: taxesError } = await supabase
                .from('product_taxes')
                .insert(taxesData);

            if (taxesError) throw taxesError;
        }

        return product;
    } catch (error) {
        console.error('Error creating product:', error);
        throw new Error(error.message || 'Erro ao criar produto');
    }
};

/**
 * Atualiza um produto existente
 */
export const updateProduct = async (id, productData) => {
    try {
        // 1. Atualizar produto
        const { data: product, error: productError } = await supabase
            .from('products')
            .update({
                category_id: productData.category_id,
                subcategory_id: productData.subcategory_id,
                codigo: productData.codigo,
                codigo_barras: productData.codigo_barras,
                nome: productData.nome,
                descricao: productData.descricao,
                unidade_medida: productData.unidade_medida,
                ncm: productData.ncm,
                cest: productData.cest,
                cfop: productData.cfop,
                origem_mercadoria: productData.origem_mercadoria,
                tipo_produto: productData.tipo_produto,
                detalhes_especificos: productData.detalhes_especificos,
                ativo: productData.ativo,
            })
            .eq('id', id)
            .select()
            .single();

        if (productError) throw productError;

        // 2. Atualizar preço (se fornecido)
        if (productData.preco_venda !== undefined) {
            const { error: priceError } = await supabase
                .from('product_prices')
                .upsert({
                    product_id: id,
                    preco_custo: productData.preco_custo,
                    preco_venda: productData.preco_venda,
                    margem_lucro: productData.margem_lucro,
                    preco_promocional: productData.preco_promocional,
                    data_inicio_promocao: productData.data_inicio_promocao,
                    data_fim_promocao: productData.data_fim_promocao,
                });

            if (priceError) throw priceError;
        }

        return product;
    } catch (error) {
        console.error('Error updating product:', error);
        throw new Error('Erro ao atualizar produto');
    }
};

/**
 * Desativa um produto (soft delete)
 */
export const deleteProduct = async (id) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .update({ ativo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error deleting product:', error);
        throw new Error('Erro ao deletar produto');
    }
};

// ================================================================
// BUSCA E AUTOCOMPLETE
// ================================================================

/**
 * Busca produtos para autocomplete (usado na emissão de NF-e)
 */
export const searchProducts = async (query, limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`
        id,
        codigo,
        codigo_barras,
        nome,
        unidade_medida,
        ncm,
        cfop,
        price:product_prices(preco_venda),
        stock:product_stock(quantidade_atual)
      `)
            .eq('ativo', true)
            .or(`nome.ilike.%${query}%,codigo.ilike.%${query}%,codigo_barras.ilike.%${query}%`)
            .limit(limit);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error searching products:', error);
        throw new Error('Erro ao buscar produtos');
    }
};

// ================================================================
// IMPOSTOS DO PRODUTO
// ================================================================

/**
 * Busca impostos de um produto
 */
export const getProductTaxes = async (productId) => {
    try {
        const { data, error } = await supabase
            .from('product_taxes')
            .select('*')
            .eq('product_id', productId);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching product taxes:', error);
        throw new Error('Erro ao buscar impostos do produto');
    }
};

/**
 * Atualiza impostos de um produto
 */
export const updateProductTaxes = async (productId, taxesData) => {
    try {
        // Deletar impostos existentes
        await supabase
            .from('product_taxes')
            .delete()
            .eq('product_id', productId);

        // Inserir novos impostos
        if (taxesData && taxesData.length > 0) {
            const taxes = taxesData.map(tax => ({
                product_id: productId,
                tipo_imposto: tax.tipo_imposto,
                regime_tributario: tax.regime_tributario,
                aliquota: tax.aliquota,
                base_calculo: tax.base_calculo,
                reducao_base_calculo: tax.reducao_base_calculo,
                cst: tax.cst,
                modalidade_bc: tax.modalidade_bc,
            }));

            const { data, error } = await supabase
                .from('product_taxes')
                .insert(taxes)
                .select();

            if (error) throw error;
            return data;
        }

        return [];
    } catch (error) {
        console.error('Error updating product taxes:', error);
        throw new Error('Erro ao atualizar impostos do produto');
    }
};
