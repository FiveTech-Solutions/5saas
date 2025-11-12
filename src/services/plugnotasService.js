import api from './api';

/**
 * Service for handling specific PlugNotas (Technospeed) API calls.
 */

/**
 * Fetches company details from PlugNotas API using CNPJ.
 * @param {string} cnpj The CNPJ to query.
 * @returns {Promise<object>} The company details from the PlugNotas API.
 */
export const getCompanyDetailsByCnpj = async (cnpj) => {
  try {
    const response = await api.get(`/cnpj/${cnpj}`);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao consultar CNPJ no provedor: ${message}`);
    }
    throw error;
  }
};

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

/**
 * Fetches NFSe details from PlugNotas API using idNotaOrProtocol.
 * @param {string} idNotaOrProtocol The ID or protocol of the NFSe to query.
 * @returns {Promise<object>} The NFSe details from the PlugNotas API.
 */
export const getNFSeDetails = async (idNotaOrProtocol) => {
  try {
    const response = await api.get(`/nfse/${idNotaOrProtocol}`);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao consultar detalhes da NFS-e: ${message}`);
    }
    throw error;
  }
};

/**
 * Registers a new Tomador with the PlugNotas API.
 * @param {object} tomadorData The full tomador data object, matching the API docs.
 * @returns {Promise<object>} The response from the PlugNotas API.
 */
export const registerTomadorPlugNotas = async (tomadorData) => {
  try {
    const response = await api.post('/nfse/tomador', tomadorData);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao registrar tomador no provedor: ${message}`);
    }
    throw error;
  }
};

/**
 * Fetches tomador details from PlugNotas API using CPF/CNPJ.
 * @param {string} cpfCnpj The CPF/CNPJ of the tomador to query.
 * @returns {Promise<object>} The tomador details from the PlugNotas API.
 */
export const getTomadorPlugNotas = async (cpfCnpj) => {
  try {
    const response = await api.get(`/nfse/tomador/${cpfCnpj}`);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      // If tomador not found, the API might return a 404 or a specific error message.
      // We'll treat 404 as "not found" and return null, otherwise rethrow.
      if (error.response.status === 404) {
        return null; // Tomador not found
      }
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao consultar tomador no provedor: ${message}`);
    }
    throw error;
  }
};

/**
 * Registers a new Servico with the PlugNotas API.
 * @param {object} servicoData The full servico data object, matching the API docs.
 * @returns {Promise<object>} The response from the PlugNotas API.
 */
export const registerServicoPlugNotas = async (servicoData) => {
  try {
    const response = await api.post('/nfse/servico', servicoData);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao registrar serviço no provedor: ${message}`);
    }
    throw error;
  }
};

/**
 * Fetches servico details from PlugNotas API using idServico.
 * @param {string} idServico The idIntegracao or codigo of the servico to query.
 * @returns {Promise<object>} The servico details from the PlugNotas API.
 */
export const getServicoPlugNotas = async (idServico) => {
  try {
    const response = await api.get(`/nfse/servico/${idServico}`);
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      if (error.response.status === 404) {
        return null; // Servico not found
      }
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao consultar serviço no provedor: ${message}`);
    }
    throw error;
  }
};
