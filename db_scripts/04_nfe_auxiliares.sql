-- ================================================================
-- SCRIPT: Tabelas Auxiliares para NF-e
-- ================================================================
-- Execute este script APÓS 03_nfe_produtos.sql
-- Adiciona tabelas auxiliares de NCM, CFOP e outras necessárias
-- ================================================================

-- ================================================================
-- 1. TABELA DE NCM (Nomenclatura Comum do Mercosul)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.ncm_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(8) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    unidade_medida VARCHAR(10),
    aliquota_nacional DECIMAL(5,2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.ncm_codes IS 'Tabela de códigos NCM para classificação fiscal de produtos';

CREATE INDEX IF NOT EXISTS idx_ncm_codes_codigo ON public.ncm_codes(codigo);

-- ================================================================
-- 2. TABELA DE CFOP (Código Fiscal de Operações e Prestações)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cfop_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(4) UNIQUE NOT NULL,
    descricao TEXT NOT NULL,
    aplicacao TEXT,
    tipo_operacao VARCHAR(10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cfop_codes IS 'Tabela de códigos CFOP para operações fiscais';
COMMENT ON COLUMN public.cfop_codes.tipo_operacao IS 'entrada, saida';

CREATE INDEX IF NOT EXISTS idx_cfop_codes_codigo ON public.cfop_codes(codigo);
CREATE INDEX IF NOT EXISTS idx_cfop_codes_tipo ON public.cfop_codes(tipo_operacao);

-- ================================================================
-- 3. TABELA DE CEST (Código Especificador da Substituição Tributária)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cest_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(7) UNIQUE NOT NULL,
    ncm VARCHAR(8),
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.cest_codes IS 'Tabela de códigos CEST para substituição tributária';

CREATE INDEX IF NOT EXISTS idx_cest_codes_codigo ON public.cest_codes(codigo);
CREATE INDEX IF NOT EXISTS idx_cest_codes_ncm ON public.cest_codes(ncm);

-- ================================================================
-- 4. TABELA DE CST (Código de Situação Tributária)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.cst_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(3) NOT NULL,
    tipo_imposto VARCHAR(20) NOT NULL,
    descricao TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(codigo, tipo_imposto)
);

COMMENT ON TABLE public.cst_codes IS 'Tabela de códigos CST para situação tributária';
COMMENT ON COLUMN public.cst_codes.tipo_imposto IS 'ICMS, IPI, PIS, COFINS';

CREATE INDEX IF NOT EXISTS idx_cst_codes_codigo ON public.cst_codes(codigo);
CREATE INDEX IF NOT EXISTS idx_cst_codes_tipo ON public.cst_codes(tipo_imposto);

-- ================================================================
-- 5. TABELA DE TRANSPORTADORAS
-- ================================================================

CREATE TABLE IF NOT EXISTS public.transportadoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    cpf_cnpj VARCHAR(14) UNIQUE NOT NULL,
    razao_social VARCHAR(255) NOT NULL,
    nome_fantasia VARCHAR(255),
    inscricao_estadual VARCHAR(50),
    logradouro VARCHAR(255),
    numero VARCHAR(20),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    uf CHAR(2),
    cep VARCHAR(8),
    telefone VARCHAR(20),
    email VARCHAR(255),
    placa_veiculo VARCHAR(7),
    uf_veiculo CHAR(2),
    rntc VARCHAR(20),
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.transportadoras IS 'Cadastro de transportadoras para NF-e';
COMMENT ON COLUMN public.transportadoras.rntc IS 'Registro Nacional de Transportadores de Carga';

CREATE INDEX IF NOT EXISTS idx_transportadoras_user_id ON public.transportadoras(user_id);
CREATE INDEX IF NOT EXISTS idx_transportadoras_tenant_id ON public.transportadoras(tenant_id);

-- ================================================================
-- 6. TABELA DE FORMAS DE PAGAMENTO
-- ================================================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(2) UNIQUE NOT NULL,
    descricao VARCHAR(100) NOT NULL,
    ativo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.payment_methods IS 'Formas de pagamento aceitas para NF-e';

-- ================================================================
-- 7. TABELA DE PAGAMENTOS DA NF-e
-- ================================================================

CREATE TABLE IF NOT EXISTS public.nfe_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    forma_pagamento VARCHAR(2) NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    tipo_integracao VARCHAR(1),
    cnpj_credenciadora VARCHAR(14),
    bandeira_operadora VARCHAR(2),
    numero_autorizacao VARCHAR(20),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.nfe_payments IS 'Formas de pagamento utilizadas em cada NF-e';
COMMENT ON COLUMN public.nfe_payments.forma_pagamento IS '01-Dinheiro, 02-Cheque, 03-Cartão Crédito, etc';

CREATE INDEX IF NOT EXISTS idx_nfe_payments_nfe_id ON public.nfe_payments(nfe_id);

-- ================================================================
-- 8. TABELA DE DUPLICATAS/COBRANÇA
-- ================================================================

CREATE TABLE IF NOT EXISTS public.nfe_duplicatas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    numero_duplicata VARCHAR(20) NOT NULL,
    data_vencimento DATE NOT NULL,
    valor DECIMAL(15,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.nfe_duplicatas IS 'Duplicatas/parcelas de cobrança da NF-e';

CREATE INDEX IF NOT EXISTS idx_nfe_duplicatas_nfe_id ON public.nfe_duplicatas(nfe_id);

-- ================================================================
-- 9. TABELA DE EVENTOS DA NF-e (Cancelamento, Carta de Correção)
-- ================================================================

CREATE TABLE IF NOT EXISTS public.nfe_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nfe_id UUID NOT NULL REFERENCES public.nfes(id) ON DELETE CASCADE,
    tipo_evento VARCHAR(20) NOT NULL,
    sequencia_evento INT NOT NULL,
    descricao_evento TEXT NOT NULL,
    justificativa TEXT,
    protocol VARCHAR(100),
    data_evento TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    xml_evento TEXT,
    status VARCHAR(20) DEFAULT 'processando',
    motivo_rejeicao TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.nfe_events IS 'Eventos da NF-e (cancelamento, carta de correção, etc)';
COMMENT ON COLUMN public.nfe_events.tipo_evento IS 'cancelamento, carta_correcao, manifestacao';

CREATE INDEX IF NOT EXISTS idx_nfe_events_nfe_id ON public.nfe_events(nfe_id);
CREATE INDEX IF NOT EXISTS idx_nfe_events_tipo ON public.nfe_events(tipo_evento);

-- ================================================================
-- 10. TRIGGERS
-- ================================================================

DROP TRIGGER IF EXISTS set_timestamp_transportadoras ON public.transportadoras;
CREATE TRIGGER set_timestamp_transportadoras
    BEFORE UPDATE ON public.transportadoras
    FOR EACH ROW
    EXECUTE PROCEDURE public.trigger_set_timestamp();

-- ================================================================
-- 11. ROW LEVEL SECURITY
-- ================================================================

ALTER TABLE public.ncm_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cfop_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cest_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cst_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transportadoras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_duplicatas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfe_events ENABLE ROW LEVEL SECURITY;

-- Políticas para tabelas de códigos (todos podem ler)
CREATE POLICY "Anyone can view ncm codes" ON public.ncm_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can view cfop codes" ON public.cfop_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can view cest codes" ON public.cest_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can view cst codes" ON public.cst_codes FOR SELECT USING (true);
CREATE POLICY "Anyone can view payment methods" ON public.payment_methods FOR SELECT USING (true);

-- Políticas para transportadoras
CREATE POLICY "Users can view own transportadoras" ON public.transportadoras FOR SELECT 
    USING (user_id = auth.uid() OR tenant_id = public.current_tenant_id());
CREATE POLICY "Users can insert own transportadoras" ON public.transportadoras FOR INSERT 
    WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own transportadoras" ON public.transportadoras FOR UPDATE 
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own transportadoras" ON public.transportadoras FOR DELETE 
    USING (user_id = auth.uid());

-- Políticas para nfe_payments
CREATE POLICY "Users can view own nfe payments" ON public.nfe_payments FOR SELECT 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own nfe payments" ON public.nfe_payments FOR ALL 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));

-- Políticas para nfe_duplicatas
CREATE POLICY "Users can view own nfe duplicatas" ON public.nfe_duplicatas FOR SELECT 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own nfe duplicatas" ON public.nfe_duplicatas FOR ALL 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));

-- Políticas para nfe_events
CREATE POLICY "Users can view own nfe events" ON public.nfe_events FOR SELECT 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));
CREATE POLICY "Users can manage own nfe events" ON public.nfe_events FOR ALL 
    USING (nfe_id IN (SELECT id FROM public.nfes WHERE user_id = auth.uid()));

-- ================================================================
-- 12. DADOS INICIAIS
-- ================================================================

-- Inserir formas de pagamento padrão
INSERT INTO public.payment_methods (codigo, descricao) VALUES
('01', 'Dinheiro'),
('02', 'Cheque'),
('03', 'Cartão de Crédito'),
('04', 'Cartão de Débito'),
('05', 'Crédito Loja'),
('10', 'Vale Alimentação'),
('11', 'Vale Refeição'),
('12', 'Vale Presente'),
('13', 'Vale Combustível'),
('14', 'Duplicata Mercantil'),
('15', 'Boleto Bancário'),
('16', 'Depósito Bancário'),
('17', 'Pagamento Instantâneo (PIX)'),
('18', 'Transferência bancária, Carteira Digital'),
('19', 'Programa de fidelidade, Cashback, Crédito Virtual'),
('90', 'Sem pagamento'),
('99', 'Outros')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir alguns CFOPs mais comuns
INSERT INTO public.cfop_codes (codigo, descricao, tipo_operacao, aplicacao) VALUES
('5101', 'Venda de produção do estabelecimento', 'saida', 'Operação interna'),
('5102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'saida', 'Operação interna'),
('5405', 'Venda de mercadoria adquirida ou recebida de terceiros em operação com mercadoria sujeita ao regime de substituição tributária', 'saida', 'Operação interna'),
('5929', 'Lançamento efetuado em decorrência de emissão de documento fiscal relativo a operação ou prestação também registrada em equipamento Emissor de Cupom Fiscal - ECF', 'saida', 'Operação interna'),
('6101', 'Venda de produção do estabelecimento', 'saida', 'Operação interestadual'),
('6102', 'Venda de mercadoria adquirida ou recebida de terceiros', 'saida', 'Operação interestadual'),
('6108', 'Venda de mercadoria adquirida ou recebida de terceiros, destinada a não contribuinte', 'saida', 'Operação interestadual'),
('6404', 'Venda de mercadoria sujeita ao regime de substituição tributária, cujo imposto já tenha sido retido anteriormente', 'saida', 'Operação interestadual'),
('1102', 'Compra para comercialização', 'entrada', 'Operação interna'),
('2102', 'Compra para comercialização', 'entrada', 'Operação interestadual')
ON CONFLICT (codigo) DO NOTHING;

-- Inserir alguns CSTs de ICMS mais comuns
INSERT INTO public.cst_codes (codigo, tipo_imposto, descricao) VALUES
('00', 'ICMS', 'Tributada integralmente'),
('10', 'ICMS', 'Tributada e com cobrança do ICMS por substituição tributária'),
('20', 'ICMS', 'Com redução de base de cálculo'),
('30', 'ICMS', 'Isenta ou não tributada e com cobrança do ICMS por substituição tributária'),
('40', 'ICMS', 'Isenta'),
('41', 'ICMS', 'Não tributada'),
('50', 'ICMS', 'Suspensão'),
('51', 'ICMS', 'Diferimento'),
('60', 'ICMS', 'ICMS cobrado anteriormente por substituição tributária'),
('70', 'ICMS', 'Com redução de base de cálculo e cobrança do ICMS por substituição tributária'),
('90', 'ICMS', 'Outras'),
('101', 'ICMS', 'Tributada pelo Simples Nacional com permissão de crédito'),
('102', 'ICMS', 'Tributada pelo Simples Nacional sem permissão de crédito'),
('103', 'ICMS', 'Isenção do ICMS no Simples Nacional para faixa de receita bruta'),
('201', 'ICMS', 'Tributada pelo Simples Nacional com permissão de crédito e com cobrança do ICMS por substituição tributária'),
('202', 'ICMS', 'Tributada pelo Simples Nacional sem permissão de crédito e com cobrança do ICMS por substituição tributária'),
('203', 'ICMS', 'Isenção do ICMS no Simples Nacional para faixa de receita bruta e com cobrança do ICMS por substituição tributária'),
('300', 'ICMS', 'Imune'),
('400', 'ICMS', 'Não tributada pelo Simples Nacional'),
('500', 'ICMS', 'ICMS cobrado anteriormente por substituição tributária (substituído) ou por antecipação'),
('900', 'ICMS', 'Outros')
ON CONFLICT (codigo, tipo_imposto) DO NOTHING;

-- ================================================================
-- MENSAGEM FINAL
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE '✅ TABELAS AUXILIARES DE NF-e CRIADAS COM SUCESSO!';
    RAISE NOTICE '================================================================';
    RAISE NOTICE '📦 9 novas tabelas auxiliares criadas:';
    RAISE NOTICE '   - ncm_codes (Nomenclatura Comum do Mercosul)';
    RAISE NOTICE '   - cfop_codes (Código Fiscal de Operações)';
    RAISE NOTICE '   - cest_codes (Código Especificador ST)';
    RAISE NOTICE '   - cst_codes (Código Situação Tributária)';
    RAISE NOTICE '   - transportadoras';
    RAISE NOTICE '   - payment_methods';
    RAISE NOTICE '   - nfe_payments';
    RAISE NOTICE '   - nfe_duplicatas';
    RAISE NOTICE '   - nfe_events';
    RAISE NOTICE '';
    RAISE NOTICE '💰 17 formas de pagamento inseridas';
    RAISE NOTICE '📋 10 CFOPs mais comuns inseridos';
    RAISE NOTICE '🏷️  20 CSTs de ICMS inseridos';
    RAISE NOTICE '🔐 RLS habilitado em todas as tabelas';
    RAISE NOTICE '';
    RAISE NOTICE '✅ BANCO DE DADOS COMPLETO PARA NF-e!';
    RAISE NOTICE '================================================================';
END $$;
