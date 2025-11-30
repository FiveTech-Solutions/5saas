-- Primeiro, vamos tornar category_id opcional na tabela products
ALTER TABLE products ALTER COLUMN category_id DROP NOT NULL;

-- Criar a tabela product_categories se não existir
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Criar a tabela product_subcategories se não existir
CREATE TABLE IF NOT EXISTS product_subcategories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES product_categories(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(category_id, slug)
);

-- Inserir algumas categorias padrão
INSERT INTO product_categories (name, slug, description, icon) VALUES
  ('Alimentos', 'alimentos', 'Produtos alimentícios', 'restaurant'),
  ('Bebidas', 'bebidas', 'Bebidas em geral', 'local_bar'),
  ('Limpeza', 'limpeza', 'Produtos de limpeza', 'cleaning_services'),
  ('Higiene', 'higiene', 'Produtos de higiene pessoal', 'soap'),
  ('Eletrônicos', 'eletronicos', 'Produtos eletrônicos', 'devices'),
  ('Vestuário', 'vestuario', 'Roupas e acessórios', 'checkroom')
ON CONFLICT (slug) DO NOTHING;
