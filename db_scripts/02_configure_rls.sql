-- ================================================================
-- SCRIPT: Configurar Row Level Security (RLS)
-- ================================================================
-- Execute APÓS criar as funções (01_create_functions.sql)
-- Configura políticas de segurança para todas as tabelas
-- ================================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- Políticas para public.users
-- ================================================================
DROP POLICY IF EXISTS "Users can manage own user profile" ON public.users;
CREATE POLICY "Users can manage own user profile"
    ON public.users FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Users can view same tenant users" ON public.users;
CREATE POLICY "Users can view same tenant users"
    ON public.users FOR SELECT
    USING (tenant_id = auth.current_tenant_id());

-- ================================================================
-- Políticas para public.user_profiles
-- ================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
    ON public.user_profiles FOR SELECT 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
CREATE POLICY "Users can insert own profile" 
    ON public.user_profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
    ON public.user_profiles FOR UPDATE 
    USING (auth.uid() = id);

DROP POLICY IF EXISTS "Allow admins to read all user profiles" ON public.user_profiles;
CREATE POLICY "Allow admins to read all user profiles"
    ON public.user_profiles
    FOR SELECT
    TO authenticated
    USING (
        (SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'administrador'
    );

-- ================================================================
-- Políticas para public.nfses
-- ================================================================
DROP POLICY IF EXISTS "Users can view own nfses" ON public.nfses;
CREATE POLICY "Users can view own nfses"
    ON public.nfses FOR SELECT
    USING (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR 
        (tenant_id IS NOT NULL AND tenant_id = auth.current_tenant_id())
    );

DROP POLICY IF EXISTS "Users can insert own nfses" ON public.nfses;
CREATE POLICY "Users can insert own nfses"
    ON public.nfses FOR INSERT
    WITH CHECK (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR 
        (tenant_id IS NOT NULL AND tenant_id = auth.current_tenant_id())
    );

DROP POLICY IF EXISTS "Users can update own nfses" ON public.nfses;
CREATE POLICY "Users can update own nfses"
    ON public.nfses FOR UPDATE
    USING (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR 
        (tenant_id IS NOT NULL AND tenant_id = auth.current_tenant_id())
    )
    WITH CHECK (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR 
        (tenant_id IS NOT NULL AND tenant_id = auth.current_tenant_id())
    );

DROP POLICY IF EXISTS "Users can delete own nfses" ON public.nfses;
CREATE POLICY "Users can delete own nfses"
    ON public.nfses FOR DELETE
    USING (
        (user_id IS NOT NULL AND user_id = auth.uid()) OR 
        (tenant_id IS NOT NULL AND tenant_id = auth.current_tenant_id())
    );

-- ================================================================
-- Políticas para public.customers
-- ================================================================
DROP POLICY IF EXISTS "Users can view own customers" ON public.customers;
CREATE POLICY "Users can view own customers"
    ON public.customers FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own customers" ON public.customers;
CREATE POLICY "Users can insert own customers"
    ON public.customers FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own customers" ON public.customers;
CREATE POLICY "Users can update own customers"
    ON public.customers FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own customers" ON public.customers;
CREATE POLICY "Users can delete own customers"
    ON public.customers FOR DELETE
    USING (user_id = auth.uid());

-- ================================================================
-- Políticas para public.companies
-- ================================================================
DROP POLICY IF EXISTS "Users can view own company" ON public.companies;
CREATE POLICY "Users can view own company"
    ON public.companies FOR SELECT
    USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can insert own company" ON public.companies;
CREATE POLICY "Users can insert own company"
    ON public.companies FOR INSERT
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own company" ON public.companies;
CREATE POLICY "Users can update own company"
    ON public.companies FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can delete own company" ON public.companies;
CREATE POLICY "Users can delete own company"
    ON public.companies FOR DELETE
    USING (user_id = auth.uid());

SELECT '✅ RLS configurado com sucesso!' AS status;
