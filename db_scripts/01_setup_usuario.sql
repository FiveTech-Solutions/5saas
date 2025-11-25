-- ================================================================
-- SCRIPT: Configurar Usuário Inicial
-- ================================================================
-- Execute APÓS criar o banco com 00_setup_completo.sql
-- IMPORTANTE: Altere o email antes de executar!
-- ================================================================

DO $$
DECLARE
    v_user_email TEXT := 'euclideslione@gmail.com'; -- ⚠️ ALTERE AQUI!
    v_user_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Busca o ID do usuário no auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado. Crie o usuário no Supabase Auth primeiro!', v_user_email;
    END IF;
    
    -- Cria tenant padrão
    INSERT INTO public.tenants (name)
    VALUES ('Empresa Padrão')
    RETURNING id INTO v_tenant_id;
    
    -- Cria assinatura ativa no plano premium
    INSERT INTO public.subscriptions (tenant_id, plan_id, status, billing_cycle, current_period_starts_at, current_period_ends_at)
    SELECT 
        v_tenant_id,
        (SELECT id FROM public.plans WHERE name = 'premium'),
        'active'::subscription_status,
        'monthly'::billing_cycle,
        NOW(),
        NOW() + INTERVAL '30 days';
    
    -- Adiciona usuário à tabela public.users como admin
    INSERT INTO public.users (id, tenant_id, full_name, role)
    VALUES (
        v_user_id,
        v_tenant_id,
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = v_user_id),
        'admin'::user_role
    );
    
    -- Cria perfil em user_profiles como administrador
    INSERT INTO public.user_profiles (id, email, user_role, is_active)
    VALUES (v_user_id, v_user_email, 'administrador'::user_role_enum, true)
    ON CONFLICT (id) DO UPDATE 
    SET user_role = 'administrador'::user_role_enum, is_active = true;
    
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ USUÁRIO CONFIGURADO COM SUCESSO!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Email: %', v_user_email;
    RAISE NOTICE 'User ID: %', v_user_id;
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Role: admin / administrador';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMO PASSO:';
    RAISE NOTICE '   1. Faça LOGOUT do sistema';
    RAISE NOTICE '   2. Faça LOGIN novamente';
    RAISE NOTICE '   3. O sistema deve funcionar normalmente!';
    RAISE NOTICE '================================================================';
END $$;
