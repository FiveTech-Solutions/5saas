import axios from 'axios';

const API_BASE_URL = 'https://api.sandbox.plugnotas.com.br';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include API key if available
api.interceptors.request.use(
  (config) => {
    const apiKey = localStorage.getItem('technospeed_api_key');
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
