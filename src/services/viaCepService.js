import axios from 'axios';
import logger from '../utils/logger';

export const getAddressFromCEP = async (cep) => {
  if (!cep || cep.replace(/\D/g, '').length !== 8) {
    return null;
  }

  try {
    const response = await axios.get(`https://viacep.com.br/ws/${cep}/json/`);
    if (response.data.erro) {
      return null;
    }
    return response.data;
  } catch (error) {
    logger.error('Error fetching address from ViaCEP:', error);
    return null;
  }
};
