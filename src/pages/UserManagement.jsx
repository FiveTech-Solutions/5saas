import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { useAuthorization } from '../hooks/useAuthorization';
import { ProtectedContent } from '../components/ProtectedRoute';
import { getUsers, inviteUser, updateUserRole } from '../services/userService';
import './UserManagement.css';
import '../components/ProtectedRoute.css';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('operador');
  const [inviting, setInviting] = useState(false);

  const { user: currentUser } = useAuthorization();

  const roleLabels = {
    admin: 'Administrador',
    operador: 'Operador',
    auditor: 'Auditor'
  };

  const roleDescriptions = {
    admin: 'Acesso total ao sistema',
    operador: 'Emissão de NFS-e e operações do dia a dia',
    auditor: 'Auditoria e fiscalização'
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await getUsers();
      setUsers(userList);
    } catch (err) {
      setError('Falha ao carregar usuários. Verifique se as Edge Functions estão implantadas.');
      logger.error(err);
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
      setInviteRole('operador');
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError('Falha ao convidar usuário.');
      logger.error(err);
    } finally {
      setInviting(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      await loadUsers(); // Refresh the list
    } catch (err) {
      setError('Falha ao atualizar perfil do usuário.');
      logger.error(err);
    }
  };

  if (loading) {
    return (
      <ProtectedContent 
        allowedRoles={['admin']} 
        showAccessDenied={true}
        customMessage="Apenas administradores podem gerenciar usuários."
      >
        <div className="user-management-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Carregando usuários...</p>
          </div>
        </div>
      </ProtectedContent>
    );
  }

  return (
    <ProtectedContent 
      allowedRoles={['admin']} 
      showAccessDenied={true}
      customMessage="Apenas administradores podem gerenciar usuários."
    >
      <div className="user-management-container">
        <div className="user-management-header">
          <div className="header-content">
            <h1>Gestão de Usuários</h1>
            <p className="header-subtitle">
              Gerencie usuários e seus perfis de acesso
            </p>
          </div>
          <button className="btn-primary" onClick={() => setInviteModalOpen(true)}>
            + Novo Usuário
          </button>
        </div>

        {error && (
          <div className="error-banner">
            <span>⚠️ {error}</span>
            <button onClick={() => setError(null)}>✕</button>
          </div>
        )}

        <div className="users-stats">
          <div className="stat-card">
            <h3>Total de Usuários</h3>
            <span className="stat-number">{users.length}</span>
          </div>
          <div className="stat-card">
            <h3>Administradores</h3>
            <span className="stat-number admin">
              {users.filter(u => u.role === 'admin').length}
            </span>
          </div>
          <div className="stat-card">
            <h3>Operadores</h3>
            <span className="stat-number operador">
              {users.filter(u => u.role === 'operador').length}
            </span>
          </div>
          <div className="stat-card">
            <h3>Auditores</h3>
            <span className="stat-number auditor">
              {users.filter(u => u.role === 'auditor').length}
            </span>
          </div>
        </div>

        <div className="user-table-container">
          <table className="user-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Perfil</th>
                <th>Status</th>
                <th>Criado em</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {(user?.full_name || user?.name || user?.email || '').charAt(0)?.toUpperCase() || ''}
                      </div>
                      <div className="user-details">
                        <strong>{user.full_name || user.name || 'N/A'}</strong>
                        <span className="user-email">{user.email || 'Email não disponível'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className={`role-select role-${user.role}`}
                      disabled={user.id === currentUser?.id}
                    >
                      <option value="admin">Administrador</option>
                      <option value="operador">Operador</option>
                      <option value="auditor">Auditor</option>
                    </select>
                  </td>
                  <td>
                    <span className="status-badge active">Ativo</span>
                  </td>
                  <td>{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                  <td>
                    <button className="btn-secondary btn-sm" disabled>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isInviteModalOpen && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>Novo Usuário</h2>
                <button 
                  type="button"
                  className="modal-close"
                  onClick={() => setInviteModalOpen(false)}
                >
                  ✕
                </button>
              </div>
              <form onSubmit={handleInvite}>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={e => setInviteEmail(e.target.value)}
                    required
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="role">Perfil de Acesso</label>
                  <select 
                    id="role" 
                    value={inviteRole} 
                    onChange={e => setInviteRole(e.target.value)}
                    className={`role-select role-${inviteRole}`}
                  >
                    <option value="operador">Operador</option>
                    <option value="auditor">Auditor</option>
                    <option value="admin">Administrador</option>
                  </select>
                  <small className="role-description">
                    {roleDescriptions[inviteRole]}
                  </small>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setInviteModalOpen(false)}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary" disabled={inviting}>
                    {inviting ? 'Criando...' : 'Criar Usuário'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ProtectedContent>
  );
};

export default UserManagement;