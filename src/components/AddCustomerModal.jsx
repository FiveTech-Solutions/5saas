import React, { useState } from 'react';
import { createCustomer } from '../services/customerService';
import { getAddressFromCEP } from '../services/viaCepService';
// Re-using modal styles from UserManagement
import '../pages/UserManagement.css'; 

const AddCustomerModal = ({ isOpen, onClose, onCustomerCreated }) => {
  const [formData, setFormData] = useState({
    razao_social: '',
    cpf_cnpj: '',
    email: '',
    endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' },
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (path, value) => {
    const keys = path.split('.');
    if (keys.length > 1) {
      setFormData(prev => ({
        ...prev,
        [keys[0]]: { ...prev[keys[0]], [keys[1]]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [path]: value }));
    }
  };

  const handleCepBlur = async (cep) => {
    const address = await getAddressFromCEP(cep);
    if (address) {
      setFormData(prev => ({
        ...prev,
        endereco: {
          ...prev.endereco,
          cep: address.cep,
          logradouro: address.logradouro,
          bairro: address.bairro,
          cidade: address.localidade,
          estado: address.uf,
        },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const newCustomer = await createCustomer(formData);
      onCustomerCreated(newCustomer);
      onClose();
      // Reset form for next time
      setFormData({ razao_social: '', cpf_cnpj: '', email: '', endereco: { cep: '', logradouro: '', numero: '', bairro: '', cidade: '', estado: '' } });
    } catch (err) {
      setError(err.message || 'Falha ao criar cliente.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Adicionar Novo Cliente</h2>
        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>CPF/CNPJ</label>
            <input type="text" value={formData.cpf_cnpj} onChange={e => handleInputChange('cpf_cnpj', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Razão Social / Nome</label>
            <input type="text" value={formData.razao_social} onChange={e => handleInputChange('razao_social', e.target.value)} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} />
          </div>
          {/* Simplified address fields for quick add */}
          <div className="form-group">
            <label>CEP</label>
            <input type="text" value={formData.endereco.cep} onChange={e => handleInputChange('endereco.cep', e.target.value)} onBlur={e => handleCepBlur(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Logradouro</label>
            <input type="text" value={formData.endereco.logradouro} onChange={e => handleInputChange('endereco.logradouro', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Número</label>
            <input type="text" value={formData.endereco.numero} onChange={e => handleInputChange('endereco.numero', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Bairro</label>
            <input type="text" value={formData.endereco.bairro} onChange={e => handleInputChange('endereco.bairro', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Cidade</label>
            <input type="text" value={formData.endereco.cidade} onChange={e => handleInputChange('endereco.cidade', e.target.value)} />
          </div>
          <div className="form-group">
            <label>Estado</label>
            <input type="text" value={formData.endereco.estado} onChange={e => handleInputChange('endereco.estado', e.target.value)} />
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar Cliente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCustomerModal;
