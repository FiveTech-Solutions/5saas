-- Script para atualizar usuário para administrador
-- Substitua o email pelo seu email real

UPDATE public.user_profiles 
SET user_role = 'administrador'::user_role_enum 
WHERE email = 'euclideslione@gmail.com';

-- Verificar a alteração
SELECT id, email, user_role, full_name, is_active, created_at 
FROM public.user_profiles 
WHERE email = 'euclideslione@gmail.com';

-- Mostrar resultado
DO $$
DECLARE
    current_role user_role_enum;
BEGIN
    SELECT user_role INTO current_role 
    FROM public.user_profiles 
    WHERE email = 'euclideslione@gmail.com';
    
    RAISE NOTICE '✅ Usuário euclideslione@gmail.com agora é: %', current_role;
END $$;