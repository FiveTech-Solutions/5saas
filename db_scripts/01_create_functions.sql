-- ================================================================
-- SCRIPT: Criar Funções Necessárias
-- ================================================================
-- Execute este script ANTES de configurar RLS
-- Cria as funções que são usadas pelas políticas de segurança
-- ================================================================

-- Função para obter o tenant_id do usuário logado
-- NOTA: No schema public porque não temos permissão no schema auth
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.current_tenant_id() IS 'Retorna o tenant_id do usuário autenticado.';

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.trigger_set_timestamp() IS 'Atualiza automaticamente o campo updated_at.';

-- Função para log de ações
CREATE OR REPLACE FUNCTION public.log_user_action(
    p_action TEXT DEFAULT '',
    p_details TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE NOTICE 'User Action: % - Details: %', p_action, COALESCE(p_details, 'No details');
    
    RETURN json_build_object(
        'success', true,
        'action', p_action,
        'timestamp', NOW()
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION public.log_user_action(TEXT, TEXT) IS 'Registra ações do usuário no sistema.';

-- Função para buscar perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data JSON;
    target_user_id UUID;
BEGIN
    target_user_id := COALESCE(user_uuid, auth.uid());
    
    IF auth.uid() IS NULL THEN
        RETURN json_build_object(
            'error', 'Usuário não autenticado',
            'authenticated', false
        );
    END IF;
    
    SELECT json_build_object(
        'id', COALESCE(up.id, target_user_id),
        'email', COALESCE(up.email, (SELECT email FROM auth.users WHERE id = target_user_id)),
        'full_name', COALESCE(up.full_name, ''),
        'user_role', COALESCE(up.user_role, 'operador'::user_role_enum),
        'company_id', up.company_id,
        'is_active', COALESCE(up.is_active, true),
        'created_at', COALESCE(up.created_at, NOW())
    ) INTO user_data
    FROM public.user_profiles up
    RIGHT JOIN auth.users au ON au.id = up.id
    WHERE au.id = target_user_id;
    
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = target_user_id) AND target_user_id = auth.uid() THEN
        INSERT INTO public.user_profiles (id, email, user_role)
        SELECT 
            target_user_id,
            email,
            'operador'::user_role_enum
        FROM auth.users 
        WHERE id = target_user_id
        ON CONFLICT (id) DO NOTHING;
        
        SELECT json_build_object(
            'id', up.id,
            'email', up.email,
            'full_name', COALESCE(up.full_name, ''),
            'user_role', up.user_role,
            'company_id', up.company_id,
            'is_active', up.is_active,
            'created_at', up.created_at
        ) INTO user_data
        FROM public.user_profiles up
        WHERE up.id = target_user_id;
    END IF;
    
    RETURN user_data;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'error', SQLERRM,
            'authenticated', auth.uid() IS NOT NULL
        );
END;
$$;

COMMENT ON FUNCTION public.get_user_profile(UUID) IS 'Busca ou cria o perfil de um usuário.';

-- Criar triggers para updated_at
DROP TRIGGER IF EXISTS set_timestamp ON public.tenants;
CREATE TRIGGER set_timestamp 
    BEFORE UPDATE ON public.tenants 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
CREATE TRIGGER set_timestamp_users 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_subscriptions ON public.subscriptions;
CREATE TRIGGER set_timestamp_subscriptions 
    BEFORE UPDATE ON public.subscriptions 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_nfses ON public.nfses;
CREATE TRIGGER set_timestamp_nfses 
    BEFORE UPDATE ON public.nfses 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_companies ON public.companies;
CREATE TRIGGER set_timestamp_companies 
    BEFORE UPDATE ON public.companies 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

DROP TRIGGER IF EXISTS set_timestamp_customers ON public.customers;
CREATE TRIGGER set_timestamp_customers 
    BEFORE UPDATE ON public.customers 
    FOR EACH ROW 
    EXECUTE PROCEDURE public.trigger_set_timestamp();

SELECT '✅ Funções e triggers criados com sucesso!' AS status;
