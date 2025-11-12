import { supabase } from './supabase';

/**
 * Registrar novo usuário usando Supabase Auth
 * @param {string} name - Nome completo
 * @param {string} email - Email
 * @param {string} password - Senha
 * @param {string} company_name - Nome da empresa
 */
export const signup = async (name, email, password, company_name) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          company_name: company_name
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Erro no signup:', error);
    throw new Error(error.message || 'Erro ao criar conta');
  }
};

/**
 * Fazer login usando Supabase Auth
 * @param {string} email - Email
 * @param {string} password - Senha
 */
export const login = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    // Buscar perfil do usuário
    const profile = await getUserProfile(data.user.id);
    
    return {
      ...data,
      profile
    };
  } catch (error) {
    console.error('Erro no login:', error);
    throw new Error(error.message || 'Erro ao fazer login');
  }
};

/**
 * Fazer logout
 */
export const logout = async () => {
  try {
    // Log da ação
    await logUserAction('logout');
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Erro no logout:', error);
    // Não lança erro para não bloquear o logout
  }
};

/**
 * Obter perfil completo do usuário
 * @param {string} userId - ID do usuário (opcional, usa o atual se não fornecido)
 */
export const getUserProfile = async (userId = null) => {
  try {
    const { data, error } = await supabase.rpc('get_user_profile', {
      user_uuid: userId
    });

    if (error) {
      throw error;
    }

    console.log('Raw getUserProfile data:', data);
    
    // Nossa função PostgreSQL retorna um JSON object diretamente, não um array
    return data || null;
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    throw new Error('Erro ao carregar perfil do usuário');
  }
};

/**
 * Listar usuários da empresa
 */
export const getUsers = async () => {
  try {
    const { data, error } = await supabase
      .from('users_view')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw new Error('Erro ao carregar lista de usuários');
  }
};

/**
 * Convidar novo usuário (admin apenas)
 * @param {string} email - Email do novo usuário
 * @param {string} role - Role do usuário (admin, operador, auditor)
 * @param {string} fullName - Nome completo (opcional)
 */
export const inviteUser = async (email, role = 'operador', fullName = '') => {
  try {
    // Verificar se o usuário atual é admin
    const currentProfile = await getUserProfile();
    if (currentProfile.role !== 'admin') {
      throw new Error('Apenas administradores podem convidar usuários');
    }

    // Criar usuário via admin API (requer service role key)
    // Por enquanto, vamos simular criando um "convite"
    const { data, error } = await supabase
      .from('user_invites')
      .insert([{
        email,
        role,
        full_name: fullName || email.split('@')[0],
        company_id: currentProfile.company_id,
        invited_by: currentProfile.id,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da ação
    await logUserAction('user_invite', {
      invited_email: email,
      role: role
    });

    return data;
  } catch (error) {
    console.error('Erro ao convidar usuário:', error);
    throw new Error(error.message || 'Erro ao convidar usuário');
  }
};

/**
 * Atualizar role do usuário (admin apenas)
 * @param {string} userId - ID do usuário
 * @param {string} newRole - Nova role
 */
export const updateUserRole = async (userId, newRole) => {
  try {
    // Verificar se o usuário atual é admin
    const currentProfile = await getUserProfile();
    if (currentProfile.role !== 'admin') {
      throw new Error('Apenas administradores podem alterar perfis');
    }

    // Não permitir que admin remova seu próprio status de admin
    if (userId === currentProfile.id && newRole !== 'admin') {
      throw new Error('Você não pode alterar seu próprio perfil de administrador');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        role: newRole,
        updated_by: currentProfile.id
      })
      .eq('id', userId)
      .eq('company_id', currentProfile.company_id) // Só pode alterar usuários da mesma empresa
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da ação
    await logUserAction('role_change', {
      target_user_id: userId,
      new_role: newRole
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar role:', error);
    throw new Error(error.message || 'Erro ao atualizar perfil do usuário');
  }
};

/**
 * Atualizar status ativo/inativo do usuário (admin apenas)
 * @param {string} userId - ID do usuário
 * @param {boolean} active - Status ativo
 */
export const updateUserStatus = async (userId, active) => {
  try {
    // Verificar se o usuário atual é admin
    const currentProfile = await getUserProfile();
    if (currentProfile.role !== 'admin') {
      throw new Error('Apenas administradores podem alterar status de usuários');
    }

    // Não permitir que admin desative a si mesmo
    if (userId === currentProfile.id && !active) {
      throw new Error('Você não pode desativar sua própria conta');
    }

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        active: active,
        updated_by: currentProfile.id
      })
      .eq('id', userId)
      .eq('company_id', currentProfile.company_id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da ação
    await logUserAction('status_change', {
      target_user_id: userId,
      new_status: active ? 'active' : 'inactive'
    });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    throw new Error(error.message || 'Erro ao atualizar status do usuário');
  }
};

/**
 * Atualizar perfil do usuário atual
 * @param {Object} updates - Dados para atualizar
 */
export const updateProfile = async (updates) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', (await supabase.auth.getUser()).data.user.id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log da ação
    await logUserAction('profile_update', { updated_fields: Object.keys(updates) });

    return data;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw new Error('Erro ao atualizar perfil');
  }
};

/**
 * Verificar permissão do usuário
 * @param {string|Array} allowedRoles - Roles permitidos
 */
export const checkPermission = async (allowedRoles) => {
  try {
    const profile = await getUserProfile();
    
    if (!profile || !profile.active) {
      return false;
    }

    if (Array.isArray(allowedRoles)) {
      return allowedRoles.includes(profile.role);
    }

    return profile.role === allowedRoles;
  } catch (error) {
    console.error('Erro ao verificar permissão:', error);
    return false;
  }
};

/**
 * Registrar ação do usuário no log de auditoria
 * @param {string} action - Ação realizada
 * @param {Object} details - Detalhes da ação (opcional)
 */
export const logUserAction = async (action, details = null) => {
  try {
    const { data, error } = await supabase.rpc('log_user_action', {
      p_action: action,
      p_details: details
    });

    if (error) {
      console.error('Erro ao registrar log:', error);
    }

    return data;
  } catch (error) {
    console.error('Erro ao registrar log:', error);
    // Não lança erro para não quebrar a funcionalidade principal
  }
};

/**
 * Obter logs de auditoria do usuário
 * @param {number} limit - Limite de registros (padrão: 50)
 */
export const getUserAuditLogs = async (limit = 50) => {
  try {
    const { data, error } = await supabase
      .from('user_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Erro ao buscar logs:', error);
    throw new Error('Erro ao carregar histórico de ações');
  }
};