import logger from './logger';

/**
 * Utilitário para parsing de XML de NF-e
 * Extrai dados de produtos e impostos de arquivos XML de Nota Fiscal Eletrônica
 */

/**
 * Extrai dados de ICMS do XML
 * Suporta múltiplos tipos: ICMS00, ICMS10, ICMS20, ICMS30, ICMS40, ICMS51, ICMS60, ICMS70, ICMS90, ICMSSN101, etc.
 */
const extractICMS = (icmsNode) => {
    if (!icmsNode) return null;

    // ICMS pode ter vários tipos de nós filhos (ICMS00, ICMS10, etc.)
    const icmsTypes = [
        'ICMS00', 'ICMS10', 'ICMS20', 'ICMS30', 'ICMS40', 'ICMS51',
        'ICMS60', 'ICMS70', 'ICMS90', 'ICMSSN101', 'ICMSSN102', 'ICMSSN201',
        'ICMSSN202', 'ICMSSN500', 'ICMSSN900'
    ];

    let icmsData = null;

    for (const type of icmsTypes) {
        const node = icmsNode.querySelector(type);
        if (node) {
            const orig = node.querySelector('orig')?.textContent || '0';
            const cst = node.querySelector('CST')?.textContent || node.querySelector('CSOSN')?.textContent || '';
            const pICMS = parseFloat(node.querySelector('pICMS')?.textContent || '0');
            const vBC = parseFloat(node.querySelector('vBC')?.textContent || '0');
            const modBC = node.querySelector('modBC')?.textContent || null;

            icmsData = {
                tipo_imposto: 'ICMS',
                aliquota: pICMS,
                base_calculo: vBC > 0 ? 100 : 0, // Se tem BC, assume 100%
                cst: cst,
                modalidade_bc: modBC,
                origem_mercadoria: orig,
            };
            break;
        }
    }

    return icmsData;
};

/**
 * Extrai dados de PIS do XML
 * Suporta: PISAliq, PISNT, PISQtde, PISOutr
 */
const extractPIS = (pisNode) => {
    if (!pisNode) return null;

    const pisTypes = ['PISAliq', 'PISQtde', 'PISOutr', 'PISNT'];
    let pisData = null;

    for (const type of pisTypes) {
        const node = pisNode.querySelector(type);
        if (node) {
            const cst = node.querySelector('CST')?.textContent || '';
            const pPIS = parseFloat(node.querySelector('pPIS')?.textContent || '0');
            const vBC = parseFloat(node.querySelector('vBC')?.textContent || '0');

            pisData = {
                tipo_imposto: 'PIS',
                aliquota: pPIS,
                base_calculo: vBC > 0 ? 100 : 0,
                cst: cst,
            };
            break;
        }
    }

    return pisData;
};

/**
 * Extrai dados de COFINS do XML
 * Suporta: COFINSAliq, COFINSNT, COFINSQtde, COFINSOutr
 */
const extractCOFINS = (cofinsNode) => {
    if (!cofinsNode) return null;

    const cofinsTypes = ['COFINSAliq', 'COFINSQtde', 'COFINSOutr', 'COFINSNT'];
    let cofinsData = null;

    for (const type of cofinsTypes) {
        const node = cofinsNode.querySelector(type);
        if (node) {
            const cst = node.querySelector('CST')?.textContent || '';
            const pCOFINS = parseFloat(node.querySelector('pCOFINS')?.textContent || '0');
            const vBC = parseFloat(node.querySelector('vBC')?.textContent || '0');

            cofinsData = {
                tipo_imposto: 'COFINS',
                aliquota: pCOFINS,
                base_calculo: vBC > 0 ? 100 : 0,
                cst: cst,
            };
            break;
        }
    }

    return cofinsData;
};

/**
 * Extrai dados de IPI do XML (opcional)
 * Suporta: IPITrib, IPINT
 */
const extractIPI = (ipiNode) => {
    if (!ipiNode) return null;

    const ipiTrib = ipiNode.querySelector('IPITrib');
    if (ipiTrib) {
        const cst = ipiTrib.querySelector('CST')?.textContent || '';
        const pIPI = parseFloat(ipiTrib.querySelector('pIPI')?.textContent || '0');
        const vBC = parseFloat(ipiTrib.querySelector('vBC')?.textContent || '0');

        return {
            tipo_imposto: 'IPI',
            aliquota: pIPI,
            base_calculo: vBC > 0 ? 100 : 0,
            cst: cst,
        };
    }

    return null;
};

/**
 * Extrai todos os impostos de um item
 */
const extractTaxData = (impostoNode) => {
    if (!impostoNode) return [];

    const taxes = [];

    // Extrair ICMS
    const icmsNode = impostoNode.querySelector('ICMS');
    const icms = extractICMS(icmsNode);
    if (icms && icms.aliquota > 0) {
        taxes.push(icms);
    }

    // Extrair PIS
    const pisNode = impostoNode.querySelector('PIS');
    const pis = extractPIS(pisNode);
    if (pis && pis.aliquota > 0) {
        taxes.push(pis);
    }

    // Extrair COFINS
    const cofinsNode = impostoNode.querySelector('COFINS');
    const cofins = extractCOFINS(cofinsNode);
    if (cofins && cofins.aliquota > 0) {
        taxes.push(cofins);
    }

    // Extrair IPI (opcional)
    const ipiNode = impostoNode.querySelector('IPI');
    const ipi = extractIPI(ipiNode);
    if (ipi && ipi.aliquota > 0) {
        taxes.push(ipi);
    }

    return taxes;
};

/**
 * Extrai dados do produto de um nó <prod>
 */
const extractProductData = (prodNode) => {
    if (!prodNode) return null;

    return {
        codigo: prodNode.querySelector('cProd')?.textContent || '',
        nome: prodNode.querySelector('xProd')?.textContent || '',
        ncm: prodNode.querySelector('NCM')?.textContent || '',
        cest: prodNode.querySelector('CEST')?.textContent || '',
        cfop: prodNode.querySelector('CFOP')?.textContent || '',
        unidade: prodNode.querySelector('uCom')?.textContent || 'UN',
        preco_custo: parseFloat(prodNode.querySelector('vUnCom')?.textContent || '0'),
        preco_venda: 0, // Inicializa como 0 para ser definido pelo usuário
        margem_lucro: 0, // Inicializa como 0
        descricao: prodNode.querySelector('xProd')?.textContent || '',
        codigo_barras: prodNode.querySelector('cEAN')?.textContent || null,
    };
};

/**
 * Parser principal de XML de NF-e
 * Extrai todos os produtos e seus impostos
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {Array} Array de produtos com impostos
 */
export const parseNFeXML = (xmlDoc) => {
    try {
        const items = xmlDoc.querySelectorAll('det');
        const products = [];

        items.forEach((item, index) => {
            const prod = item.querySelector('prod');
            const imposto = item.querySelector('imposto');

            if (prod) {
                const productData = extractProductData(prod);
                const taxes = extractTaxData(imposto);

                if (productData && productData.codigo) {
                    products.push({
                        ...productData,
                        impostos: taxes,
                        numero_item: index + 1,
                    });
                }
            }
        });

        logger.info(`Parsed ${products.length} products from XML`);
        return products;

    } catch (error) {
        logger.error('Error parsing NF-e XML:', error);
        throw new Error('Erro ao processar XML da NF-e');
    }
};

/**
 * Valida se o XML é uma NF-e válida
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {boolean} True se é uma NF-e válida
 */
export const validateNFeXML = (xmlDoc) => {
    // Verificar se tem a estrutura básica de NF-e
    const nfeNode = xmlDoc.querySelector('NFe');
    const infNFe = xmlDoc.querySelector('infNFe');

    if (!nfeNode && !infNFe) {
        return false;
    }

    // Verificar se tem pelo menos um item
    const items = xmlDoc.querySelectorAll('det');
    if (items.length === 0) {
        return false;
    }

    return true;
};

/**
 * Extrai informações do emitente da NF-e
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {Object|null} Dados do emitente
 */
export const extractEmitterData = (xmlDoc) => {
    const emit = xmlDoc.querySelector('emit');
    if (!emit) return null;

    return {
        cnpj: emit.querySelector('CNPJ')?.textContent || '',
        razao_social: emit.querySelector('xNome')?.textContent || '',
        nome_fantasia: emit.querySelector('xFant')?.textContent || '',
        ie: emit.querySelector('IE')?.textContent || '',
    };
};

/**
 * Extrai informações gerais da NF-e
 * 
 * @param {Document} xmlDoc - Documento XML parseado
 * @returns {Object|null} Dados da NF-e
 */
export const extractNFeInfo = (xmlDoc) => {
    const ide = xmlDoc.querySelector('ide');
    if (!ide) return null;

    return {
        numero: ide.querySelector('nNF')?.textContent || '',
        serie: ide.querySelector('serie')?.textContent || '1',
        data_emissao: ide.querySelector('dEmi')?.textContent || '',
        natureza_operacao: ide.querySelector('natOp')?.textContent || '',
        chave_acesso: xmlDoc.querySelector('infNFe')?.getAttribute('Id')?.replace('NFe', '') || '',
    };
};
