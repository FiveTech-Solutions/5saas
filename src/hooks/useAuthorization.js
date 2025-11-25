import { useAuth } from '../contexts/AuthContext';
import { useCallback } from 'react';

/**
 * Hook customizado para controle de autorização baseado em plano de assinatura e role do usuário.
 * Ele centraliza a lógica de verificação de permissões, facilitando a manutenção e
 * garantindo que as regras de negócio sejam aplicadas de forma consistente na UI.
 *
 * @returns {Object} Funções e estados de autorização.
 */
export const useAuthorization = () => {
  const { user, subscription, features, isAuthenticated } = useAuth();

  /**
   * Verifica se o plano do usuário inclui uma feature específica.
   * A verificação é case-insensitive.
   *
   * @param {string} featureName - O nome da feature a ser verificada (ex: 'NFE', 'AI_TOOLS').
   * @returns {boolean} - `true` se a feature estiver incluída no plano, `false` caso contrário.
   */
  const hasFeature = useCallback((featureName) => {
    if (!subscription || !features) return false;
    return features.some(f => f.toLowerCase() === featureName.toLowerCase());
  }, [subscription, features]);

  /**
   * Verifica se o usuário possui uma role específica.
   * A verificação é case-insensitive e aceita tanto o formato em inglês quanto em português.
   * Mapeamento: 'admin' = 'administrador', 'member' = 'operador'/'auditor'
   *
   * @param {string|Array<string>} roleName - A role ou uma lista de roles a serem verificadas.
   * @returns {boolean} - `true` se o usuário possuir a role, `false` caso contrário.
   */
  const hasRole = useCallback((roleName) => {
    if (!user?.role) return false;

    const userRole = user.role.toLowerCase();

    // Mapeamento de roles em inglês para português
    const roleMap = {
      'admin': 'administrador',
      'administrador': 'administrador',
      'member': 'operador', // member pode ser operador ou auditor
      'operador': 'operador',
      'auditor': 'auditor'
    };

    // Normaliza a role do usuário
    const normalizedUserRole = roleMap[userRole] || userRole;

    if (Array.isArray(roleName)) {
      return roleName.some(r => {
        const normalizedRole = roleMap[r.toLowerCase()] || r.toLowerCase();
        // Admin/Administrador tem acesso a tudo
        if (normalizedUserRole === 'administrador') return true;
        return normalizedRole === normalizedUserRole;
      });
    }

    const normalizedRole = roleMap[roleName.toLowerCase()] || roleName.toLowerCase();
    // Admin/Administrador tem acesso a tudo
    if (normalizedUserRole === 'administrador') return true;
    return normalizedRole === normalizedUserRole;
  }, [user]);

  // Funções de conveniência que combinam verificações de role e feature.

  /**
   * Verifica se o usuário é um administrador do tenant.
   */
  const isAdmin = useCallback(() => hasRole('admin'), [hasRole]);

  /**
   * Verifica se o usuário pode gerenciar outros usuários (convidar, remover, etc.).
   * Apenas administradores podem fazer isso.
   */
  const canManageUsers = useCallback(() => isAdmin(), [isAdmin]);

  /**
   * Verifica se o usuário pode gerenciar as configurações da empresa/tenant.
   * Apenas administradores podem fazer isso.
   */
  const canManageCompany = useCallback(() => isAdmin(), [isAdmin]);

  /**
   * Verifica se o usuário tem acesso a qualquer funcionalidade de NFS-e.
   * Requer a feature 'NFSE'.
   */
  const canAccessNFSe = useCallback(() => hasFeature('NFSE'), [hasFeature]);

  /**
   * Verifica se o usuário tem acesso a qualquer funcionalidade de NF-e.
   * Requer a feature 'NFE'.
   */
  const canAccessNFe = useCallback(() => hasFeature('NFE'), [hasFeature]);

  /**
   * Verifica se o usuário tem acesso a qualquer funcionalidade de NFC-e.
   * Requer a feature 'NFCE'.
   */
  const canAccessNFCe = useCallback(() => hasFeature('NFCE'), [hasFeature]);

  /**
   * Verifica se o usuário tem acesso às ferramentas de IA.
   * Requer a feature 'AI_TOOLS'.
   */
  const canAccessAITools = useCallback(() => hasFeature('AI_TOOLS'), [hasFeature]);

  return {
    // Dados brutos do contexto de autenticação
    user,
    subscription,
    features,
    isAuthenticated,

    // Funções de verificação
    hasFeature,
    hasRole,

    // Verificações de conveniência
    isAdmin,
    canManageUsers,
    canManageCompany,
    canAccessNFSe,
    canAccessNFe,
    canAccessNFCe,
    canAccessAITools,
  };
};