import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import logger from '../utils/logger';

const AdminTools = () => {
  const [updating, setUpdating] = useState(false);
  const [result, setResult] = useState('');

  const updateUserToAdmin = async () => {
    setUpdating(true);
    setResult('');

    try {
      // Atualizar o usuário para administrador
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ user_role: 'administrador' })
        .eq('email', 'euclideslione@gmail.com')
        .select();

      if (error) {
        throw error;
      }

      setResult('✅ Usuário atualizado com sucesso! Recarregue a página.');
      logger.debug('User updated:', data);
    } catch (error) {
      setResult(`❌ Erro: ${error.message}`);
      logger.error('Error updating user:', error);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #ccc',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9999,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
    }}>
      <h4>Admin Tools</h4>
      <button
        onClick={updateUserToAdmin}
        disabled={updating}
        style={{
          padding: '8px 16px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: updating ? 'not-allowed' : 'pointer'
        }}
      >
        {updating ? 'Atualizando...' : 'Tornar Admin'}
      </button>
      {result && (
        <div style={{ marginTop: '10px', fontSize: '14px' }}>
          {result}
        </div>
      )}
    </div>
  );
};

export default AdminTools;