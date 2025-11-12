-- Configuração mínima do banco de dados para autenticação
-- Script: db_minimal_setup.sql

-- 1. Criar enum para tipos de usuário
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('administrador', 'operador', 'auditor');
    END IF;
END $$;

-- 2. Criar tabela de perfis de usuário
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_role user_role_enum NOT NULL DEFAULT 'operador',
    company_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS na tabela
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas básicas de RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" 
ON public.user_profiles FOR SELECT 
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
CREATE POLICY "Users can update own profile" 
ON public.user_profiles FOR UPDATE 
USING (auth.uid() = id);

-- 5. Criar função básica de log (substituir a complexa)
CREATE OR REPLACE FUNCTION public.log_user_action(
    p_action TEXT DEFAULT '',
    p_details TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Função simplificada que apenas retorna sucesso
    -- Para desenvolvimento, apenas logamos no console do PostgreSQL
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

-- 6. Criar função para buscar perfil do usuário
CREATE OR REPLACE FUNCTION public.get_user_profile(user_uuid UUID DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_data JSON;
    target_user_id UUID;
BEGIN
    -- Determina qual usuário buscar (parâmetro ou usuário atual)
    target_user_id := COALESCE(user_uuid, auth.uid());
    
    -- Verifica se o usuário está autenticado
    IF auth.uid() IS NULL THEN
        RETURN json_build_object(
            'error', 'Usuário não autenticado',
            'authenticated', false
        );
    END IF;
    
    -- Busca ou cria o perfil do usuário
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
    
    -- Se não existe perfil, criar um básico (apenas para o próprio usuário)
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles WHERE id = target_user_id) AND target_user_id = auth.uid() THEN
        INSERT INTO public.user_profiles (id, email, user_role)
        SELECT 
            target_user_id,
            email,
            'operador'::user_role_enum
        FROM auth.users 
        WHERE id = target_user_id
        ON CONFLICT (id) DO NOTHING;
        
        -- Busca novamente após criar
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

-- 7. Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();

-- 8. Mostrar status final
DO $$
BEGIN
    RAISE NOTICE '✅ Configuração mínima concluída!';
    RAISE NOTICE '📋 Tabelas criadas: user_profiles';
    RAISE NOTICE '🔧 Funções criadas: log_user_action, get_user_profile';
    RAISE NOTICE '🔐 RLS habilitado com políticas básicas';
    RAISE NOTICE '🚀 Sistema pronto para uso!';
END $$;