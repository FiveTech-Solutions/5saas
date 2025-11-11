import React, { useState, useEffect } from 'react';
import { getUsers, inviteUser, updateUserRole } from '../services/userService';
import './UserManagement.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('faturista');
  const [inviting, setInviting] = useState(false);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getUsers();
      setUsers(userList);
    } catch (err) {
      setError('Falha ao carregar usuários. Verifique se as Edge Functions estão implantadas.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await inviteUser(inviteEmail, inviteRole);
      setInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('faturista');
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError('Falha ao convidar usuário.');
      console.error(err);
    } finally {
      setInviting(false);
    }
  };

  if (loading) {
    return <div>Carregando usuários...</div>;
  }

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>Gestão de Usuários</h1>
        <button className="btn-primary" onClick={() => setInviteModalOpen(true)}>
          + Convidar Usuário
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Email</th>
              <th>Permissão</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.full_name || 'N/A'}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge role-${user.role}`}>{user.role}</span>
                </td>
                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                <td>
                  <button className="btn-secondary btn-sm" disabled>Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Convidar Novo Usuário</h2>
            <form onSubmit={handleInvite}>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)}
                  required
                  placeholder="email@exemplo.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="role">Permissão</label>
                <select id="role" value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                  <option value="faturista">Faturista</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setInviteModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={inviting}>
                  {inviting ? 'Enviando...' : 'Enviar Convite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
