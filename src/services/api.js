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
    const { config, response } = error;

    // Check if the error is a 401 Unauthorized
    if (response && response.status === 401) {
      // Only trigger global logout for non-GET requests
      // GET requests might fail with 401 for resource-specific permissions,
      // which shouldn't log out the entire app.
      if (config.method !== 'get') {
        console.warn('Session expired or invalid due to non-GET request. Logging out.');
        
        // Clean up local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        
        // Redirect to login page
        window.location.href = '/auth';
      }
    }
    
    // Return the error to be handled by the calling function as well
    return Promise.reject(error);
  }
);


export default api;
