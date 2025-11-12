-- Apaga as tabelas existentes para garantir um ambiente limpo.
DROP TABLE IF EXISTS "nfse";
DROP TABLE IF EXISTS "customers";
DROP TABLE IF EXISTS "companies";
DROP TABLE IF EXISTS "profiles";
DROP TABLE IF EXISTS "users";

-- Cria a nova tabela de usuários para nosso sistema de autenticação customizado.
-- Focada em armazenar o mínimo de dados necessários.
CREATE TABLE "users" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "email" TEXT UNIQUE NOT NULL,
  "encrypted_password" TEXT NOT NULL, -- A senha será armazenada após ser criptografada pela nossa função backend.
  "company_id" TEXT, -- ID da empresa da Tecnospeed vinculada a este usuário.
  "created_at" TIMESTAMPTZ DEFAULT now()
);

-- Cria a tabela de empresas para armazenar os dados que não vem da Tecnospeed
CREATE TABLE "companies" (
  "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  "user_id" UUID REFERENCES users(id) ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "document" TEXT UNIQUE NOT NULL, -- CNPJ da empresa
  "email" TEXT,
  "phone" TEXT,
  "created_at" TIMESTAMPTZ DEFAULT now()
);