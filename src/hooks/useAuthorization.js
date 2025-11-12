import { useAuth } from '../contexts/AuthContext';

/**
 * Hook customizado para controle de autorização baseado em perfis
 * @returns {Object} Funções e estados de autorização
 */
export const useAuthorization = () => {
  const { user } = useAuth();

  /**
   * Verifica se o usuário tem permissão para uma determinada ação
   * @param {string|Array} allowedRoles - Role(s) permitida(s) para a ação
   * @returns {boolean} - true se autorizado, false caso contrário
   */
  const hasPermission = (allowedRoles) => {
    if (!user || !user.user_role) return false;

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(user.user_role);
    }

    return user.user_role === allowedRoles;
  };

  /**
   * Verifica se o usuário é administrador
   * @returns {boolean} - true se for admin
   */
  const isAdmin = () => hasPermission('administrador');

  /**
   * Verifica se o usuário é operador
   * @returns {boolean} - true se for operador
   */
  const isOperador = () => hasPermission('operador');

  /**
   * Verifica se o usuário é auditor
   * @returns {boolean} - true se for auditor
   */
  const isAuditor = () => hasPermission('auditor');

  /**
   * Verifica se o usuário pode acessar funcionalidades administrativas
   * @returns {boolean} - true se tiver permissão administrativa
   */
  const canManageUsers = () => isAdmin();

  /**
   * Verifica se o usuário pode acessar funcionalidades de auditoria
   * @returns {boolean} - true se for admin ou auditor
   */
  const canAudit = () => {
    const result = hasPermission(['administrador', 'auditor']);
    console.log('🔍 canAudit Debug:', {
      userRole: user?.user_role,
      allowedRoles: ['administrador', 'auditor'],
      result
    });
    return result;
  };

  /**
   * Verifica se o usuário pode emitir NFS-e
   * @returns {boolean} - true se for admin ou operador
   */
  const canEmitNFSe = () => {
    const result = hasPermission(['administrador', 'operador']);
    console.log('🔍 canEmitNFSe Debug:', {
      userRole: user?.user_role,
      allowedRoles: ['administrador', 'operador'],
      hasUser: !!user,
      result
    });
    return result;
  };

  /**
   * Verifica se o usuário pode gerenciar parâmetros do sistema
   * @returns {boolean} - true se for admin
   */
  const canManageParameters = () => isAdmin();

  /**
   * Verifica se o usuário pode acessar controle de dívida ativa
   * @returns {boolean} - true se for admin ou auditor
   */
  const canManageDebt = () => hasPermission(['administrador', 'auditor']);

  /**
   * Verifica se o usuário pode gerenciar clientes
   * @returns {boolean} - true se for admin ou operador
   */
  const canManageClients = () => hasPermission(['administrador', 'operador']);

  /**
   * Retorna informações do perfil do usuário
   * @returns {Object} - Informações detalhadas do perfil
   */
  const getUserProfile = () => {
    if (!user) return null;

    console.log('useAuthorization - Current user:', user);

    const profiles = {
      administrador: {
        name: 'Administrador',
        description: 'Acesso total ao sistema',
        color: 'red',
        permissions: [
          'Gerenciar usuários',
          'Configurar parâmetros',
          'Emitir NFS-e',
          'Auditoria',
          'Dívida ativa',
          'Relatórios gerenciais'
        ]
      },
      operador: {
        name: 'Operador',
        description: 'Operações do dia a dia',
        color: 'blue',
        permissions: [
          'Emitir NFS-e',
          'Gerenciar clientes',
          'Serviços tomados',
          'Declaração DES-IF'
        ]
      },
      auditor: {
        name: 'Auditor',
        description: 'Auditoria e fiscalização',
        color: 'orange',
        permissions: [
          'Auditoria fiscal',
          'Simples Nacional',
          'Autos de infração',
          'Dívida ativa',
          'Relatórios de auditoria'
        ]
      }
    };

    return {
      ...profiles[user.user_role],
      currentRole: user.user_role,
      user: user
    };
  };

  /**
   * Lista todas as rotas disponíveis para o usuário atual
   * @returns {Array} - Array de rotas permitidas
   */
  const getAvailableRoutes = () => {
    const routes = {
      common: [
        { path: '/', name: 'Dashboard', module: 'NFS-e' },
        { path: '/clientes', name: 'Clientes', module: 'Configurações' },
        { path: '/empresa/configuracoes', name: 'Empresa', module: 'Configurações' },
        { path: '/settings', name: 'Minha Conta', module: 'Configurações' }
      ],
      administrador: [
        { path: '/admin/users', name: 'Usuários', module: 'Administração' },
        { path: '/admin/parametros', name: 'Parâmetros', module: 'Administração' },
        { path: '/nfse', name: 'Minhas NFS-e', module: 'NFS-e' },
        { path: '/nfse/new', name: 'Nova NFS-e', module: 'NFS-e' },
        { path: '/servicos-tomados', name: 'Lançamentos', module: 'Serviços Tomados' },
        { path: '/des-if', name: 'Declaração', module: 'DES-IF' },
        { path: '/auditoria/simples-nacional', name: 'Simples Nacional', module: 'Auditoria' },
        { path: '/auditoria/autos-infracao', name: 'Autos de Infração', module: 'Auditoria' },
        { path: '/divida-ativa', name: 'Controle', module: 'Dívida Ativa' }
      ],
      operador: [
        { path: '/nfse', name: 'Minhas NFS-e', module: 'NFS-e' },
        { path: '/nfse/new', name: 'Nova NFS-e', module: 'NFS-e' },
        { path: '/servicos-tomados', name: 'Lançamentos', module: 'Serviços Tomados' },
        { path: '/des-if', name: 'Declaração', module: 'DES-IF' }
      ],
      auditor: [
        { path: '/auditoria/simples-nacional', name: 'Simples Nacional', module: 'Auditoria' },
        { path: '/auditoria/autos-infracao', name: 'Autos de Infração', module: 'Auditoria' },
        { path: '/divida-ativa', name: 'Controle', module: 'Dívida Ativa' }
      ]
    };

    if (!user || !user.user_role) return routes.common;

    return [
      ...routes.common,
      ...(routes[user.user_role] || [])
    ];
  };

  return {
    // Estados
    user,
    isAuthenticated: !!user,
    
    // Verificações gerais
    hasPermission,
    isAdmin,
    isOperador,
    isAuditor,
    
    // Verificações específicas por funcionalidade
    canManageUsers,
    canAudit,
    canEmitNFSe,
    canManageParameters,
    canManageDebt,
    canManageClients,
    
    // Informações do perfil
    getUserProfile,
    getAvailableRoutes
  };
};