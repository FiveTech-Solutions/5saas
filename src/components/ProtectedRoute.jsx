import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthorization } from '../hooks/useAuthorization';

/**
 * Higher-Order Component para proteção de rotas baseada em perfis
 * @param {React.Component} Component - Componente a ser protegido
 * @param {string|Array} allowedRoles - Role(s) permitida(s) para acessar o componente
 * @param {string} redirectTo - Rota para redirecionamento se não autorizado
 * @returns {React.Component} - Componente protegido
 */
export const withAuthorization = (Component, allowedRoles, redirectTo = '/') => {
  return function ProtectedComponent(props) {
    const { hasPermission, isAuthenticated } = useAuthorization();

    // Se não estiver autenticado, redireciona para login
    if (!isAuthenticated) {
      return <Navigate to="/auth" replace />;
    }

    // Se não tiver permissão, redireciona ou mostra mensagem
    if (!hasPermission(allowedRoles)) {
      return <Navigate to={redirectTo} replace />;
    }

    // Se tiver permissão, renderiza o componente
    return <Component {...props} />;
  };
};

/**
 * Componente para exibir mensagem de acesso negado
 */
export const AccessDenied = ({ message, allowedRoles, currentRole }) => {
  return (
    <div className="access-denied-container">
      <div className="access-denied-card">
        <div className="access-denied-icon">🔒</div>
        <h2>Acesso Negado</h2>
        <p className="access-denied-message">
          {message || 'Você não tem permissão para acessar esta funcionalidade.'}
        </p>
        
        <div className="access-denied-details">
          <div className="permission-info">
            <strong>Perfil atual:</strong> 
            <span className={`role-badge role-${currentRole}`}>
              {currentRole === 'admin' && 'Administrador'}
              {currentRole === 'operador' && 'Operador'}
              {currentRole === 'auditor' && 'Auditor'}
            </span>
          </div>
          
          <div className="required-permissions">
            <strong>Perfis necessários:</strong>
            <div className="required-roles">
              {Array.isArray(allowedRoles) ? (
                allowedRoles.map(role => (
                  <span key={role} className={`role-badge role-${role}`}>
                    {role === 'admin' && 'Administrador'}
                    {role === 'operador' && 'Operador'}
                    {role === 'auditor' && 'Auditor'}
                  </span>
                ))
              ) : (
                <span className={`role-badge role-${allowedRoles}`}>
                  {allowedRoles === 'admin' && 'Administrador'}
                  {allowedRoles === 'operador' && 'Operador'}
                  {allowedRoles === 'auditor' && 'Auditor'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="access-denied-actions">
          <button 
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            Voltar
          </button>
          <button 
            onClick={() => window.location.href = '/'}
            className="btn-primary"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Hook para proteção de funcionalidades dentro de componentes
 * @param {string|Array} allowedRoles - Role(s) permitida(s)
 * @param {Object} options - Opções de configuração
 * @returns {Object} - Estado de autorização e componente de negação
 */
export const useProtectedFeature = (allowedRoles, options = {}) => {
  const { hasPermission, user, isAuthenticated } = useAuthorization();
  
  const {
    redirectTo = '/',
    showAccessDenied = true,
    customMessage = null
  } = options;

  const isAuthorized = isAuthenticated && hasPermission(allowedRoles);

  const AccessDeniedComponent = () => {
    if (!showAccessDenied) return null;
    
    return (
      <AccessDenied 
        message={customMessage}
        allowedRoles={allowedRoles}
        currentRole={user?.role}
      />
    );
  };

  const redirect = () => {
    if (!isAuthenticated) {
      window.location.href = '/auth';
    } else {
      window.location.href = redirectTo;
    }
  };

  return {
    isAuthorized,
    isAuthenticated,
    currentRole: user?.role,
    AccessDeniedComponent,
    redirect
  };
};

/**
 * Componente condicional que renderiza baseado em permissões
 * @param {Object} props - Props do componente
 * @param {string|Array} props.allowedRoles - Role(s) permitida(s)
 * @param {React.ReactNode} props.children - Conteúdo a ser renderizado se autorizado
 * @param {React.ReactNode} props.fallback - Conteúdo alternativo se não autorizado
 * @param {boolean} props.showAccessDenied - Se deve mostrar mensagem de acesso negado
 * @returns {React.ReactNode} - Conteúdo baseado na autorização
 */
export const ProtectedContent = ({ 
  allowedRoles, 
  children, 
  fallback = null, 
  showAccessDenied = false,
  customMessage = null
}) => {
  const { hasPermission, user, isAuthenticated } = useAuthorization();

  if (!isAuthenticated) {
    return fallback || (showAccessDenied ? 
      <AccessDenied message="Você precisa estar logado para acessar este conteúdo." /> 
      : null
    );
  }

  if (!hasPermission(allowedRoles)) {
    return fallback || (showAccessDenied ? 
      <AccessDenied 
        message={customMessage}
        allowedRoles={allowedRoles}
        currentRole={user?.role}
      /> 
      : null
    );
  }

  return children;
};