-- ================================================================
-- SCRIPT: Limpar Banco de Dados Completamente
-- ================================================================
-- ⚠️ ATENÇÃO: Este script APAGA TODOS OS DADOS!
-- Execute apenas se tiver certeza que quer começar do zero
-- ================================================================

-- Desabilitar RLS primeiro
ALTER TABLE IF EXISTS public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.nfses DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies DISABLE ROW LEVEL SECURITY;

-- Dropar políticas RLS
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT schemaname, tablename, policyname 
              FROM pg_policies 
              WHERE schemaname = 'public') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Dropar views
DROP VIEW IF EXISTS public.users_view CASCADE;

-- Dropar triggers
DROP TRIGGER IF EXISTS set_timestamp ON public.tenants;
DROP TRIGGER IF EXISTS set_timestamp_users ON public.users;
DROP TRIGGER IF EXISTS set_timestamp_subscriptions ON public.subscriptions;
DROP TRIGGER IF EXISTS set_timestamp_nfses ON public.nfses;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS set_timestamp_companies ON public.companies;
DROP TRIGGER IF EXISTS set_timestamp_customers ON public.customers;

-- Dropar tabelas (em ordem reversa de dependência)
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;
DROP TABLE IF EXISTS public.nfses CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.plans CASCADE;
DROP TABLE IF EXISTS public.tenants CASCADE;

-- Dropar funções
DROP FUNCTION IF EXISTS auth.current_tenant_id();
DROP FUNCTION IF EXISTS public.trigger_set_timestamp();
DROP FUNCTION IF EXISTS public.update_updated_at_column();
DROP FUNCTION IF EXISTS public.log_user_action(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_user_profile(UUID);

-- Dropar tipos (ENUMs)
DROP TYPE IF EXISTS plan_name CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS billing_cycle CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS user_role_enum CASCADE;

SELECT '✅ Banco de dados limpo com sucesso!' AS status;
SELECT '🚀 Agora execute: 00_setup_completo.sql' AS proximo_passo;
