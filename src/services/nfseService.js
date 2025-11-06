import api from './api';

/**
 * NFS-e Service - Integration with Technospeed API
 */

// Create a new NFS-e
export const createNFSe = async (nfseData) => {
  try {
    const response = await api.post('/nfse', nfseData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get NFS-e by ID or Protocol
export const getNFSe = async (idNotaOrProtocol) => {
  try {
    const response = await api.get(`/nfse/${idNotaOrProtocol}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get NFS-e PDF
export const getNFSePDF = async (idNota) => {
  try {
    const response = await api.get(`/nfse/pdf/${idNota}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get NFS-e XML
export const getNFSeXML = async (idNota) => {
  try {
    const response = await api.get(`/nfse/xml/${idNota}`, {
      responseType: 'blob',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Cancel NFS-e
export const cancelNFSe = async (idNota, cancelData) => {
  try {
    const response = await api.post(`/nfse/cancelar/${idNota}`, cancelData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Send NFS-e by email
export const sendNFSeByEmail = async (idNota, emailData) => {
  try {
    const response = await api.post(`/nfse/email/${idNota}`, emailData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// List all NFS-e (if backend supports pagination)
export const listNFSe = async (params = {}) => {
  try {
    const response = await api.get('/nfse', { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
