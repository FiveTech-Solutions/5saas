import { z } from 'zod';

const enderecoSchema = z.object({
    cep: z.string().min(8, 'CEP inválido'),
    logradouro: z.string().min(1, 'Logradouro é obrigatório'),
    numero: z.string().min(1, 'Número é obrigatório'),
    bairro: z.string().min(1, 'Bairro é obrigatório'),
    descricaoCidade: z.string().min(1, 'Cidade é obrigatória'),
    estado: z.string().length(2, 'UF deve ter 2 letras'),
    codigoCidade: z.string().optional(),
    complemento: z.string().optional(),
});

const tomadorSchema = z.object({
    cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
    razaoSocial: z.string().min(3, 'Razão Social é obrigatória'),
    email: z.string().email('Email inválido'),
    inscricaoMunicipal: z.string().optional(),
    endereco: enderecoSchema,
});

const servicoValorSchema = z.object({
    servico: z.number().positive('Valor do serviço deve ser maior que zero'),
    descontoCondicionado: z.number().optional(),
    descontoIncondicionado: z.number().optional(),
});

const servicoSchema = z.object({
    codigo: z.string().min(1, 'Código do serviço é obrigatório'),
    discriminacao: z.string().min(5, 'Discriminação deve ter pelo menos 5 caracteres'),
    cnae: z.string().optional(),
    valor: servicoValorSchema,
});

export const nfseSchema = z.object({
    idIntegracao: z.string(),
    prestador: z.object({
        cpfCnpj: z.string().optional(), // Often read-only or pre-filled
    }).optional(),
    tomador: tomadorSchema,
    servico: z.array(servicoSchema).min(1, 'Adicione pelo menos um serviço'),
});
