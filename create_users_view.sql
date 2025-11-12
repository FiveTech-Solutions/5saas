-- Arquivo: create_users_view.sql
-- Descrição: Cria a view `users_view` para listar usuários combinando dados de `auth.users` e `public.user_profiles`.
-- Versão 2: Adiciona COALESCE para garantir que dados essenciais não sejam nulos.

CREATE OR REPLACE VIEW public.users_view AS
SELECT
    u.id,
    COALESCE(up.email, u.email) AS email, -- Garante que o email nunca seja nulo
    up.full_name,
    COALESCE(up.user_role, 'operador') AS role, -- Fornece 'operador' como perfil padrão
    up.company_id,
    COALESCE(up.is_active, true) AS active, -- Assume 'true' como status padrão
    u.created_at
FROM
    auth.users u
LEFT JOIN
    public.user_profiles up ON u.id = up.id;

-- Conceder permissões para que o perfil `authenticated` possa ler esta view
-- A segurança em nível de linha (RLS) na tabela `user_profiles` ainda será aplicada se referenciada.
-- No entanto, para uma view de admin, é comum ter uma política que permita ao admin ver todos os usuários.

-- Política para permitir que administradores leiam todos os perfis
DROP POLICY IF EXISTS "Allow admins to read all user profiles" ON public.user_profiles;
CREATE POLICY "Allow admins to read all user profiles"
ON public.user_profiles
FOR SELECT
TO authenticated
USING (
  (SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'administrador'
);

-- Garantir que a política de "ver o próprio perfil" continue funcionando para não-admins
-- A política existente "Users can view own profile" já faz isso.

-- Conceder permissão de SELECT na view para o role `authenticated`
GRANT SELECT ON public.users_view TO authenticated;

-- Mensagem de sucesso
DO $$
BEGIN
    RAISE NOTICE '✅ View `users_view` (v2) criada e permissões concedidas com sucesso!';
END $$;
