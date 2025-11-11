import api from './api';

/**
 * Service for handling specific PlugNotas (Technospeed) API calls.
 */

/**
 * Registers a new Company (emitente/prestador) with the PlugNotas API.
 * @param {object} companyData The full company data object, matching the API docs.
 * @returns {Promise<object>} The response from the PlugNotas API.
 */
export const registerCompanyWithPlugNotas = async (companyData) => {
  try {
    // The API expects the data directly as the payload.
    const response = await api.post('/empresa', companyData);
    return response.data;
  } catch (error) {
    // Axios encapsulates the error in error.response
    const apiError = error.response?.data;
    if (apiError) {
      // You can create a more specific error message here
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao registrar empresa no provedor: ${message}`);
    }
    // Fallback for network errors or other issues
    throw error;
  }
};
