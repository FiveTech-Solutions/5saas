import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerServicoPlugNotas } from '../services/plugnotasService';
import './ServiceForm.css'; // Assuming you'll create a CSS file for this

const ServiceForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [formData, setFormData] = useState({
    codigo: '',
    idIntegracao: '',
    discriminacao: '',
    codigoTributacao: '',
    cnae: '',
    codigoNbs: '',
    codigoCidadeIncidencia: '',
    descricaoCidadeIncidencia: '',
    unidade: 'UN',
    quantidade: 1,
    iss: {
      tipoTributacao: 6,
      exigibilidade: 1,
      retido: false,
      aliquota: 3,
      valor: 0,
      valorRetido: 0,
      processoSuspensao: '',
      situacaoTributaria: 0,
    },
    valor: {
      servico: 0,
      baseCalculo: 0,
      deducoes: 0,
      descontoCondicionado: 0,
      descontoIncondicionado: 0,
      liquido: 0,
      unitario: 0,
      ipi: 0,
    },
    // Minimal fields for now, can be expanded later
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // Handle nested state for ISS and Valor
    if (name.startsWith('iss.')) {
      const issField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        iss: {
          ...prev.iss,
          [issField]: value,
        },
      }));
    } else if (name.startsWith('valor.')) {
      const valorField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        valor: {
          ...prev.valor,
          [valorField]: parseFloat(value) || 0, // Ensure numeric values
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Basic validation
    if (!formData.idIntegracao || !formData.codigo || !formData.discriminacao || !formData.valor.servico) {
      setError('Por favor, preencha os campos obrigatórios: ID de Integração, Código, Discriminação e Valor do Serviço.');
      setLoading(false);
      return;
    }

    try {
      // Ensure numeric values for relevant fields before sending
      const payload = {
        ...formData,
        quantidade: parseFloat(formData.quantidade) || 1,
        iss: {
          ...formData.iss,
          tipoTributacao: parseInt(formData.iss.tipoTributacao) || 6,
          exigibilidade: parseInt(formData.iss.exigibilidade) || 1,
          aliquota: parseFloat(formData.iss.aliquota) || 3,
          valor: parseFloat(formData.iss.valor) || 0,
          valorRetido: parseFloat(formData.iss.valorRetido) || 0,
          situacaoTributaria: parseInt(formData.iss.situacaoTributaria) || 0,
        },
        valor: {
          ...formData.valor,
          servico: parseFloat(formData.valor.servico) || 0,
          baseCalculo: parseFloat(formData.valor.baseCalculo) || 0,
          deducoes: parseFloat(formData.valor.deducoes) || 0,
          descontoCondicionado: parseFloat(formData.valor.descontoCondicionado) || 0,
          descontoIncondicionado: parseFloat(formData.valor.descontoIncondicionado) || 0,
          liquido: parseFloat(formData.valor.liquido) || 0,
          unitario: parseFloat(formData.valor.unitario) || 0,
          ipi: parseFloat(formData.valor.ipi) || 0,
        },
      };

      const result = await registerServicoPlugNotas(payload);
      setSuccess(`Serviço "${result.idIntegracao}" cadastrado com sucesso!`);
      // Optionally clear form or navigate
      setFormData({ // Reset form
        codigo: '',
        idIntegracao: '',
        discriminacao: '',
        codigoTributacao: '',
        cnae: '',
        codigoNbs: '',
        codigoCidadeIncidencia: '',
        descricaoCidadeIncidencia: '',
        unidade: 'UN',
        quantidade: 1,
        iss: {
          tipoTributacao: 6,
          exigibilidade: 1,
          retido: false,
          aliquota: 3,
          valor: 0,
          valorRetido: 0,
          processoSuspensao: '',
          situacaoTributaria: 0,
        },
        valor: {
          servico: 0,
          baseCalculo: 0,
          deducoes: 0,
          descontoCondicionado: 0,
          descontoIncondicionado: 0,
          liquido: 0,
          unitario: 0,
          ipi: 0,
        },
      });
    } catch (err) {
      console.error("Erro ao cadastrar serviço:", err);
      setError(err.message || 'Erro ao cadastrar serviço.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="service-form-container">
      <div className="form-header">
        <h2>Cadastrar Novo Serviço</h2>
        <button className="btn-secondary" onClick={() => navigate('/servicos-tomados')}>Voltar</button>
      </div>

      {error && <div className="alert alert-error"><p>{error}</p></div>}
      {success && <div className="alert alert-success"><p>{success}</p></div>}

      <form onSubmit={handleSubmit} className="service-form">
        <section className="form-section">
          <h3>Dados Básicos do Serviço</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="idIntegracao">ID de Integração *</label>
              <input
                type="text"
                id="idIntegracao"
                name="idIntegracao"
                value={formData.idIntegracao}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="codigo">Código do Serviço *</label>
              <input
                type="text"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="discriminacao">Discriminação do Serviço *</label>
            <textarea
              id="discriminacao"
              name="discriminacao"
              value={formData.discriminacao}
              onChange={handleInputChange}
              rows="4"
              required
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="codigoTributacao">Código de Tributação</label>
              <input
                type="text"
                id="codigoTributacao"
                name="codigoTributacao"
                value={formData.codigoTributacao}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cnae">CNAE</label>
              <input
                type="text"
                id="cnae"
                name="cnae"
                value={formData.cnae}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="unidade">Unidade</label>
              <input
                type="text"
                id="unidade"
                name="unidade"
                value={formData.unidade}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantidade">Quantidade</label>
              <input
                type="number"
                id="quantidade"
                name="quantidade"
                value={formData.quantidade}
                onChange={handleInputChange}
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>Valores</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="valor.servico">Valor do Serviço (R$) *</label>
              <input
                type="number" // Using number for simplicity, can add mask later if needed
                id="valor.servico"
                name="valor.servico"
                value={formData.valor.servico}
                onChange={handleInputChange}
                step="0.01"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="valor.descontoCondicionado">Desconto Condicionado (R$)</label>
              <input
                type="number"
                id="valor.descontoCondicionado"
                name="valor.descontoCondicionado"
                value={formData.valor.descontoCondicionado}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="valor.descontoIncondicionado">Desconto Incondicionado (R$)</label>
              <input
                type="number"
                id="valor.descontoIncondicionado"
                name="valor.descontoIncondicionado"
                value={formData.valor.descontoIncondicionado}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
          </div>
        </section>

        <section className="form-section">
          <h3>ISS</h3>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="iss.aliquota">Alíquota (%)</label>
              <input
                type="number"
                id="iss.aliquota"
                name="iss.aliquota"
                value={formData.iss.aliquota}
                onChange={handleInputChange}
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="iss.exigibilidade">Exigibilidade</label>
              <select
                id="iss.exigibilidade"
                name="iss.exigibilidade"
                value={formData.iss.exigibilidade}
                onChange={handleInputChange}
              >
                <option value={1}>Exigível</option>
                <option value={2}>Não Incidência</option>
                <option value={3}>Isenção</option>
                <option value={4}>Suspensão por Decisão Judicial</option>
                <option value={5}>Suspensão por Processo Administrativo</option>
                <option value={6}>Suspensão por Liminar</option>
                <option value={7}>Suspensão por Depósito Judicial</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="iss.retido">Retido</label>
              <input
                type="checkbox"
                id="iss.retido"
                name="iss.retido"
                checked={formData.iss.retido}
                onChange={(e) => setFormData(prev => ({ ...prev, iss: { ...prev.iss, retido: e.target.checked } }))}
              />
            </div>
          </div>
        </section>

        <div className="form-actions">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Cadastrando...' : 'Cadastrar Serviço'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ServiceForm;
