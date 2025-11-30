import { supabase } from './supabase';

const API_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export const signup = async (name, email, password, company_name) => {
  const response = await fetch(`${API_URL}/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ name, email, password, company_name }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao cadastrar.');
  }

  return data;
};

export const login = async (email, password) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro ao fazer login.');
  }

  if (data.token) {
    localStorage.setItem('supabase.token', data.token);
  }

  return data;
};

export const logout = async () => {
    localStorage.removeItem('supabase.token');
    // No need to call a server function unless we have session invalidation
    return Promise.resolve();
};

// TODO: Re-implement user management functions using Supabase's Management API
// The functions below are placeholders and will not work until the backend is adjusted.

export const getUsers = async () => {
  logger.warn('getUsers is not implemented yet with Supabase Auth.');
  return [];
};
export const inviteUser = async (email, role) => {
  logger.warn('inviteUser is not implemented yet with Supabase Auth.');
  return null;
};
export const updateUserRole = async (userId, newRole) => {
  logger.warn('updateUserRole is not implemented yet with Supabase Auth.');
  return null;
};
