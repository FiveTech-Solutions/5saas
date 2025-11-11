import { supabase } from './supabase';

/**
 * Service for handling Customer data in Supabase.
 * A "Customer" is the "Tomador" of the NFSe.
 */

/**
 * Fetches all customers for the current authenticated user.
 * @returns {Promise<Array>} A list of customers, ordered by name.
 */
export const getCustomers = async () => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('razao_social', { ascending: true });

  if (error) {
    console.error('Error fetching customers:', error);
    throw error;
  }

  return data;
};

/**
 * Creates a new customer record.
 * @param {object} customerData The data for the new customer.
 * @returns {Promise<object>} The newly created customer data.
 */
export const createCustomer = async (customerData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Usuário não autenticado.');

  const dataToSave = {
    ...customerData,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('customers')
    .insert(dataToSave)
    .select()
    .single();

  if (error) {
    console.error('Error creating customer:', error);
    // Handle unique constraint violation
    if (error.code === '23505') {
      throw new Error('Já existe um cliente com este CPF/CNPJ.');
    }
    throw error;
  }

  return data;
};

/**
 * Updates an existing customer record.
 * @param {string} customerId The ID of the customer to update.
 * @param {object} updates The data to update.
 * @returns {Promise<object>} The updated customer data.
 */
export const updateCustomer = async (customerId, updates) => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('Error updating customer:', error);
    throw error;
  }

  return data;
};

/**
 * Deletes a customer record.
 * @param {string} customerId The ID of the customer to delete.
 * @returns {Promise<void>}
 */
export const deleteCustomer = async (customerId) => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId);

  if (error) {
    console.error('Error deleting customer:', error);
    throw error;
  }
};
