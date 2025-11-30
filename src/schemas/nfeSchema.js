import { z } from 'zod';

const nfeItemSchema = z.object({
    product_id: z.string().uuid('Produto inválido'),
    quantidade_comercial: z.number().positive('Quantidade deve ser maior que zero'),
    valor_unitario_comercial: z.number().nonnegative('Valor unitário não pode ser negativo'),
    valor_total_bruto: z.number().nonnegative(),
});

const nfePaymentSchema = z.object({
    forma_pagamento: z.string().min(2, 'Forma de pagamento inválida'),
    valor: z.number().positive('Valor do pagamento deve ser maior que zero'),
});

export const nfeSchema = z.object({
    natureza_operacao: z.string().min(3, 'Natureza da operação é obrigatória'),
    data_emissao: z.string().datetime().optional(),
    tipo_operacao: z.enum(['entrada', 'saida']),
    destinatario_id: z.string().uuid('Destinatário é obrigatório'),
    items: z.array(nfeItemSchema).min(1, 'Adicione pelo menos um item à nota'),
    payments: z.array(nfePaymentSchema).min(1, 'Adicione pelo menos uma forma de pagamento'),
    valor_total: z.number().nonnegative(),
});
