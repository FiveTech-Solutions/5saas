import { supabase } from './supabase';
import logger from '../utils/logger';

/**
 * Service para gerenciamento de transportadoras
 */

// ================================================================
// CRUD DE TRANSPORTADORAS
// ================================================================

/**
 * Lista todas as transportadoras ativas
 */
export const getTransportadoras = async () => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .select('*')
            .eq('ativo', true)
            .order('razao_social');

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching transportadoras:', error);
        throw new Error('Erro ao buscar transportadoras');
    }
};

/**
 * Busca uma transportadora por ID
 */
export const getTransportadora = async (id) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching transportadora:', error);
        throw new Error('Erro ao buscar transportadora');
    }
};

/**
 * Busca transportadora por CPF/CNPJ
 */
export const getTransportadoraByCpfCnpj = async (cpfCnpj) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .select('*')
            .eq('cpf_cnpj', cpfCnpj)
            .eq('ativo', true)
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error fetching transportadora by CPF/CNPJ:', error);
        return null;
    }
};

/**
 * Cria uma nova transportadora
 */
export const createTransportadora = async (transportadoraData) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        const { data: userData } = await supabase
            .from('users')
            .select('tenant_id')
            .eq('id', user.id)
            .single();

        const { data, error } = await supabase
            .from('transportadoras')
            .insert([{
                user_id: user.id,
                tenant_id: userData.tenant_id,
                cpf_cnpj: transportadoraData.cpf_cnpj,
                razao_social: transportadoraData.razao_social,
                nome_fantasia: transportadoraData.nome_fantasia,
                inscricao_estadual: transportadoraData.inscricao_estadual,
                logradouro: transportadoraData.logradouro,
                numero: transportadoraData.numero,
                complemento: transportadoraData.complemento,
                bairro: transportadoraData.bairro,
                cidade: transportadoraData.cidade,
                uf: transportadoraData.uf,
                cep: transportadoraData.cep,
                telefone: transportadoraData.telefone,
                email: transportadoraData.email,
                placa_veiculo: transportadoraData.placa_veiculo,
                uf_veiculo: transportadoraData.uf_veiculo,
                rntc: transportadoraData.rntc,
            }])
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error creating transportadora:', error);
        throw new Error(error.message || 'Erro ao criar transportadora');
    }
};

/**
 * Atualiza uma transportadora
 */
export const updateTransportadora = async (id, transportadoraData) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .update({
                cpf_cnpj: transportadoraData.cpf_cnpj,
                razao_social: transportadoraData.razao_social,
                nome_fantasia: transportadoraData.nome_fantasia,
                inscricao_estadual: transportadoraData.inscricao_estadual,
                logradouro: transportadoraData.logradouro,
                numero: transportadoraData.numero,
                complemento: transportadoraData.complemento,
                bairro: transportadoraData.bairro,
                cidade: transportadoraData.cidade,
                uf: transportadoraData.uf,
                cep: transportadoraData.cep,
                telefone: transportadoraData.telefone,
                email: transportadoraData.email,
                placa_veiculo: transportadoraData.placa_veiculo,
                uf_veiculo: transportadoraData.uf_veiculo,
                rntc: transportadoraData.rntc,
                ativo: transportadoraData.ativo,
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error updating transportadora:', error);
        throw new Error('Erro ao atualizar transportadora');
    }
};

/**
 * Desativa uma transportadora (soft delete)
 */
export const deleteTransportadora = async (id) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .update({ ativo: false })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error deleting transportadora:', error);
        throw new Error('Erro ao deletar transportadora');
    }
};

/**
 * Busca transportadoras para autocomplete
 */
export const searchTransportadoras = async (query, limit = 10) => {
    try {
        const { data, error } = await supabase
            .from('transportadoras')
            .select('id, cpf_cnpj, razao_social, nome_fantasia, placa_veiculo')
            .eq('ativo', true)
            .or(`razao_social.ilike.%${query}%,nome_fantasia.ilike.%${query}%,cpf_cnpj.ilike.%${query}%`)
            .limit(limit);

        if (error) throw error;
        return data;
    } catch (error) {
        logger.error('Error searching transportadoras:', error);
        throw new Error('Erro ao buscar transportadoras');
    }
};
