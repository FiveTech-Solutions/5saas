import { z } from 'zod';

export const customerSchema = z.object({
    razao_social: z.string().min(3, 'Razão Social/Nome deve ter pelo menos 3 caracteres'),
    nome_fantasia: z.string().optional(),
    cpf_cnpj: z.string().min(11, 'CPF/CNPJ inválido').max(14, 'CPF/CNPJ inválido').regex(/^\d+$/, 'Apenas números'),
    email: z.string().email('Email inválido').optional().or(z.literal('')),
    telefone: z.string().optional(),
    cep: z.string().length(8, 'CEP deve ter 8 dígitos').regex(/^\d+$/, 'Apenas números').optional().or(z.literal('')),
    logradouro: z.string().optional(),
    numero: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    uf: z.string().length(2, 'UF deve ter 2 letras').optional().or(z.literal('')),
    inscricao_estadual: z.string().optional(),
    inscricao_municipal: z.string().optional(),
});
