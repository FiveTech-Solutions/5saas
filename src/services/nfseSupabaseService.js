import { supabase } from './supabase';

/**
 * Service for handling NFS-e data in Supabase.
 */

// 1. List all NFS-e for the current user
export const listNfses = async () => {
  const { data, error } = await supabase
    .from('nfses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching NFS-e from Supabase:', error);
    throw error;
  }

  return data;
};

// 2. Create a new NFS-e record
export const createNfse = async (nfseToSave, userId) => {
  if (!userId) throw new Error('User ID is required to create an NFS-e.');

  const { nfse_data, protocol, id_integracao, status } = nfseToSave;

  const { data, error } = await supabase
    .from('nfses')
    .insert([{
      user_id: userId,
      nfse_data: nfse_data, // The full JSON payload sent to the external API
      protocol: protocol,     // The protocol from the API response
      id_integracao: id_integracao, // The integration ID
      status: status || 'Em processamento',
    }])
    .select();

  if (error) {
    console.error('Error creating NFS-e in Supabase:', error);
    throw error;
  }

  return data[0];
};

// 3. Get a single NFS-e by its ID
export const getNfseById = async (id) => {
  const { data, error } = await supabase
    .from('nfses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching NFS-e by ID from Supabase:', error);
    throw error;
  }

  return data;
};

// 4. Update an NFS-e record
export const updateNfse = async (id, updates) => {
  const { data, error } = await supabase
    .from('nfses')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) {
    console.error('Error updating NFS-e in Supabase:', error);
    throw error;
  }

  return data[0];
};

// 5. Delete an NFS-e record
export const deleteNfse = async (id) => {
  const { data, error } = await supabase
    .from('nfses')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting NFS-e from Supabase:', error);
    throw error;
  }

  return data;
};
