import { supabase } from './supabase';

/**
 * Service para gerenciamento de estoque de produtos
 */

// ================================================================
// CONSULTA DE ESTOQUE
// ================================================================

/**
 * Busca estoque de um produto
 */
export const getStock = async (productId) => {
    try {
        const { data, error } = await supabase
            .from('product_stock')
            .select(`
        *,
        product:products(id, codigo, nome, unidade_medida)
      `)
            .eq('product_id', productId)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching stock:', error);
        throw new Error('Erro ao buscar estoque');
    }
};

/**
 * Lista produtos com estoque baixo
 */
export const getLowStockProducts = async () => {
    try {
        const { data, error } = await supabase
            .from('product_stock')
            .select(`
        *,
        product:products(id, codigo, nome, unidade_medida, category:product_categories(name))
      `)
            .filter('quantidade_atual', 'lte', 'quantidade_minima')
            .order('quantidade_atual');

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        throw new Error('Erro ao buscar produtos com estoque baixo');
    }
};

/**
 * Lista todo o estoque com filtros
 */
export const getAllStock = async (filters = {}) => {
    try {
        let query = supabase
            .from('product_stock')
            .select(`
        *,
        product:products(
          id,
          codigo,
          nome,
          unidade_medida,
          category:product_categories(name),
          ativo
        )
      `)
            .order('product(nome)');

        // Filtrar apenas produtos ativos
        if (filters.activeOnly !== false) {
            query = query.eq('product.ativo', true);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching all stock:', error);
        throw new Error('Erro ao buscar estoque');
    }
};

// ================================================================
// MOVIMENTAÇÃO DE ESTOQUE
// ================================================================

/**
 * Adiciona entrada de estoque
 */
export const addStockEntry = async (productId, quantidade, motivo, documentoReferencia = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar estoque atual
        const { data: currentStock } = await supabase
            .from('product_stock')
            .select('quantidade_atual')
            .eq('product_id', productId)
            .single();

        const quantidadeAnterior = currentStock?.quantidade_atual || 0;
        const quantidadeNova = quantidadeAnterior + quantidade;

        // Atualizar estoque
        const { error: updateError } = await supabase
            .from('product_stock')
            .update({ quantidade_atual: quantidadeNova })
            .eq('product_id', productId);

        if (updateError) throw updateError;

        // Registrar movimentação
        const { data: movement, error: movementError } = await supabase
            .from('product_stock_movements')
            .insert([{
                product_id: productId,
                tipo_movimento: 'entrada',
                quantidade: quantidade,
                quantidade_anterior: quantidadeAnterior,
                quantidade_nova: quantidadeNova,
                motivo: motivo,
                documento_referencia: documentoReferencia,
                user_id: user.id,
            }])
            .select()
            .single();

        if (movementError) throw movementError;

        return movement;
    } catch (error) {
        console.error('Error adding stock entry:', error);
        throw new Error('Erro ao adicionar entrada de estoque');
    }
};

/**
 * Remove saída de estoque
 */
export const removeStockExit = async (productId, quantidade, motivo, documentoReferencia = null) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar estoque atual
        const { data: currentStock } = await supabase
            .from('product_stock')
            .select('quantidade_atual')
            .eq('product_id', productId)
            .single();

        const quantidadeAnterior = currentStock?.quantidade_atual || 0;

        if (quantidadeAnterior < quantidade) {
            throw new Error('Estoque insuficiente');
        }

        const quantidadeNova = quantidadeAnterior - quantidade;

        // Atualizar estoque
        const { error: updateError } = await supabase
            .from('product_stock')
            .update({ quantidade_atual: quantidadeNova })
            .eq('product_id', productId);

        if (updateError) throw updateError;

        // Registrar movimentação
        const { data: movement, error: movementError } = await supabase
            .from('product_stock_movements')
            .insert([{
                product_id: productId,
                tipo_movimento: 'saida',
                quantidade: quantidade,
                quantidade_anterior: quantidadeAnterior,
                quantidade_nova: quantidadeNova,
                motivo: motivo,
                documento_referencia: documentoReferencia,
                user_id: user.id,
            }])
            .select()
            .single();

        if (movementError) throw movementError;

        return movement;
    } catch (error) {
        console.error('Error removing stock exit:', error);
        throw new Error(error.message || 'Erro ao remover saída de estoque');
    }
};

/**
 * Ajusta estoque manualmente
 */
export const adjustStock = async (productId, novaQuantidade, motivo) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar estoque atual
        const { data: currentStock } = await supabase
            .from('product_stock')
            .select('quantidade_atual')
            .eq('product_id', productId)
            .single();

        const quantidadeAnterior = currentStock?.quantidade_atual || 0;
        const diferenca = novaQuantidade - quantidadeAnterior;

        // Atualizar estoque
        const { error: updateError } = await supabase
            .from('product_stock')
            .update({ quantidade_atual: novaQuantidade })
            .eq('product_id', productId);

        if (updateError) throw updateError;

        // Registrar movimentação
        const { data: movement, error: movementError } = await supabase
            .from('product_stock_movements')
            .insert([{
                product_id: productId,
                tipo_movimento: 'ajuste',
                quantidade: Math.abs(diferenca),
                quantidade_anterior: quantidadeAnterior,
                quantidade_nova: novaQuantidade,
                motivo: motivo,
                user_id: user.id,
            }])
            .select()
            .single();

        if (movementError) throw movementError;

        return movement;
    } catch (error) {
        console.error('Error adjusting stock:', error);
        throw new Error('Erro ao ajustar estoque');
    }
};

/**
 * Atualiza configurações de estoque (mínimo, máximo, localização)
 */
export const updateStockSettings = async (productId, settings) => {
    try {
        const { data, error } = await supabase
            .from('product_stock')
            .update({
                quantidade_minima: settings.quantidade_minima,
                quantidade_maxima: settings.quantidade_maxima,
                localizacao: settings.localizacao,
                lote: settings.lote,
                data_validade: settings.data_validade,
            })
            .eq('product_id', productId)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error updating stock settings:', error);
        throw new Error('Erro ao atualizar configurações de estoque');
    }
};

// ================================================================
// HISTÓRICO DE MOVIMENTAÇÕES
// ================================================================

/**
 * Busca histórico de movimentações de um produto
 */
export const getStockMovements = async (productId, filters = {}) => {
    try {
        let query = supabase
            .from('product_stock_movements')
            .select(`
        *,
        user:users(full_name)
      `)
            .eq('product_id', productId)
            .order('created_at', { ascending: false });

        // Filtros opcionais
        if (filters.tipo_movimento) {
            query = query.eq('tipo_movimento', filters.tipo_movimento);
        }
        if (filters.data_inicio) {
            query = query.gte('created_at', filters.data_inicio);
        }
        if (filters.data_fim) {
            query = query.lte('created_at', filters.data_fim);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching stock movements:', error);
        throw new Error('Erro ao buscar movimentações de estoque');
    }
};

/**
 * Busca todas as movimentações recentes (para dashboard)
 */
export const getRecentMovements = async (limit = 50) => {
    try {
        const { data, error } = await supabase
            .from('product_stock_movements')
            .select(`
        *,
        product:products(id, codigo, nome, unidade_medida),
        user:users(full_name)
      `)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    } catch (error) {
        console.error('Error fetching recent movements:', error);
        throw new Error('Erro ao buscar movimentações recentes');
    }
};

// ================================================================
// VALIDAÇÕES
// ================================================================

/**
 * Verifica se há estoque suficiente para uma operação
 */
export const checkStockAvailability = async (productId, quantidadeNecessaria) => {
    try {
        const { data, error } = await supabase
            .from('product_stock')
            .select('quantidade_atual')
            .eq('product_id', productId)
            .single();

        if (error) throw error;

        return {
            available: data.quantidade_atual >= quantidadeNecessaria,
            currentStock: data.quantidade_atual,
            requested: quantidadeNecessaria,
            shortage: Math.max(0, quantidadeNecessaria - data.quantidade_atual),
        };
    } catch (error) {
        console.error('Error checking stock availability:', error);
        throw new Error('Erro ao verificar disponibilidade de estoque');
    }
};
