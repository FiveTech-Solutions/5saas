-- ================================================================
-- SCRIPT FINAL: Completar Setup do Banco de Dados
-- ================================================================
-- Este script completa o setup baseado no estado atual do seu banco
-- Execute este script para finalizar a configuração
-- ================================================================

-- ================================================================
-- 1. CRIAR TABELAS FALTANTES
-- ================================================================

-- Tabela de Empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_municipal VARCHAR(50),
    inscricao_estadual VARCHAR(50),
    regime_tributario VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(8),
    telefone VARCHAR(20),
    email VARCHAR(255),
    certificado_id VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_company UNIQUE (user_id)
);

-- Tabela de Clientes/Tomadores
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_municipal VARCHAR(50),
    inscricao_estadual VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(8),
    codigo_municipio VARCHAR(7),
    telefone VARCHAR(20),
    email VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 2. ADICIONAR COLUNAS FALTANTES (se necessário)
-- ================================================================

-- Adicionar user_id na tabela nfses (se não existir)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'nfses' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.nfses ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
        
        -- Atualizar user_id baseado no tenant_id (pega o primeiro admin do tenant)
        UPDATE public.nfses n
        SET user_id = (
            SELECT u.id 
            FROM public.users u 
            WHERE u.tenant_id = n.tenant_id 
            AND u.role = 'admin'
            LIMIT 1
        );
    END IF;
END $$;

-- ================================================================
-- 3. CRIAR ÍNDICES
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_nfses_user_id ON public.nfses(user_id);
CREATE INDEX IF NOT EXISTS idx_nfses_tenant_id ON public.nfses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nfses_status ON public.nfses(status);
CREATE INDEX IF NOT EXISTS idx_nfses_created_at ON public.nfses(created_at DESC);

-- ================================================================
-- 4. HABILITAR RLS NAS NOVAS TABELAS
-- ================================================================

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- ================================================================
-- 5. CRIAR POLÍTICAS RLS PARA AS NOVAS TABELAS
-- ================================================================

-- Políticas para customers
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

-- Políticas para companies
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

-- ================================================================
-- 6. POPULAR USER_PROFILES COM SEU USUÁRIO
-- ================================================================

-- IMPORTANTE: Altere o email abaixo para o seu!
DO $$
DECLARE
    v_user_email TEXT := 'euclideslione@gmail.com'; -- ALTERE AQUI!
BEGIN
    -- Insere ou atualiza o perfil do usuário
    INSERT INTO public.user_profiles (id, email, user_role, is_active)
    SELECT 
        id,
        email,
        'administrador'::user_role_enum,
        true
    FROM auth.users
    WHERE email = v_user_email
    ON CONFLICT (id) DO UPDATE 
    SET 
        user_role = 'administrador'::user_role_enum,
        is_active = true;
    
    RAISE NOTICE '✅ Perfil do usuário % atualizado em user_profiles', v_user_email;
END $$;

-- ================================================================
-- 7. INSERIR PLANOS (se ainda não existirem)
-- ================================================================

INSERT INTO public.plans (name, description, features) VALUES
    ('basic', 'Acesso essencial para emissão de NFS-e.', '{"NFSE"}'),
    ('standard', 'Pacote completo para notas fiscais de serviço, produto e consumidor.', '{"NFSE", "NFE", "NFCE"}'),
    ('premium', 'Todos os recursos fiscais mais ferramentas de IA para otimização.', '{"NFSE", "NFE", "NFCE", "AI_TOOLS"}')
ON CONFLICT (name) DO NOTHING;

-- ================================================================
-- 8. VERIFICAÇÃO FINAL
-- ================================================================

DO $$
DECLARE
    v_tables_count INT;
    v_user_count INT;
    v_tenant_count INT;
    v_subscription_count INT;
    v_plans_count INT;
BEGIN
    -- Conta tabelas
    SELECT COUNT(*) INTO v_tables_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('tenants', 'plans', 'subscriptions', 'users', 'user_profiles', 'companies', 'customers', 'nfses');
    
    -- Conta registros
    SELECT COUNT(*) INTO v_user_count FROM public.users;
    SELECT COUNT(*) INTO v_tenant_count FROM public.tenants;
    SELECT COUNT(*) INTO v_subscription_count FROM public.subscriptions WHERE status = 'active';
    SELECT COUNT(*) INTO v_plans_count FROM public.plans;
    
    RAISE NOTICE '';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ SETUP COMPLETO!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'Tabelas criadas: % de 8', v_tables_count;
    RAISE NOTICE 'Usuários cadastrados: %', v_user_count;
    RAISE NOTICE 'Tenants criados: %', v_tenant_count;
    RAISE NOTICE 'Assinaturas ativas: %', v_subscription_count;
    RAISE NOTICE 'Planos disponíveis: %', v_plans_count;
    RAISE NOTICE '';
    
    IF v_tables_count = 8 AND v_user_count > 0 AND v_tenant_count > 0 AND v_subscription_count > 0 THEN
        RAISE NOTICE '🎉 BANCO DE DADOS TOTALMENTE CONFIGURADO!';
        RAISE NOTICE '🚀 Faça logout e login novamente no sistema.';
    ELSE
        IF v_user_count = 0 THEN
            RAISE WARNING '⚠️  Execute o script fix_user_setup.sql para criar seu usuário!';
        END IF;
        IF v_tenant_count = 0 THEN
            RAISE WARNING '⚠️  Execute o script fix_user_setup.sql para criar um tenant!';
        END IF;
        IF v_subscription_count = 0 THEN
            RAISE WARNING '⚠️  Execute o script fix_user_setup.sql para criar uma assinatura!';
        END IF;
    END IF;
    
    RAISE NOTICE '================================================================';
END $$;
