-- ================================================================
-- SCRIPT: Criar Tabelas para NF-e e Gestão de Produtos
-- ================================================================
-- Execute este script APÓS o setup completo do banco
-- Adiciona funcionalidades de emissão de NF-e e gestão de produtos
-- ================================================================

-- ================================================================
-- 1. TABELAS DE CATEGORIAS E PRODUTOS
-- ================================================================

-- Tabela de Categorias de Produtos
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    requires_details BOOLEAN DEFAULT false,
    detail_schema JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.product_categories IS 'Categorias de produtos (Veículos, Mercado, Eletrônicos, etc)';

-- Tabela de Subcategorias
CREATE TABLE IF NOT EXISTS public.product_subcategories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES public.product_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(category_id, slug)
);

COMMENT ON TABLE public.product_subcategories IS 'Subcategorias de produtos (SUV, Hatch, Cereais, Açougue, etc)';

-- Tabela de Produtos
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.product_categories(id),
    subcategory_id UUID REFERENCES public.product_subcategories(id),
    codigo VARCHAR(50) NOT NULL,
    codigo_barras VARCHAR(50),
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    unidade_medida VARCHAR(10) NOT NULL DEFAULT 'UN',
    ncm VARCHAR(8),
    cest VARCHAR(7),
    cfop VARCHAR(4),
    origem_mercadoria VARCHAR(1) DEFAULT '0',
    tipo_produto VARCHAR(20) DEFAULT 'produto',
    detalhes_especificos JSONB,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_code UNIQUE(tenant_id, codigo)
);

COMMENT ON TABLE public.products IS 'Produtos cadastrados para emissão de NF-e';
COMMENT ON COLUMN public.products.ncm IS 'Nomenclatura Comum do Mercosul';
COMMENT ON COLUMN public.products.cest IS 'Código Especificador da Substituição Tributária';
COMMENT ON COLUMN public.products.cfop IS 'Código Fiscal de Operações e Prestações';
COMMENT ON COLUMN public.products.origem_mercadoria IS '0-Nacional, 1-Estrangeira importação direta, 2-Estrangeira adquirida no mercado interno, etc';

-- Tabela de Preços
CREATE TABLE IF NOT EXISTS public.product_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    preco_custo DECIMAL(15,2) DEFAULT 0,
    preco_venda DECIMAL(15,2) NOT NULL,
    margem_lucro DECIMAL(5,2),
    preco_promocional DECIMAL(15,2),
    data_inicio_promocao DATE,
    data_fim_promocao DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_price UNIQUE(product_id)
);

COMMENT ON TABLE public.product_prices IS 'Preços e promoções de produtos';

-- Tabela de Estoque
CREATE TABLE IF NOT EXISTS public.product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantidade_atual DECIMAL(15,3) DEFAULT 0,
    quantidade_minima DECIMAL(15,3) DEFAULT 0,
    quantidade_maxima DECIMAL(15,3),
    localizacao VARCHAR(100),
    lote VARCHAR(50),
    data_validade DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_stock UNIQUE(product_id)
);

COMMENT ON TABLE public.product_stock IS 'Controle de estoque de produtos';

-- Tabela de Impostos por Produto
CREATE TABLE IF NOT EXISTS public.product_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tipo_imposto VARCHAR(20) NOT NULL,
    regime_tributario VARCHAR(30) DEFAULT 'simples_nacional',
    aliquota DECIMAL(5,2) NOT NULL,
    base_calculo DECIMAL(5,2) DEFAULT 100,
    reducao_base_calculo DECIMAL(5,2) DEFAULT 0,
    cst VARCHAR(3),
    modalidade_bc VARCHAR(1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.product_taxes IS 'Configuração de impostos por produto';
COMMENT ON COLUMN public.product_taxes.tipo_imposto IS 'ICMS, IPI, PIS, COFINS, IBS, CBS';
COMMENT ON COLUMN public.product_taxes.cst IS 'Código de Situação Tributária';

-- Tabela de Movimentações de Estoque
CREATE TABLE IF NOT EXISTS public.product_stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    tipo_movimento VARCHAR(20) NOT NULL,
    quantidade DECIMAL(15,3) NOT NULL,
    quantidade_anterior DECIMAL(15,3) NOT NULL,
    quantidade_nova DECIMAL(15,3) NOT NULL,
    motivo TEXT,
    documento_referencia VARCHAR(100),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.product_stock_movements IS 'Histórico de movimentações de estoque';
COMMENT ON COLUMN public.product_stock_movements.tipo_movimento IS 'entrada, saida, ajuste, devolucao';

-- ================================================================
-- 2. TABELAS DE NF-e
-- ================================================================

-- Tabela de NF-e
CREATE TABLE IF NOT EXISTS public.nfes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    id_integracao VARCHAR(50) UNIQUE NOT NULL,
    numero BIGINT,
    serie INT DEFAULT 1,
    chave_acesso VARCHAR(44),
    protocol VARCHAR(100),
    status VARCHAR(30) DEFAULT 'processando',
    finalidade VARCHAR(1) DEFAULT '1',
    natureza_operacao VARCHAR(60) NOT NULL,
    data_emissao TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    data_saida_entrada TIMESTAMPTZ,
    tipo_operacao VARCHAR(10) DEFAULT 'saida',
    presencial VARCHAR(1) DEFAULT '9',
    consumidor_final BOOLEAN DEFAULT true,
    destinatario_id UUID REFERENCES public.customers(id),
    valor_total DECIMAL(15,2) NOT NULL,
    valor_produtos DECIMAL(15,2) NOT NULL,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_seguro DECIMAL(15,2) DEFAULT 0,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_outras_despesas DECIMAL(15,2) DEFAULT 0,
    valor_total_tributos DECIMAL(15,2) DEFAULT 0,
    nfe_data JSONB,
    xml_url TEXT,
    pdf_url TEXT,
    motivo_rejeicao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.nfes IS 'Notas Fiscais Eletrônicas (NF-e) emitidas';
COMMENT ON COLUMN public.nfes.status IS 'processando, autorizada, rejeitada, cancelada, denegada';
COMMENT ON COLUMN public.nfes.finalidade IS '1-Normal, 2-Complementar, 3-Ajuste, 4-Devolução';

-- Tabela de Itens da NF-e
CREATE TABLE IF NOT EXISTS public.nfe_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id),
    numero_item INT NOT NULL,
    codigo_produto VARCHAR(50) NOT NULL,
    descricao VARCHAR(255) NOT NULL,
    ncm VARCHAR(8) NOT NULL,
    cfop VARCHAR(4) NOT NULL,
    unidade_comercial VARCHAR(10) NOT NULL,
    quantidade_comercial DECIMAL(15,4) NOT NULL,
    valor_unitario_comercial DECIMAL(15,10) NOT NULL,
    valor_total_bruto DECIMAL(15,2) NOT NULL,
    valor_desconto DECIMAL(15,2) DEFAULT 0,
    valor_frete DECIMAL(15,2) DEFAULT 0,
    valor_seguro DECIMAL(15,2) DEFAULT 0,
    valor_outras_despesas DECIMAL(15,2) DEFAULT 0,
    impostos JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_nfe_item UNIQUE(nfe_id, numero_item)
);

COMMENT ON TABLE public.nfe_items IS 'Itens/produtos das NF-e emitidas';

-- ================================================================
-- 3. ÍNDICES PARA OTIMIZAÇÃO
-- ================================================================

CREATE INDEX IF NOT EXISTS idx_products_tenant_id ON public.products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_codigo ON public.products(codigo);
CREATE INDEX IF NOT EXISTS idx_products_codigo_barras ON public.products(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_products_ativo ON public.products(ativo);

CREATE INDEX IF NOT EXISTS idx_product_stock_movements_product_id ON public.product_stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_movements_created_at ON public.product_stock_movements(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nfes_tenant_id ON public.nfes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nfes_user_id ON public.nfes(user_id);
CREATE INDEX IF NOT EXISTS idx_nfes_status ON public.nfes(status);
CREATE INDEX IF NOT EXISTS idx_nfes_numero ON public.nfes(numero);
CREATE INDEX IF NOT EXISTS idx_nfes_chave_acesso ON public.nfes(chave_acesso);
CREATE INDEX IF NOT EXISTS idx_nfes_created_at ON public.nfes(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nfe_items_nfe_id ON public.nfe_items(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_items_product_id ON public.nfe_items(product_id);

-- ================================================================
-- 4. TRIGGERS
-- ================================================================

-- Trigger para atualizar updated_at em product_categories
DROP TRIGGER IF EXISTS set_timestamp_product_categories ON public.product_categories;
CREATE TRIGGER set_timestamp_product_categories
    BEFORE UPDATE ON public.product_categories
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger para atualizar updated_at em product_subcategories
DROP TRIGGER IF EXISTS set_timestamp_product_subcategories ON public.product_subcategories;
CREATE TRIGGER set_timestamp_product_subcategories
    BEFORE UPDATE ON public.product_subcategories
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger para atualizar updated_at em products
DROP TRIGGER IF EXISTS set_timestamp_products ON public.products;
CREATE TRIGGER set_timestamp_products
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger para atualizar updated_at em product_prices
DROP TRIGGER IF EXISTS set_timestamp_product_prices ON public.product_prices;
CREATE TRIGGER set_timestamp_product_prices
    BEFORE UPDATE ON public.product_prices
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger para atualizar updated_at em product_stock
DROP TRIGGER IF EXISTS set_timestamp_product_stock ON public.product_stock;
CREATE TRIGGER set_timestamp_product_stock
    BEFORE UPDATE ON public.product_stock
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- Trigger para atualizar updated_at em nfes
DROP TRIGGER IF EXISTS set_timestamp_nfes ON public.nfes;
CREATE TRIGGER set_timestamp_nfes
    BEFORE UPDATE ON public.nfes
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================================

-- Habilitar RLS
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_items ENABLE ROW LEVEL SECURITY;

-- Políticas para product_categories (todos podem ver, apenas admins podem modificar)
CREATE POLICY "Anyone can view categories" ON public.product_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.product_categories FOR ALL 
    USING ((SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'administrador');

-- Políticas para product_subcategories
CREATE POLICY "Anyone can view subcategories" ON public.product_subcategories FOR SELECT USING (true);
CREATE POLICY "Admins can manage subcategories" ON public.product_subcategories FOR ALL 
    USING ((SELECT user_role FROM public.user_profiles WHERE id = auth.uid()) = 'administrador');

-- Políticas para products
CREATE POLICY "Users can view own products" ON public.products FOR SELECT 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can insert own products" ON public.products FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own products" ON public.products FOR UPDATE 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE 
    USING (user_id = auth.uid());

-- Políticas para product_prices
CREATE POLICY "Users can view own product prices" ON public.product_prices FOR SELECT 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own product prices" ON public.product_prices FOR ALL 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));

-- Políticas para product_stock
CREATE POLICY "Users can view own product stock" ON public.product_stock FOR SELECT 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own product stock" ON public.product_stock FOR ALL 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));

-- Políticas para product_taxes
CREATE POLICY "Users can view own product taxes" ON public.product_taxes FOR SELECT 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own product taxes" ON public.product_taxes FOR ALL 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));

-- Políticas para product_stock_movements
CREATE POLICY "Users can view own stock movements" ON public.product_stock_movements FOR SELECT 
    USING (product_id IN (SELECT id FROM public.products WHERE user_id = auth.uid()));
CREATE POLICY "Users can insert stock movements" ON public.product_stock_movements FOR INSERT 
    WITH CHECK (user_id = auth.uid());

-- Políticas para nfes
CREATE POLICY "Users can view own nfes" ON public.nfes FOR SELECT 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can insert own nfes" ON public.nfes FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own nfes" ON public.nfes FOR UPDATE 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own nfes" ON public.nfes FOR DELETE 
    USING (user_id = auth.uid());

-- Políticas para nfe_items
CREATE POLICY "Users can view own nfe items" ON public.nfe_items FOR SELECT 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own nfe items" ON public.nfe_items FOR ALL 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));

-- ================================================================
-- 6. DADOS INICIAIS - CATEGORIAS PADRÃO
-- ================================================================

-- Inserir categorias padrão
INSERT INTO public.product_categories (name, slug, description, icon, requires_details, detail_schema) VALUES
(
    'Veículos',
    'veiculos',
    'Automóveis, motocicletas, caminhões e outros veículos',
    'car',
    true,
    '{
        "tipo": "veiculo",
        "campos": {
            "chassi": {"type": "string", "required": true, "label": "Chassi"},
            "renavam": {"type": "string", "required": true, "label": "RENAVAM"},
            "placa": {"type": "string", "required": false, "label": "Placa"},
            "ano_fabricacao": {"type": "number", "required": true, "label": "Ano de Fabricação"},
            "ano_modelo": {"type": "number", "required": true, "label": "Ano do Modelo"},
            "cor": {"type": "string", "required": true, "label": "Cor"},
            "combustivel": {"type": "enum", "values": ["gasolina", "etanol", "flex", "diesel", "eletrico", "hibrido"], "required": true, "label": "Combustível"},
            "potencia_motor": {"type": "string", "required": false, "label": "Potência do Motor"},
            "cilindradas": {"type": "number", "required": false, "label": "Cilindradas"},
            "numero_motor": {"type": "string", "required": false, "label": "Número do Motor"},
            "kilometragem": {"type": "number", "required": false, "label": "Kilometragem"},
            "tipo_veiculo": {"type": "enum", "values": ["automovel", "caminhonete", "caminhao", "motocicleta", "onibus"], "required": true, "label": "Tipo de Veículo"}
        }
    }'::jsonb
),
(
    'Mercado',
    'mercado',
    'Produtos alimentícios e de supermercado',
    'shopping-cart',
    true,
    '{
        "tipo": "alimento",
        "campos": {
            "lote": {"type": "string", "required": false, "label": "Lote"},
            "data_fabricacao": {"type": "date", "required": false, "label": "Data de Fabricação"},
            "data_validade": {"type": "date", "required": true, "label": "Data de Validade"},
            "registro_anvisa": {"type": "string", "required": false, "label": "Registro ANVISA"},
            "peso_liquido": {"type": "number", "required": false, "label": "Peso Líquido (g)"},
            "peso_bruto": {"type": "number", "required": false, "label": "Peso Bruto (g)"}
        }
    }'::jsonb
),
(
    'Eletrônicos',
    'eletronicos',
    'Equipamentos eletrônicos e eletrodomésticos',
    'laptop',
    false,
    null
),
(
    'Vestuário',
    'vestuario',
    'Roupas, calçados e acessórios',
    'shirt',
    false,
    null
),
(
    'Serviços',
    'servicos',
    'Serviços diversos',
    'briefcase',
    false,
    null
)
ON CONFLICT (slug) DO NOTHING;

-- Inserir subcategorias para Veículos
INSERT INTO public.product_subcategories (category_id, name, slug, description) 
SELECT 
    id,
    subcategory,
    lower(replace(subcategory, ' ', '-')),
    'Categoria de veículos tipo ' || subcategory
FROM public.product_categories, 
    unnest(ARRAY['SUV', 'Hatch', 'Sedan', 'Picape', 'Motocicleta', 'Caminhão']) AS subcategory
WHERE slug = 'veiculos'
ON CONFLICT DO NOTHING;

-- Inserir subcategorias para Mercado
INSERT INTO public.product_subcategories (category_id, name, slug, description) 
SELECT 
    id,
    subcategory,
    lower(replace(subcategory, ' ', '-')),
    'Categoria de produtos de ' || subcategory
FROM public.product_categories, 
    unnest(ARRAY['Cereais', 'Açougue', 'Padaria', 'Hortifruti', 'Laticínios', 'Bebidas', 'Limpeza', 'Higiene']) AS subcategory
WHERE slug = 'mercado'
ON CONFLICT DO NOTHING;

-- ================================================================
-- MENSAGEM FINAL
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ TABELAS DE NF-e E PRODUTOS CRIADAS COM SUCESSO!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '📦 9 novas tabelas criadas:';
    RAISE NOTICE '   - product_categories';
    RAISE NOTICE '   - product_subcategories';
    RAISE NOTICE '   - products';
    RAISE NOTICE '   - product_prices';
    RAISE NOTICE '   - product_stock';
    RAISE NOTICE '   - product_taxes';
    RAISE NOTICE '   - product_stock_movements';
    RAISE NOTICE '   - nfes';
    RAISE NOTICE '   - nfe_items';
    RAISE NOTICE '';
    RAISE NOTICE '🏷️  5 categorias padrão inseridas';
    RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 PRÓXIMO PASSO:';
    RAISE NOTICE '   Implementar os serviços de produtos e NF-e';
    RAISE NOTICE '================================================================';
END $$;
