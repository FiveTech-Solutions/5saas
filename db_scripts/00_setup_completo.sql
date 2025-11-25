-- ================================================================
-- SCRIPT COMPLETO: Setup do Banco de Dados do Zero
-- ================================================================
-- Execute este script em um banco LIMPO para criar tudo
-- Versão: 3.0 - Completa e Testada
-- ================================================================

-- ================================================================
-- 1. EXTENSÕES
-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- 2. TIPOS ENUMERADOS (ENUMs)
-- ================================================================

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_name') THEN
        CREATE TYPE plan_name AS ENUM ('basic', 'standard', 'premium');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
        CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle') THEN
        CREATE TYPE billing_cycle AS ENUM ('monthly', 'semi_annually', 'annually');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'member');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('administrador', 'operador', 'auditor');
    END IF;
END $$;

-- ================================================================
-- 3. TABELAS
-- ================================================================

-- Tabela de Tenants
CREATE TABLE public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Planos
CREATE TABLE public.plans (
    id SERIAL PRIMARY KEY,
    name plan_name NOT NULL UNIQUE,
    description TEXT,
    features TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Assinaturas
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES public.plans(id),
    status subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle billing_cycle NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    current_period_starts_at TIMESTAMPTZ,
    current_period_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Usuários Multi-Tenant
CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Perfis de Usuário
CREATE TABLE public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_role user_role_enum NOT NULL DEFAULT 'operador',
    company_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Empresas
CREATE TABLE public.companies (
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
CREATE TABLE public.customers (
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

-- Tabela de NFS-e
CREATE TABLE public.nfses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    protocol VARCHAR(255),
    id_integracao VARCHAR(255),
    status VARCHAR(50) DEFAULT 'Em processamento',
    nfse_data JSONB,
    numero BIGINT,
    serie VARCHAR(10),
    valor_total DECIMAL(15, 2),
    data_emissao TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ================================================================
-- 4. ÍNDICES
-- ================================================================

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_companies_user_id ON public.companies(user_id);
CREATE INDEX idx_nfses_user_id ON public.nfses(user_id);
CREATE INDEX idx_nfses_tenant_id ON public.nfses(tenant_id);
CREATE INDEX idx_nfses_status ON public.nfses(status);
CREATE INDEX idx_nfses_created_at ON public.nfses(created_at DESC);

-- ================================================================
-- 5. FUNÇÕES
-- ================================================================

-- Função para obter tenant_id do usuário logado
-- NOTA: Movida para public porque não temos permissão no schema auth
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
    RETURN json_build_object('success', true, 'action', p_action, 'timestamp', NOW());
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

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
        RETURN json_build_object('error', 'Usuário não autenticado', 'authenticated', false);
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
        SELECT target_user_id, email, 'operador'::user_role_enum
        FROM auth.users WHERE id = target_user_id
        ON CONFLICT (id) DO NOTHING;
        
        SELECT json_build_object(
            'id', up.id, 'email', up.email, 'full_name', COALESCE(up.full_name, ''),
            'user_role', up.user_role, 'company_id', up.company_id,
            'is_active', up.is_active, 'created_at', up.created_at
        ) INTO user_data
        FROM public.user_profiles up WHERE up.id = target_user_id;
    END IF;
    
    RETURN user_data;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM, 'authenticated', auth.uid() IS NOT NULL);
END;
$$;

-- ================================================================
-- 6. TRIGGERS
-- ================================================================

CREATE TRIGGER set_timestamp BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_users BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_subscriptions BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_nfses BEFORE UPDATE ON public.nfses FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_companies BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();
CREATE TRIGGER set_timestamp_customers BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ================================================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can manage own user profile" ON public.users FOR ALL USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Users can view same tenant users" ON public.users FOR SELECT USING (tenant_id = public.current_tenant_id());

-- Políticas para user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Allow admins to read all user profiles" ON public.user_profiles FOR SELECT TO authenticated 
    USING ((SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'administrador');

-- Políticas para nfses
CREATE POLICY "Users can view own nfses" ON public.nfses FOR SELECT 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can insert own nfses" ON public.nfses FOR INSERT 
    WITH CHECK (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can update own nfses" ON public.nfses FOR UPDATE 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id())
    WITH CHECK (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can delete own nfses" ON public.nfses FOR DELETE 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id());

-- Políticas para customers
CREATE POLICY "Users can view own customers" ON public.customers FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own customers" ON public.customers FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own customers" ON public.customers FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own customers" ON public.customers FOR DELETE USING (user_id = auth.uid());

-- Políticas para companies
CREATE POLICY "Users can view own company" ON public.companies FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own company" ON public.companies FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own company" ON public.companies FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own company" ON public.companies FOR DELETE USING (user_id = auth.uid());

-- ================================================================
-- 8. VIEWS
-- ================================================================

CREATE OR REPLACE VIEW public.users_view AS
SELECT
    u.id,
    COALESCE(up.email, u.email) AS email,
    up.full_name,
    COALESCE(up.user_role, 'operador') AS role,
    up.company_id,
    COALESCE(up.is_active, true) AS active,
    u.created_at
FROM auth.users u
LEFT JOIN public.user_profiles up ON u.id = up.id;

GRANT SELECT ON public.users_view TO authenticated;

-- ================================================================
-- 9. DADOS INICIAIS
-- ================================================================

-- Inserir planos
INSERT INTO public.plans (name, description, features) VALUES
    ('basic', 'Acesso essencial para emissão de NFS-e.', '{"NFSE"}'),
    ('standard', 'Pacote completo para notas fiscais de serviço, produto e consumidor.', '{"NFSE", "NFE", "NFCE"}'),
    ('premium', 'Todos os recursos fiscais mais ferramentas de IA para otimização.', '{"NFSE", "NFE", "NFCE", "AI_TOOLS"}');

-- ================================================================
-- 10. PERMISSÕES
-- ================================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ================================================================
-- MENSAGEM FINAL
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ BANCO DE DADOS CRIADO COM SUCESSO!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '📋 8 tabelas criadas';
    RAISE NOTICE '🔧 4 funções criadas';
    RAISE NOTICE '🔐 RLS habilitado com políticas';
    RAISE NOTICE '📦 3 planos cadastrados';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMO PASSO:';
    RAISE NOTICE '   Execute: 01_setup_usuario.sql';
    RAISE NOTICE '   (Altere o email antes de executar!)';
    RAISE NOTICE '================================================================';
END $$;
