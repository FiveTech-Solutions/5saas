import api from './api';

/**
 * Service for handling digital certificate operations with the PlugNotas API.
 */

/**
 * Uploads a digital certificate.
 * @param {File} file The certificate file (.pfx, .p12).
 * @param {string} password The certificate password.
 * @returns {Promise<string>} The ID of the uploaded certificate.
 */
export const uploadCertificate = async (file, password) => {
  const formData = new FormData();
  formData.append('arquivo', file);
  formData.append('senha', password);

  try {
    const response = await api.post('/certificado', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.id;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao enviar certificado: ${message}`);
    }
    throw error;
  }
};

/**
 * Lists all certificates.
 * @returns {Promise<Array>} A list of certificates.
 */
export const getCertificates = async () => {
  try {
    const response = await api.get('/certificado');
    return response.data;
  } catch (error) {
    const apiError = error.response?.data;
    if (apiError) {
      const message = apiError.message || (apiError.erros && apiError.erros.join(', ')) || 'Erro desconhecido da API.';
      throw new Error(`Falha ao listar certificados: ${message}`);
    }
    throw error;
  }
};
