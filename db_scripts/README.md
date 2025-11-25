# 🗄️ Scripts do Banco de Dados - 5SAAS

Scripts SQL para configurar o banco de dados do zero de forma limpa e organizada.

## 🚀 Setup do Zero (Recomendado)

Execute os scripts **NA ORDEM**:

### 1️⃣ `00_limpar_banco.sql`
**Quando:** Se você já tem um banco com dados antigos

⚠️ **ATENÇÃO:** Apaga TODOS os dados! Execute apenas se tiver certeza.

**O que faz:**
- Remove todas as tabelas
- Remove todas as funções
- Remove todas as políticas RLS
- Remove todos os tipos (ENUMs)
- Deixa o banco completamente limpo

---

### 2️⃣ `00_setup_completo.sql`
**Quando:** Banco limpo ou novo

✅ **Este é o script principal!** Cria tudo do zero.

**O que faz:**
- ✅ Cria 8 tabelas (tenants, plans, subscriptions, users, user_profiles, companies, customers, nfses)
- ✅ Cria 4 funções essenciais (incluindo `auth.current_tenant_id()`)
- ✅ Configura triggers para `updated_at`
- ✅ Habilita RLS com todas as políticas
- ✅ Cria view `users_view`
- ✅ Insere 3 planos (basic, standard, premium)
- ✅ Configura permissões

**Tempo:** ~5 segundos

---

### 3️⃣ `01_setup_usuario.sql`
**Quando:** Após executar `00_setup_completo.sql`

⚠️ **IMPORTANTE:** Altere o email `euclideslione@gmail.com` para o seu antes de executar!

**O que faz:**
- Cria tenant "Empresa Padrão"
- Cria assinatura ativa no plano premium
- Vincula seu usuário ao tenant
- Define você como administrador

**Tempo:** ~1 segundo

---

## 📋 Checklist de Execução

- [ ] 1. Criar usuário no Supabase Auth (se ainda não tiver)
- [ ] 2. Executar `00_limpar_banco.sql` (se tiver dados antigos)
- [ ] 3. Executar `00_setup_completo.sql`
- [ ] 4. **Alterar email** em `01_setup_usuario.sql`
- [ ] 5. Executar `01_setup_usuario.sql`
- [ ] 6. Fazer LOGOUT do sistema
- [ ] 7. Fazer LOGIN novamente
- [ ] 8. ✅ Sistema funcionando!

---

## 📁 Outros Scripts (Opcionais)

### `01_create_functions.sql`
Cria apenas as funções (já incluído no `00_setup_completo.sql`)

### `02_configure_rls.sql`
Configura apenas RLS (já incluído no `00_setup_completo.sql`)

### `complete_setup_final.sql`
Script antigo - use `00_setup_completo.sql` no lugar

### `fix_user_setup.sql`
Script antigo - use `01_setup_usuario.sql` no lugar

---

## ✅ Verificação

Após executar tudo, verifique:

```sql
-- Deve retornar 8
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tenants', 'plans', 'subscriptions', 'users', 'user_profiles', 'companies', 'customers', 'nfses');

-- Deve retornar 3
SELECT COUNT(*) FROM public.plans;

-- Deve retornar 1
SELECT COUNT(*) FROM public.tenants;

-- Deve retornar 1
SELECT COUNT(*) FROM public.users;
```

---

## 🆘 Problemas Comuns

### Erro: "function auth.current_tenant_id() does not exist"
**Solução:** Execute `00_setup_completo.sql` novamente (ele cria a função)

### Erro: "column user_id does not exist"
**Solução:** Você pulou o `00_setup_completo.sql`. Execute-o primeiro.

### Erro 404 ao fazer login
**Solução:** 
1. Verifique se executou `01_setup_usuario.sql`
2. Verifique se alterou o email no script
3. Faça logout e login novamente

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. ✅ Executou os scripts na ordem correta?
2. ✅ Alterou o email em `01_setup_usuario.sql`?
3. ✅ Criou o usuário no Supabase Auth primeiro?
4. ✅ Fez logout e login novamente?
