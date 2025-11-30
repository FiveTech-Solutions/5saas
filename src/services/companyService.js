import { supabase } from './supabase';
import logger from '../utils/logger';
import { getCompanyDetailsByCnpj } from './plugnotasService'; // Import PlugNotas service

/**
 * Service for handling Company data.
 * NOTE: As per user request, getCompany now fetches from PlugNotas API.
 * The saveCompany function is commented out as it no longer aligns with this approach.
 */

/**
 * Fetches the company data from PlugNotas API using a hardcoded CNPJ.
 * @returns {Promise<object|null>} The company data from PlugNotas or null if not found.
 */
export const getCompany = async () => {
  try {
    // Hardcoded CNPJ as per user request
    const cnpj = '47793601000161'; 
    const companyData = await getCompanyDetailsByCnpj(cnpj);

    // Map PlugNotas response to a more generic company object if needed,
    // but for now, return as is.
    return companyData;
  } catch (error) {
    logger.error('Erro ao buscar dados da empresa no PlugNotas:', error);
    // Depending on desired behavior, you might want to return null or re-throw
    return null; 
  }
};

/**
 * This function is commented out as per user request.
 * If company data is always fetched from PlugNotas, saving to Supabase
 * for this specific company might not be the intended behavior.
 *
 * Creates or updates a company's data.
 * This function uses 'upsert' to either insert a new row if one doesn't exist
 * for the user, or update the existing one.
 * @param {object} companyData The data for the company.
 * @returns {Promise<object>} The saved company data.
 */
// export const saveCompany = async (companyData) => {
//   const { data: { user } } = await supabase.auth.getUser();
//   if (!user) throw new Error('Usuário não autenticado.');

//   // Ensure user_id is set for the upsert operation
//   const dataToSave = {
//     ...companyData,
//     user_id: user.id,
//   };

//   const { data, error } = await supabase
//     .from('companies')
//     .upsert(dataToSave, { onConflict: 'user_id' }) // Upsert based on the user_id constraint
//     .select()
//     .single();

//   if (error) {
//     logger.error('Erro ao salvar dados da empresa:', error);
//     throw error;
//   }

//   return data;
// };
