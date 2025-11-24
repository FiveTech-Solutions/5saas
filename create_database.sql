-- ----------------------------------------------------------------
-- Script de Criação do Banco de Dados para Sistema SaaS Multi-Tenant
-- Versão: 1.0
-- Descrição:
-- - Cria a estrutura para múltiplos tenants (clientes).
-- - Gerencia planos, assinaturas e ciclos de pagamento.
-- - Isola os dados dos tenants usando Row-Level Security (RLS).
-- ----------------------------------------------------------------

-- Habilita a extensão para gerar UUIDs, caso ainda não esteja habilitada.
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------
-- 1. Definição de Tipos (ENUMs) para consistência de dados.
-- ----------------------------------------------------------------

CREATE TYPE plan_name AS ENUM ('basic', 'standard', 'premium');
CREATE TYPE subscription_status AS ENUM ('active', 'past_due', 'canceled', 'trialing');
CREATE TYPE billing_cycle AS ENUM ('monthly', 'semi_annually', 'annually');
CREATE TYPE user_role AS ENUM ('admin', 'member');

-- ----------------------------------------------------------------
-- 2. Tabelas de Governança e Autenticação
-- ----------------------------------------------------------------

-- Tabela de Tenants (Clientes/Empresas que contratam o sistema)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    -- Outros detalhes do tenant, como CNPJ, endereço, etc.
    -- cnpj VARCHAR(14) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE tenants IS 'Cada registro é um cliente (empresa) que contratou o SaaS.';

-- Tabela de Usuários
-- Esta tabela será gerenciada pelo sistema de autenticação do Supabase,
-- mas a referenciamos aqui para criar a relação com tenants.
-- O Supabase Auth já tem uma tabela `auth.users`. Vamos criar uma tabela `public.users`
-- para armazenar o perfil e a relação com o tenant.
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    role user_role NOT NULL DEFAULT 'member',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE users IS 'Perfil dos usuários, associando um usuário de autenticação a um tenant e uma role.';

-- Tabela de Planos
CREATE TABLE plans (
    id SERIAL PRIMARY KEY,
    name plan_name NOT NULL UNIQUE,
    description TEXT,
    -- Armazena os recursos como um array de texto para fácil verificação no backend.
    -- Ex: '{"NFSE", "NFE", "NFC"}'
    features TEXT[] NOT NULL,
    -- Campos para preços podem ser adicionados aqui ou em outra tabela
    -- monthly_price_id VARCHAR(255), -- ID do preço no Stripe/Gateway
    -- annually_price_id VARCHAR(255)
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE plans IS 'Define os planos disponíveis no sistema (Basic, Standard, Premium).';

-- Tabela de Assinaturas (Subscriptions)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL UNIQUE REFERENCES tenants(id) ON DELETE CASCADE,
    plan_id INTEGER NOT NULL REFERENCES plans(id),
    status subscription_status NOT NULL DEFAULT 'trialing',
    billing_cycle billing_cycle NOT NULL,
    trial_ends_at TIMESTAMPTZ,
    current_period_starts_at TIMESTAMPTZ,
    current_period_ends_at TIMESTAMPTZ,
    canceled_at TIMESTAMPTZ,
    -- ID da assinatura no gateway de pagamento (ex: Stripe)
    -- gateway_subscription_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE subscriptions IS 'Gerencia a assinatura de cada tenant a um plano.';

-- ----------------------------------------------------------------
-- 3. Populando os Planos
-- ----------------------------------------------------------------

INSERT INTO plans (name, description, features) VALUES
('basic', 'Acesso essencial para emissão de NFS-e.', '{"NFSE"}'),
('standard', 'Pacote completo para notas fiscais de serviço, produto e consumidor.', '{"NFSE", "NFE", "NFCE"}'),
('premium', 'Todos os recursos fiscais mais ferramentas de IA para otimização.', '{"NFSE", "NFE", "NFCE", "AI_TOOLS"}');

-- ----------------------------------------------------------------
-- 4. Tabelas de Dados do Negócio (Exemplo com NFS-e)
--    **TODA NOVA TABELA COM DADOS DE TENANT DEVE SEGUIR ESTE PADRÃO**
-- ----------------------------------------------------------------

CREATE TABLE nfses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- Dados da nota fiscal
    numero BIGINT,
    status VARCHAR(50),
    valor_total DECIMAL(15, 2),
    -- ... outros campos da NFSe
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE nfses IS 'Exemplo de tabela de dados. Note a coluna `tenant_id` que é essencial.';
-- Cria um índice na coluna tenant_id para otimizar as consultas.
CREATE INDEX ON nfses (tenant_id);


-- ----------------------------------------------------------------
-- 5. Configuração da Segurança (Row-Level Security - RLS)
-- ----------------------------------------------------------------

-- Função auxiliar para obter o tenant_id do usuário logado a partir do JWT.
-- O Supabase/PostgREST preenche `request.jwt.claims` automaticamente.
CREATE OR REPLACE FUNCTION auth.current_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT tenant_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Habilitar RLS em todas as tabelas que contêm dados de tenants.
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE nfses ENABLE ROW LEVEL SECURITY;
-- FAÇA ISSO PARA TODAS AS OUTRAS TABELAS: customers, company_settings, etc.
-- ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Política para a tabela `users`:
-- Admins do tenant podem ver todos os usuários do seu tenant.
-- Membros só podem ver/editar seu próprio perfil.
CREATE POLICY "Allow admin to manage tenant users"
    ON users FOR ALL
    USING (tenant_id = auth.current_tenant_id() AND (SELECT role FROM users WHERE id = auth.uid()) = 'admin')
    WITH CHECK (tenant_id = auth.current_tenant_id());

CREATE POLICY "Allow member to view/update own profile"
    ON users FOR ALL
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

-- Política para a tabela `nfses`:
-- Um usuário só pode interagir com as NFS-e do seu próprio tenant.
CREATE POLICY "Allow full access to own tenant data"
    ON nfses FOR ALL
    USING (tenant_id = auth.current_tenant_id())
    WITH CHECK (tenant_id = auth.current_tenant_id());

-- Repita a política acima para todas as outras tabelas de dados.
-- CREATE POLICY "Allow full access to own tenant data" ON customers FOR ALL ...;


-- ----------------------------------------------------------------
-- 6. Gatilho para manter `updated_at` atualizado
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar o gatilho nas tabelas
CREATE TRIGGER set_timestamp BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
CREATE TRIGGER set_timestamp BEFORE UPDATE ON nfses FOR EACH ROW EXECUTE PROCEDURE trigger_set_timestamp();
-- ... e em outras tabelas que necessitem.

-- ----------------------------------------------------------------
-- Fim do Script
-- ----------------------------------------------------------------
