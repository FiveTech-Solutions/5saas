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

/**
 * Consultar notas por período
 * @param {Object} params - Parâmetros de consulta
 * @param {string} params.cpfCnpj - CPF ou CNPJ da empresa
 * @param {string} params.dataInicial - Data inicial (YYYY-MM-DD)
 * @param {string} params.dataFinal - Data final (YYYY-MM-DD)
 * @param {string} params.hashProximaPagina - Hash para paginação
 * @returns {Promise<Object>} Resposta com notas e hash da próxima página
 */
export const consultarNotasPorPeriodo = async (params) => {
  try {
    const response = await api.get('/nfse/consultar/periodo', { params });
    return response.data;
  } catch (error) {
    console.error('Erro ao consultar notas por período:', error);
    throw error.response?.data || error.message;
  }
};

// Função para baixar PDF da nota
export const baixarPdfNota = async (idNota) => {
  try {
    const response = await api.get(`/nfse/pdf/${idNota}`, {
      responseType: 'blob',
    });

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFSe_${idNota}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
    throw error.response?.data || error.message;
  }
};

// Função para baixar XML da nota
export const baixarXmlNota = async (idNota) => {
  try {
    const response = await api.get(`/nfse/xml/${idNota}`, {
      responseType: 'blob',
    });

    const blob = response.data;
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `NFSe_${idNota}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('Erro ao baixar XML:', error);
    throw error.response?.data || error.message;
  }
};

// Função para enviar nota por email
export const enviarNotaPorEmail = async (idNota, destinatarios, reenvio = true) => {
  try {
    const response = await api.post(`/nfse/email/${idNota}`, {
      reenvio,
      destinatarios,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao enviar nota por email:', error);
    throw error.response?.data || error.message;
  }
};

// Função para cancelar nota
export const cancelarNota = async (idNota, codigo = '9', motivo = 'Cancelamento a pedido do Prestador') => {
  try {
    const response = await api.post(`/nfse/cancelar/${idNota}`, {
      codigo,
      motivo,
    });
    return response.data;
  } catch (error) {
    console.error('Erro ao cancelar nota:', error);
    throw error.response?.data || error.message;
  }
};
