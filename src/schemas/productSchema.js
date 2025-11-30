import { z } from 'zod';

export const productSchema = z.object({
    nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres').max(100, 'Nome muito longo'),
    codigo: z.string().min(1, 'Código é obrigatório'),
    codigo_barras: z.string().optional().nullable(),
    ncm: z.string().length(8, 'NCM deve ter 8 dígitos').regex(/^\d+$/, 'NCM deve conter apenas números').optional().or(z.literal('')),
    cest: z.string().regex(/^\d+$/, 'CEST deve conter apenas números').optional().nullable().or(z.literal('')),
    unidade_medida: z.string().min(1, 'Unidade é obrigatória'),
    preco_venda: z.number().min(0, 'Preço de venda não pode ser negativo'),
    preco_custo: z.number().min(0, 'Preço de custo não pode ser negativo').optional(),
    margem_lucro: z.number().optional(),
    estoque_inicial: z.number().int().optional(),
    estoque_minimo: z.number().int().min(0).optional(),
    origem_mercadoria: z.string().length(1, 'Origem deve ter 1 dígito').optional().or(z.literal('')),
    category_id: z.string().uuid('Categoria inválida').optional().nullable().or(z.literal('')),
    subcategory_id: z.string().uuid('Subcategoria inválida').optional().nullable().or(z.literal('')),
});

export const productTaxSchema = z.object({
    tipo_imposto: z.enum(['ICMS', 'IPI', 'PIS', 'COFINS']),
    aliquota: z.number().min(0).max(100),
    base_calculo: z.number().min(0).max(100).optional(),
    cst: z.string().optional(),
});
