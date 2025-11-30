import { supabase } from './supabase';
import logger from '../utils/logger';
import { handleServiceError } from '../utils/errorHandler';

/**
 * Cria uma nova venda
 */
export const createSale = async (saleData) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .insert([{
                items: saleData.items,
                subtotal: saleData.subtotal,
                discount: saleData.discount,
                total: saleData.total,
                payment_method: saleData.paymentMethod,
                created_at: new Date().toISOString(),
            }])
            .select()
            .single();

        if (error) throw error;

        logger.debug('Sale created:', data);
        return data;
    } catch (error) {
        handleServiceError(error, 'Erro ao criar venda');
        throw error;
    }
};

/**
 * Busca todas as vendas
 */
export const getSales = async (filters = {}) => {
    try {
        let query = supabase
            .from('sales')
            .select('*')
            .order('created_at', { ascending: false });

        // Filtro por data
        if (filters.startDate) {
            query = query.gte('created_at', filters.startDate);
        }
        if (filters.endDate) {
            query = query.lte('created_at', filters.endDate);
        }

        // Filtro por forma de pagamento
        if (filters.paymentMethod) {
            query = query.eq('payment_method', filters.paymentMethod);
        }

        const { data, error } = await query;

        if (error) throw error;

        return data || [];
    } catch (error) {
        handleServiceError(error, 'Erro ao buscar vendas');
        throw error;
    }
};

/**
 * Busca uma venda específica por ID
 */
export const getSaleById = async (id) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        handleServiceError(error, 'Erro ao buscar venda');
        throw error;
    }
};

/**
 * Cancela uma venda
 */
export const cancelSale = async (id) => {
    try {
        const { data, error } = await supabase
            .from('sales')
            .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        logger.debug('Sale cancelled:', data);
        return data;
    } catch (error) {
        handleServiceError(error, 'Erro ao cancelar venda');
        throw error;
    }
};

/**
 * Obtém estatísticas de vendas
 */
export const getSalesStats = async (startDate, endDate) => {
    try {
        let query = supabase
            .from('sales')
            .select('total, payment_method, created_at');

        if (startDate) {
            query = query.gte('created_at', startDate);
        }
        if (endDate) {
            query = query.lte('created_at', endDate);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcular estatísticas
        const stats = {
            totalSales: data.length,
            totalRevenue: data.reduce((sum, sale) => sum + sale.total, 0),
            averageTicket: data.length > 0 ? data.reduce((sum, sale) => sum + sale.total, 0) / data.length : 0,
            byPaymentMethod: {},
        };

        // Agrupar por forma de pagamento
        data.forEach(sale => {
            if (!stats.byPaymentMethod[sale.payment_method]) {
                stats.byPaymentMethod[sale.payment_method] = {
                    count: 0,
                    total: 0,
                };
            }
            stats.byPaymentMethod[sale.payment_method].count++;
            stats.byPaymentMethod[sale.payment_method].total += sale.total;
        });

        return stats;
    } catch (error) {
        handleServiceError(error, 'Erro ao buscar estatísticas');
        throw error;
    }
};
