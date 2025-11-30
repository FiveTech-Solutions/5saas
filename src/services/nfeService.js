import { supabase } from './supabase';
import { handleServiceError } from '../utils/errorHandler';

/**
 * Service para gerenciamento de NF-e no banco de dados
 */

// ================================================================
// CRUD DE NF-e
// ================================================================

/**
 * Lista NF-e com filtros
 */
export const getNFes = async (filters = {}) => {
    try {
        let query = supabase
            .from('nfes')
            .select(`
        *,
        destinatario:customers(id, cpf_cnpj, razao_social),
        items:nfe_items(count)
      `)
            .order('created_at', { ascending: false });

        // Aplicar filtros
        if (filters.status) {
            query = query.eq('status', filters.status);
        }
        if (filters.data_inicio) {
            query = query.gte('data_emissao', filters.data_inicio);
        }
        if (filters.data_fim) {
            query = query.lte('data_emissao', filters.data_fim);
        }
        if (filters.numero) {
            query = query.eq('numero', filters.numero);
        }
        if (filters.destinatario_id) {
            query = query.eq('destinatario_id', filters.destinatario_id);
        }
        if (filters.limit) {
            query = query.limit(filters.limit);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'getNFes', 'Erro ao buscar NF-e');
    }
};

/**
 * Busca uma NF-e por ID
 */
export const getNFe = async (id) => {
    try {
        const { data, error } = await supabase
            .from('nfes')
            .select(`
        *,
        destinatario:customers(*),
        items:nfe_items(*),
        payments:nfe_payments(*),
        duplicatas:nfe_duplicatas(*),
        events:nfe_events(*)
      `)
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'getNFe', 'Erro ao buscar NF-e');
    }
};

/**
 * Busca NF-e por chave de acesso
 */
export const getNFeByChaveAcesso = async (chaveAcesso) => {
    try {
        const { data, error } = await supabase
            .from('nfes')
            .select('*')
            .eq('chave_acesso', chaveAcesso)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'getNFeByChaveAcesso', 'Erro ao buscar NF-e por chave');
    }
};

/**
 * Cria uma nova NF-e
 */
export const createNFe = async (nfeData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        // Gerar ID de integração único
        const idIntegracao = `NFE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // 1. Criar NF-e
        const { data: nfe, error: nfeError } = await supabase
            .from('nfes')
            .insert([{
                user_id: user.id,
                tenant_id: userData.tenant_id,
                id_integracao: idIntegracao,
                serie: nfeData.serie || 1,
                finalidade: nfeData.finalidade || '1',
                natureza_operacao: nfeData.natureza_operacao,
                data_emissao: nfeData.data_emissao || new Date().toISOString(),
                data_saida_entrada: nfeData.data_saida_entrada,
                tipo_operacao: nfeData.tipo_operacao || 'saida',
                presencial: nfeData.presencial || '9',
                consumidor_final: nfeData.consumidor_final !== false,
                destinatario_id: nfeData.destinatario_id,
                valor_total: nfeData.valor_total,
                valor_produtos: nfeData.valor_produtos,
                valor_frete: nfeData.valor_frete || 0,
                valor_seguro: nfeData.valor_seguro || 0,
                valor_desconto: nfeData.valor_desconto || 0,
                valor_outras_despesas: nfeData.valor_outras_despesas || 0,
                valor_total_tributos: nfeData.valor_total_tributos || 0,
                status: 'processando',
            }])
            .select()
            .single();

        if (nfeError) throw nfeError;

        // 2. Criar itens da NF-e
        if (nfeData.items && nfeData.items.length > 0) {
            const itemsData = nfeData.items.map((item, index) => ({
                nfe_id: nfe.id,
                product_id: item.product_id,
                numero_item: index + 1,
                codigo_produto: item.codigo_produto,
                descricao: item.descricao,
                ncm: item.ncm,
                cfop: item.cfop,
                unidade_comercial: item.unidade_comercial,
                quantidade_comercial: item.quantidade_comercial,
                valor_unitario_comercial: item.valor_unitario_comercial,
                valor_total_bruto: item.valor_total_bruto,
                valor_desconto: item.valor_desconto || 0,
                valor_frete: item.valor_frete || 0,
                valor_seguro: item.valor_seguro || 0,
                valor_outras_despesas: item.valor_outras_despesas || 0,
                impostos: item.impostos || null,
            }));

            const { error: itemsError } = await supabase
                .from('nfe_items')
                .insert(itemsData);

            if (itemsError) throw itemsError;
        }

        // 3. Criar pagamentos
        if (nfeData.payments && nfeData.payments.length > 0) {
            const paymentsData = nfeData.payments.map(payment => ({
                nfe_id: nfe.id,
                forma_pagamento: payment.forma_pagamento,
                valor: payment.valor,
                tipo_integracao: payment.tipo_integracao,
                cnpj_credenciadora: payment.cnpj_credenciadora,
                bandeira_operadora: payment.bandeira_operadora,
                numero_autorizacao: payment.numero_autorizacao,
            }));

            const { error: paymentsError } = await supabase
                .from('nfe_payments')
                .insert(paymentsData);

            if (paymentsError) throw paymentsError;
        }

        // 4. Criar duplicatas (se houver)
        if (nfeData.duplicatas && nfeData.duplicatas.length > 0) {
            const duplicatasData = nfeData.duplicatas.map(dup => ({
                nfe_id: nfe.id,
                numero_duplicata: dup.numero_duplicata,
                data_vencimento: dup.data_vencimento,
                valor: dup.valor,
            }));

            const { error: duplicatasError } = await supabase
                .from('nfe_duplicatas')
                .insert(duplicatasData);

            if (duplicatasError) throw duplicatasError;
        }

        return nfe;
    } catch (error) {
        handleServiceError(error, 'createNFe', 'Erro ao criar NF-e');
    }
};

/**
 * Atualiza status da NF-e
 */
export const updateNFeStatus = async (id, status, additionalData = {}) => {
    try {
        const updateData = {
            status,
            ...additionalData,
        };

        const { data, error } = await supabase
            .from('nfes')
            .update(updateData)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'updateNFeStatus', 'Erro ao atualizar status da NF-e');
    }
};

/**
 * Cancela uma NF-e
 */
export const cancelNFe = async (id, justificativa) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Atualizar status da NF-e
        const { data: nfe, error: nfeError } = await supabase
            .from('nfes')
            .update({ status: 'cancelada' })
            .eq('id', id)
            .select()
            .single();

        if (nfeError) throw nfeError;

        // Registrar evento de cancelamento
        const { error: eventError } = await supabase
            .from('nfe_events')
            .insert([{
                nfe_id: id,
                tipo_evento: 'cancelamento',
                sequencia_evento: 1,
                descricao_evento: 'Cancelamento de NF-e',
                justificativa: justificativa,
                status: 'processando',
            }]);

        if (eventError) throw eventError;

        return nfe;
    } catch (error) {
        handleServiceError(error, 'cancelNFe', 'Erro ao cancelar NF-e');
    }
};

// ================================================================
// EVENTOS DA NF-e
// ================================================================

/**
 * Registra evento de carta de correção
 */
export const createCartaCorrecao = async (nfeId, correcao) => {
    try {
        // Buscar sequência do evento
        const { data: events } = await supabase
            .from('nfe_events')
            .select('sequencia_evento')
            .eq('nfe_id', nfeId)
            .eq('tipo_evento', 'carta_correcao')
            .order('sequencia_evento', { ascending: false })
            .limit(1);

        const sequencia = events && events.length > 0 ? events[0].sequencia_evento + 1 : 1;

        const { data, error } = await supabase
            .from('nfe_events')
            .insert([{
                nfe_id: nfeId,
                tipo_evento: 'carta_correcao',
                sequencia_evento: sequencia,
                descricao_evento: 'Carta de Correção Eletrônica',
                justificativa: correcao,
                status: 'processando',
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'createCartaCorrecao', 'Erro ao criar carta de correção');
    }
};

/**
 * Busca eventos de uma NF-e
 */
export const getNFeEvents = async (nfeId) => {
    try {
        const { data, error } = await supabase
            .from('nfe_events')
            .select('*')
            .eq('nfe_id', nfeId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data;
    } catch (error) {
        handleServiceError(error, 'getNFeEvents', 'Erro ao buscar eventos da NF-e');
    }
};

// ================================================================
// RELATÓRIOS E ESTATÍSTICAS
// ================================================================

/**
 * Busca estatísticas de NF-e
 */
export const getNFeStats = async (filters = {}) => {
    try {
        let query = supabase
            .from('nfes')
            .select('status, valor_total');

        if (filters.data_inicio) {
            query = query.gte('data_emissao', filters.data_inicio);
        }
        if (filters.data_fim) {
            query = query.lte('data_emissao', filters.data_fim);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Calcular estatísticas
        const stats = {
            total: data.length,
            autorizadas: data.filter(n => n.status === 'autorizada').length,
            processando: data.filter(n => n.status === 'processando').length,
            rejeitadas: data.filter(n => n.status === 'rejeitada').length,
            canceladas: data.filter(n => n.status === 'cancelada').length,
            valor_total: data.reduce((sum, n) => sum + parseFloat(n.valor_total || 0), 0),
            valor_autorizado: data
                .filter(n => n.status === 'autorizada')
                .reduce((sum, n) => sum + parseFloat(n.valor_total || 0), 0),
        };

        return stats;
    } catch (error) {
        handleServiceError(error, 'getNFeStats', 'Erro ao buscar estatísticas de NF-e');
    }
};
