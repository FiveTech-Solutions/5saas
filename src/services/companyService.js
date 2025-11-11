import { supabase } from './supabase';

/**
 * Service for handling Company data in Supabase.
 */

/**
 * Fetches the company data for the current authenticated user.
 * @returns {Promise<object|null>} The company data or null if not found.
 */
export const getCompany = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', user.id)
    .single(); // .single() expects at most one row and returns an object instead of an array

  if (error && error.code !== 'PGRST116') { // PGRST116 = 'No rows found'
    console.error('Erro ao buscar dados da empresa:', error);
    throw error;
  }

  return data;
};

/**
 * Creates or updates a company's data.
 * This function uses 'upsert' to either insert a new row if one doesn't exist
 * for the user, or update the existing one.
 * @param {object} companyData The data for the company.
 * @returns {Promise<object>} The saved company data.
 */
export const saveCompany = async (companyData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  // Ensure user_id is set for the upsert operation
  const dataToSave = {
    ...companyData,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('companies')
    .upsert(dataToSave, { onConflict: 'user_id' }) // Upsert based on the user_id constraint
    .select()
    .single();

  if (error) {
    console.error('Erro ao salvar dados da empresa:', error);
    throw error;
  }

  return data;
};
