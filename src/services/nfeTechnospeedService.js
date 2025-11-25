/**
 * Service para integração com a API Technospeed (PlugNotas) para emissão de NF-e
 * Documentação: https://plugnotas.docs.apiary.io/
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.plugnotas.com.br';
const API_KEY = import.meta.env.VITE_API_KEY;

/**
 * Faz requisição para a API Technospeed
 */
const apiRequest = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY,
            },
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || `API Error: ${response.status}`);
        }

        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
};

// ================================================================
// EMISSÃO DE NF-e
// ================================================================

/**
 * Monta o JSON da NF-e no formato esperado pela API Technospeed
 */
const buildNFeJSON = (nfeData, company, customer, items) => {
    return {
        idIntegracao: nfeData.id_integracao,
        serie: nfeData.serie || 1,
        finalidade: nfeData.finalidade || '1',
        natureza: nfeData.natureza_operacao,
        dataEmissao: nfeData.data_emissao,
        dataSaidaEntrada: nfeData.data_saida_entrada,
        saida: nfeData.tipo_operacao === 'saida',
        presencial: nfeData.presencial || '9',
        consumidorFinal: nfeData.consumidor_final !== false,

        // Emitente
        emitente: {
            cpfCnpj: company.cnpj,
            razaoSocial: company.razao_social,
            nomeFantasia: company.nome_fantasia,
            inscricaoMunicipal: company.inscricao_municipal,
            inscricaoEstadual: company.inscricao_estadual,
            regimeTributario: company.regime_tributario || '1',
            endereco: {
                logradouro: company.logradouro,
                numero: company.numero,
                complemento: company.complemento,
                bairro: company.bairro,
                codigoMunicipio: company.codigo_municipio,
                cidade: company.cidade,
                uf: company.uf,
                cep: company.cep,
            },
            telefone: company.telefone,
            email: company.email,
        },

        // Destinatário
        destinatario: {
            cpfCnpj: customer.cpf_cnpj,
            razaoSocial: customer.razao_social,
            nomeFantasia: customer.nome_fantasia,
            inscricaoMunicipal: customer.inscricao_municipal,
            inscricaoEstadual: customer.inscricao_estadual,
            endereco: {
                logradouro: customer.logradouro,
                numero: customer.numero,
                complemento: customer.complemento,
                bairro: customer.bairro,
                codigoMunicipio: customer.codigo_municipio,
                cidade: customer.cidade,
                uf: customer.uf,
                cep: customer.cep,
            },
            telefone: customer.telefone,
            email: customer.email,
        },

        // Itens
        itens: items.map((item, index) => ({
            numero: index + 1,
            codigo: item.codigo_produto,
            descricao: item.descricao,
            ncm: item.ncm,
            cfop: item.cfop,
            unidadeComercial: item.unidade_comercial,
            quantidadeComercial: item.quantidade_comercial,
            valorUnitarioComercial: item.valor_unitario_comercial,
            valorBruto: item.valor_total_bruto,
            valorDesconto: item.valor_desconto || 0,
            valorFrete: item.valor_frete || 0,
            valorSeguro: item.valor_seguro || 0,
            valorOutrasDespesas: item.valor_outras_despesas || 0,
            impostos: item.impostos || {},
        })),

        // Totais
        total: {
            valorProdutos: nfeData.valor_produtos,
            valorFrete: nfeData.valor_frete || 0,
            valorSeguro: nfeData.valor_seguro || 0,
            valorDesconto: nfeData.valor_desconto || 0,
            valorOutrasDespesas: nfeData.valor_outras_despesas || 0,
            valorTotal: nfeData.valor_total,
            valorTotalTributos: nfeData.valor_total_tributos || 0,
        },

        // Pagamentos
        pagamentos: nfeData.payments?.map(payment => ({
            formaPagamento: payment.forma_pagamento,
            valor: payment.valor,
            tipoIntegracao: payment.tipo_integracao,
            cnpjCredenciadora: payment.cnpj_credenciadora,
            bandeiraOperadora: payment.bandeira_operadora,
            numeroAutorizacao: payment.numero_autorizacao,
        })) || [],

        // Cobrança (duplicatas)
        cobranca: nfeData.duplicatas ? {
            duplicatas: nfeData.duplicatas.map(dup => ({
                numero: dup.numero_duplicata,
                dataVencimento: dup.data_vencimento,
                valor: dup.valor,
            })),
        } : undefined,

        // Informações complementares
        informacoesComplementares: nfeData.informacoes_complementares,

        // Enviar email após autorização
        enviaremail: nfeData.enviar_email !== false,
    };
};

/**
 * Emite uma NF-e na API Technospeed
 */
export const emitirNFe = async (nfeData, company, customer, items) => {
    try {
        const nfeJSON = buildNFeJSON(nfeData, company, customer, items);

        const response = await apiRequest('/nfe', 'POST', [nfeJSON]);

        return {
            success: true,
            data: response,
            idNota: response[0]?.id,
            protocol: response[0]?.protocol,
        };
    } catch (error) {
        console.error('Error emitting NFe:', error);
        throw new Error(error.message || 'Erro ao emitir NF-e');
    }
};

/**
 * Consulta o status de uma NF-e
 */
export const consultarNFe = async (idNota) => {
    try {
        const response = await apiRequest(`/nfe/${idNota}/resumo`, 'GET');
        return response;
    } catch (error) {
        console.error('Error consulting NFe:', error);
        throw new Error('Erro ao consultar NF-e');
    }
};

/**
 * Baixa o XML de uma NF-e autorizada
 */
export const downloadXML = async (idNota) => {
    try {
        const response = await apiRequest(`/nfe/${idNota}/xml`, 'GET');
        return response;
    } catch (error) {
        console.error('Error downloading XML:', error);
        throw new Error('Erro ao baixar XML');
    }
};

/**
 * Baixa o PDF (DANFE) de uma NF-e autorizada
 */
export const downloadPDF = async (idNota) => {
    try {
        const response = await apiRequest(`/nfe/${idNota}/pdf`, 'GET');
        return response;
    } catch (error) {
        console.error('Error downloading PDF:', error);
        throw new Error('Erro ao baixar PDF');
    }
};

// ================================================================
// CANCELAMENTO E CARTA DE CORREÇÃO
// ================================================================

/**
 * Cancela uma NF-e autorizada
 */
export const cancelarNFe = async (chaveAcesso, justificativa) => {
    try {
        if (justificativa.length < 15) {
            throw new Error('A justificativa deve ter no mínimo 15 caracteres');
        }

        const response = await apiRequest(`/nfe/${chaveAcesso}/cancelamento`, 'POST', {
            justificativa,
        });

        return response;
    } catch (error) {
        console.error('Error canceling NFe:', error);
        throw new Error(error.message || 'Erro ao cancelar NF-e');
    }
};

/**
 * Envia carta de correção para uma NF-e
 */
export const cartaCorrecao = async (chaveAcesso, correcao, sequencia = 1) => {
    try {
        if (correcao.length < 15) {
            throw new Error('A correção deve ter no mínimo 15 caracteres');
        }

        const response = await apiRequest(`/nfe/${chaveAcesso}/cartacorrecao`, 'POST', {
            correcao,
            sequencia,
        });

        return response;
    } catch (error) {
        console.error('Error sending carta de correção:', error);
        throw new Error(error.message || 'Erro ao enviar carta de correção');
    }
};

// ================================================================
// INUTILIZAÇÃO DE NUMERAÇÃO
// ================================================================

/**
 * Inutiliza uma faixa de numeração de NF-e
 */
export const inutilizarNumero = async (serie, numeroInicial, numeroFinal, justificativa) => {
    try {
        if (justificativa.length < 15) {
            throw new Error('A justificativa deve ter no mínimo 15 caracteres');
        }

        const response = await apiRequest('/nfe/inutilizacao', 'POST', {
            serie,
            numeroInicial,
            numeroFinal,
            justificativa,
        });

        return response;
    } catch (error) {
        console.error('Error inutilizing numbers:', error);
        throw new Error(error.message || 'Erro ao inutilizar numeração');
    }
};

// ================================================================
// MANIFESTAÇÃO DO DESTINATÁRIO
// ================================================================

/**
 * Confirma operação (Manifestação do Destinatário)
 */
export const confirmarOperacao = async (chaveAcesso) => {
    try {
        const response = await apiRequest(`/nfe/${chaveAcesso}/manifestacao`, 'POST', {
            tipo: 'ciencia',
        });

        return response;
    } catch (error) {
        console.error('Error confirming operation:', error);
        throw new Error('Erro ao confirmar operação');
    }
};

/**
 * Desconhece operação (Manifestação do Destinatário)
 */
export const desconhecerOperacao = async (chaveAcesso) => {
    try {
        const response = await apiRequest(`/nfe/${chaveAcesso}/manifestacao`, 'POST', {
            tipo: 'desconhecimento',
        });

        return response;
    } catch (error) {
        console.error('Error rejecting operation:', error);
        throw new Error('Erro ao desconhecer operação');
    }
};

// ================================================================
// CONSULTAS
// ================================================================

/**
 * Consulta NF-e por chave de acesso na SEFAZ
 */
export const consultarChaveAcesso = async (chaveAcesso) => {
    try {
        const response = await apiRequest(`/nfe/consulta/${chaveAcesso}`, 'GET');
        return response;
    } catch (error) {
        console.error('Error consulting chave de acesso:', error);
        throw new Error('Erro ao consultar chave de acesso');
    }
};

/**
 * Consulta status do serviço da SEFAZ
 */
export const consultarStatusServico = async (uf = 'SP') => {
    try {
        const response = await apiRequest(`/nfe/status/${uf}`, 'GET');
        return response;
    } catch (error) {
        console.error('Error consulting service status:', error);
        throw new Error('Erro ao consultar status do serviço');
    }
};

// ================================================================
// WEBHOOK
// ================================================================

/**
 * Processa notificação de webhook da Technospeed
 */
export const processWebhookNotification = (webhookData) => {
    try {
        // Extrair informações importantes do webhook
        const notification = {
            idNota: webhookData.id,
            idIntegracao: webhookData.idIntegracao,
            status: webhookData.status,
            chaveAcesso: webhookData.chaveAcesso,
            numero: webhookData.numero,
            serie: webhookData.serie,
            protocol: webhookData.protocolo,
            dataAutorizacao: webhookData.dataAutorizacao,
            motivoRejeicao: webhookData.motivoRejeicao,
            xmlUrl: webhookData.xml,
            pdfUrl: webhookData.pdf,
        };

        return notification;
    } catch (error) {
        console.error('Error processing webhook:', error);
        throw new Error('Erro ao processar notificação do webhook');
    }
};
