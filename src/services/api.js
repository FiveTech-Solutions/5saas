import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SPEED_BASE_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// --- Request Interceptor ---
// Injects the API Key and our custom JWT into every request.
api.interceptors.request.use(
  (config) => {
    // 1. Add API Key from environment variable
    const apiKey = import.meta.env.VITE_SPEED_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    } else {
      console.error("VITE_SPEED_API_KEY is not defined in .env file.");
    }

    // 2. Add our custom JWT for authentication
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Response Interceptor ---
// Handles global errors, especially 401 for expired sessions.
api.interceptors.response.use(
  (response) => response, // Simply return successful responses
  (error) => {
    // Check if the error is a 401 Unauthorized
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or invalid. Logging out.');
      // Clean up local storage
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login page
      window.location.href = '/';
    }
    
    // Return the error to be handled by the calling function as well
    return Promise.reject(error);
  }
);


export default api;
