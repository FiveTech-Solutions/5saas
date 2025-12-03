-- ================================================================
-- SCRIPT DE CORREÇÃO: Recursão Infinita em Políticas RLS
-- ================================================================
-- O erro "infinite recursion detected in policy for relation user_profiles"
-- ocorre porque a política de segurança tenta ler a própria tabela para verificar
-- se o usuário é administrador, criando um loop infinito.
-- SOLUÇÃO: Criar uma função SECURITY DEFINER para verificar o papel do usuário.
-- Funções SECURITY DEFINER rodam com permissões de superusuário e ignoram o RLS,
-- quebrando o ciclo de recursão.
-- 1. Criar função para verificar se é admin (bypassing RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND user_role = 'administrador'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- 2. Recriar a política problemática usando a nova função
-- Primeiro, remover a política antiga (se existir)
DROP POLICY IF EXISTS "Allow admins to read all user profiles" ON public.user_profiles;
-- Criar a nova política usando a função segura
CREATE POLICY "Allow admins to read all user profiles" 
ON public.user_profiles 
FOR SELECT 
TO authenticated 
USING (public.is_admin());
-- 3. Verificar e corrigir política da tabela users também (caso use current_tenant_id recursivo)
-- Função auxiliar para pegar tenant atual sem recursão
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS UUID AS $$
DECLARE
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM public.users
  WHERE id = auth.uid();
  
  RETURN v_tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Se houver política recursiva em users, ela também deve ser corrigida.
-- Por precaução, vamos garantir que a leitura do próprio usuário seja sempre permitida diretamente.
DROP POLICY IF EXISTS "Users can view same tenant users" ON public.users;
CREATE POLICY "Users can view same tenant users" 
ON public.users 
FOR SELECT 
USING (
  tenant_id = public.get_current_tenant_id() 
  OR id = auth.uid() -- Sempre permitir ver a si mesmo
);