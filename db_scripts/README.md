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

### 2️⃣ `00_setup_completo.sql` ✅ **PRINCIPAL**
**Quando:** Banco limpo ou novo

**O que faz:**
- ✅ Cria 8 tabelas básicas (tenants, plans, subscriptions, users, user_profiles, companies, customers, nfses)
- ✅ Cria 4 funções essenciais (incluindo `public.current_tenant_id()`)
- ✅ Configura triggers para `updated_at`
- ✅ Habilita RLS com todas as políticas
- ✅ Cria view `users_view`
- ✅ Insere 3 planos (basic, standard, premium)
- ✅ Configura permissões

**Tempo:** ~5 segundos

---

### 3️⃣ `01_setup_usuario.sql` 👤
**Quando:** Após executar `00_setup_completo.sql`

⚠️ **IMPORTANTE:** Altere o email `euclideslione@gmail.com` para o seu antes de executar!

**O que faz:**
- Cria tenant "Empresa Padrão"
- Cria assinatura ativa no plano premium
- Vincula seu usuário ao tenant
- Define você como administrador

**Tempo:** ~1 segundo

---

### 4️⃣ `03_nfe_produtos.sql` 📦 **NF-e E PRODUTOS**
**Quando:** Após executar `01_setup_usuario.sql`

**O que faz:**
- ✅ Cria 9 tabelas de produtos e NF-e
  - `product_categories` - Categorias de produtos
  - `product_subcategories` - Subcategorias
  - `products` - Produtos com campos dinâmicos
  - `product_prices` - Preços e promoções
  - `product_stock` - Controle de estoque
  - `product_taxes` - Impostos por produto
  - `product_stock_movements` - Histórico de movimentações
  - `nfes` - NF-e emitidas
  - `nfe_items` - Itens das NF-e
- ✅ Insere 5 categorias padrão (Veículos, Mercado, Eletrônicos, Vestuário, Serviços)
- ✅ Insere subcategorias (SUV, Hatch, Cereais, Açougue, etc)
- ✅ Schemas dinâmicos em JSONB para campos específicos
- ✅ RLS habilitado em todas as tabelas

**Tempo:** ~3 segundos

---

### 5️⃣ `04_nfe_auxiliares.sql` 🏷️ **TABELAS AUXILIARES**
**Quando:** Após executar `03_nfe_produtos.sql`

**O que faz:**
- ✅ Cria 9 tabelas auxiliares
  - `ncm_codes` - Nomenclatura Comum do Mercosul
  - `cfop_codes` - Código Fiscal de Operações
  - `cest_codes` - Código Especificador ST
  - `cst_codes` - Código Situação Tributária
  - `transportadoras` - Cadastro de transportadoras
  - `payment_methods` - Formas de pagamento
  - `nfe_payments` - Pagamentos da NF-e
  - `nfe_duplicatas` - Duplicatas/parcelas
  - `nfe_events` - Eventos (cancelamento, carta correção)
- ✅ Insere 17 formas de pagamento
- ✅ Insere 10 CFOPs mais comuns
- ✅ Insere 20 CSTs de ICMS
- ✅ RLS habilitado em todas as tabelas

**Tempo:** ~2 segundos

---

## 📋 Checklist de Execução Completa

- [ ] 1. Criar usuário no Supabase Auth (se ainda não tiver)
- [ ] 2. Executar `00_limpar_banco.sql` (se tiver dados antigos)
- [ ] 3. Executar `00_setup_completo.sql`
- [ ] 4. **Alterar email** em `01_setup_usuario.sql`
- [ ] 5. Executar `01_setup_usuario.sql`
- [ ] 6. Executar `03_nfe_produtos.sql`
- [ ] 7. Executar `04_nfe_auxiliares.sql`
- [ ] 8. Fazer LOGOUT do sistema
- [ ] 9. Fazer LOGIN novamente
- [ ] 10. ✅ Sistema completo funcionando!

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

## ✅ Verificação Final

Após executar todos os scripts, verifique:

```sql
-- Deve retornar 26 tabelas
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public';

-- Deve retornar 3 planos
SELECT COUNT(*) FROM public.plans;

-- Deve retornar 5 categorias
SELECT COUNT(*) FROM public.product_categories;

-- Deve retornar 17 formas de pagamento
SELECT COUNT(*) FROM public.payment_methods;

-- Deve retornar 10 CFOPs
SELECT COUNT(*) FROM public.cfop_codes;
```

---

## 🆘 Problemas Comuns

### Erro: "function public.current_tenant_id() does not exist"
**Solução:** Execute `00_setup_completo.sql` novamente (ele cria a função)

### Erro: "column user_id does not exist"
**Solução:** Você pulou o `00_setup_completo.sql`. Execute-o primeiro.

### Erro 404 ao fazer login
**Solução:** 
1. Verifique se executou `01_setup_usuario.sql`
2. Verifique se alterou o email no script
3. Faça logout e login novamente

### Erro: "table already exists"
**Solução:** Normal se você já executou o script antes. Os scripts usam `IF NOT EXISTS`.

---

## 📊 Estrutura Completa do Banco

### **Tabelas Básicas (8)**
- tenants, plans, subscriptions
- users, user_profiles
- companies, customers, nfses

### **Tabelas de Produtos (7)**
- product_categories, product_subcategories
- products, product_prices, product_stock
- product_taxes, product_stock_movements

### **Tabelas de NF-e (2)**
- nfes, nfe_items

### **Tabelas Auxiliares (9)**
- ncm_codes, cfop_codes, cest_codes, cst_codes
- transportadoras, payment_methods
- nfe_payments, nfe_duplicatas, nfe_events

**Total: 26 tabelas** 🎉

---

## 📞 Suporte

Se encontrar problemas, verifique:
1. ✅ Executou os scripts na ordem correta?
2. ✅ Alterou o email em `01_setup_usuario.sql`?
3. ✅ Criou o usuário no Supabase Auth primeiro?
4. ✅ Fez logout e login novamente?
5. ✅ Verificou se todas as tabelas foram criadas?
