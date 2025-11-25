-- ================================================================
-- SCRIPT DE CORREÇÃO: Criar Tenant e Usuário Inicial
-- Execute este script APÓS criar um usuário no Supabase Auth
-- ================================================================

-- Este script resolve o erro "Failed to load resource: 404 (get_user_profile)"
-- criando as estruturas necessárias para o sistema multi-tenant funcionar.

-- ================================================================
-- PASSO 1: Criar um Tenant (Empresa) Padrão
-- ================================================================

-- Insere um tenant padrão se não existir
INSERT INTO public.tenants (name)
VALUES ('Empresa Padrão')
ON CONFLICT DO NOTHING
RETURNING id;

-- Se você quiser usar um tenant específico, substitua o INSERT acima por:
-- INSERT INTO public.tenants (id, name)
-- VALUES ('SEU-UUID-AQUI', 'Nome da Sua Empresa')
-- ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name
-- RETURNING id;

-- ================================================================
-- PASSO 2: Criar Assinatura para o Tenant
-- ================================================================

-- Cria uma assinatura ativa no plano premium para o tenant
INSERT INTO public.subscriptions (
    tenant_id,
    plan_id,
    status,
    billing_cycle,
    current_period_starts_at,
    current_period_ends_at
)
SELECT 
    t.id,
    (SELECT id FROM public.plans WHERE name = 'premium'),
    'active'::subscription_status,
    'monthly'::billing_cycle,
    NOW(),
    NOW() + INTERVAL '30 days'
FROM public.tenants t
WHERE t.name = 'Empresa Padrão'
ON CONFLICT (tenant_id) DO UPDATE 
SET status = 'active'::subscription_status
RETURNING id;

-- ================================================================
-- PASSO 3: Criar Registro do Usuário na Tabela public.users
-- ================================================================

-- IMPORTANTE: Substitua 'seu_email@exemplo.com' pelo email do seu usuário
DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_user_email TEXT := 'euclideslione@gmail.com'; -- ALTERE AQUI!
BEGIN
    -- Busca o ID do usuário no auth.users
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_user_email;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Usuário com email % não encontrado em auth.users. Crie o usuário primeiro no Supabase Auth.', v_user_email;
    END IF;
    
    -- Busca o ID do tenant padrão
    SELECT id INTO v_tenant_id
    FROM public.tenants
    WHERE name = 'Empresa Padrão';
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Tenant padrão não encontrado. Execute o PASSO 1 primeiro.';
    END IF;
    
    -- Cria o registro na tabela public.users
    INSERT INTO public.users (id, tenant_id, full_name, role)
    VALUES (
        v_user_id,
        v_tenant_id,
        (SELECT COALESCE(raw_user_meta_data->>'full_name', email) FROM auth.users WHERE id = v_user_id),
        'admin'::user_role
    )
    ON CONFLICT (id) DO UPDATE 
    SET 
        tenant_id = EXCLUDED.tenant_id,
        role = 'admin'::user_role;
    
    RAISE NOTICE '✅ Usuário % criado/atualizado na tabela public.users', v_user_email;
    RAISE NOTICE '✅ Tenant ID: %', v_tenant_id;
    RAISE NOTICE '✅ User ID: %', v_user_id;
END $$;

-- ================================================================
-- PASSO 4: Criar/Atualizar Perfil do Usuário
-- ================================================================

-- NOTA: Esta seção está comentada porque a tabela user_profiles não existe
-- Se você criou a tabela user_profiles, descomente o código abaixo:

/*
INSERT INTO public.user_profiles (id, email, user_role, is_active)
SELECT 
    id,
    email,
    'administrador'::user_role_enum,
    true
FROM auth.users
WHERE email = 'euclideslione@gmail.com' -- ALTERE AQUI!
ON CONFLICT (id) DO UPDATE 
SET 
    user_role = 'administrador'::user_role_enum,
    is_active = true;
*/

-- ================================================================
-- VERIFICAÇÃO FINAL
-- ================================================================

-- Verifica se tudo foi criado corretamente
DO $$
DECLARE
    v_user_email TEXT := 'euclideslione@gmail.com'; -- ALTERE AQUI!
    v_user_count INT;
    v_tenant_count INT;
    v_subscription_count INT;
BEGIN
    -- Verifica usuário em public.users
    SELECT COUNT(*) INTO v_user_count
    FROM public.users u
    JOIN auth.users au ON au.id = u.id
    WHERE au.email = v_user_email;
    
    -- Verifica tenant
    SELECT COUNT(*) INTO v_tenant_count
    FROM public.tenants;
    
    -- Verifica assinatura
    SELECT COUNT(*) INTO v_subscription_count
    FROM public.subscriptions
    WHERE status = 'active';
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ VERIFICAÇÃO FINAL';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Usuários em public.users: %', v_user_count;
    RAISE NOTICE 'Tenants criados: %', v_tenant_count;
    RAISE NOTICE 'Assinaturas ativas: %', v_subscription_count;
    
    IF v_user_count = 0 THEN
        RAISE WARNING '⚠️  Nenhum usuário encontrado em public.users!';
    END IF;
    
    IF v_tenant_count = 0 THEN
        RAISE WARNING '⚠️  Nenhum tenant encontrado!';
    END IF;
    
    IF v_subscription_count = 0 THEN
        RAISE WARNING '⚠️  Nenhuma assinatura ativa encontrada!';
    END IF;
    
    IF v_user_count > 0 AND v_tenant_count > 0 AND v_subscription_count > 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 TUDO CONFIGURADO CORRETAMENTE!';
        RAISE NOTICE '🚀 Você já pode fazer login no sistema.';
    END IF;
    
    RAISE NOTICE '================================================================';
END $$;

-- ================================================================
-- CONSULTA PARA VERIFICAR OS DADOS
-- ================================================================

-- Descomente para ver os dados criados:
/*
SELECT 
    'Usuário' as tipo,
    u.id,
    u.full_name as info1,
    u.role::text as info2,
    u.tenant_id
FROM public.users u
JOIN auth.users au ON au.id = u.id
WHERE au.email = 'euclideslione@gmail.com'

UNION ALL

SELECT 
    'Tenant' as tipo,
    t.id,
    t.name,
    NULL,
    NULL
FROM public.tenants t

UNION ALL

SELECT 
    'Assinatura' as tipo,
    s.id,
    s.status::text,
    p.name::text,
    s.tenant_id
FROM public.subscriptions s
JOIN public.plans p ON p.id = s.plan_id;
*/
