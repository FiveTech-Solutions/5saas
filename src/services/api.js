import axios from 'axios';
import { supabase } from './supabase'; // Import supabase client

const API_BASE_URL = 'https://api.sandbox.plugnotas.com.br';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request Interceptor ---
// Injects the API Key and the Supabase JWT into every request.
api.interceptors.request.use(
  async (config) => {
    // 1. Add API Key from environment variable
    const apiKey = import.meta.env.VITE_SPEED_API_KEY;
    if (apiKey) {
      config.headers['x-api-key'] = apiKey;
    } else {
      console.error("VITE_SPEED_API_KEY is not defined in .env file.");
    }

    // 2. Add Supabase JWT for authentication
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
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
      console.warn('Session expired or invalid. Triggering logout.');
      // Dispatch a custom event that the AuthContext can listen for
      window.dispatchEvent(new Event('session-expired'));
    }
    
    // Return the error to be handled by the calling function as well
    return Promise.reject(error);
  }
);


export default api;
