import React, { useState } from 'react';
import './CustomerSelector.css';

const CustomerSelector = ({ customers, onSelectCustomer, onAddNewCustomer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const filteredCustomers = searchTerm
    ? customers.filter(c =>
        c.razao_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cpf_cnpj.includes(searchTerm)
      )
    : customers;

  const handleSelect = (customer) => {
    onSelectCustomer(customer);
    setSearchTerm(customer.razao_social);
    setDropdownOpen(false);
  };

  return (
    <div className="customer-selector">
      <label>Selecionar Cliente</label>
      <div className="selector-input-wrapper">
        <input
          type="text"
          placeholder="Digite para buscar por nome ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setDropdownOpen(true)}
          onBlur={() => setTimeout(() => setDropdownOpen(false), 200)} // Delay to allow click
        />
        <button type="button" className="btn-add-new" onClick={onAddNewCustomer}>
          + Novo
        </button>
      </div>
      {isDropdownOpen && (
        <div className="selector-dropdown">
          {filteredCustomers.length > 0 ? (
            filteredCustomers.map(customer => (
              <div
                key={customer.id}
                className="dropdown-item"
                onClick={() => handleSelect(customer)}
              >
                <strong>{customer.razao_social}</strong>
                <span>{customer.cpf_cnpj}</span>
              </div>
            ))
          ) : (
            <div className="dropdown-item-empty">Nenhum cliente encontrado.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;
