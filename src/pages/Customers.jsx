import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';
// Re-using styles from UserManagement for consistency
import './UserManagement.css'; 

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (err) {
      setError('Falha ao carregar clientes.');
      logger.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleDelete = async (customerId) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
      try {
        await deleteCustomer(customerId);
        await loadCustomers(); // Refresh list
      } catch (err) {
        setError('Falha ao excluir cliente.');
        logger.error(err);
      }
    }
  };

  if (loading) {
    return <div>Carregando clientes...</div>;
  }

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>Meus Clientes</h1>
        <button className="btn-primary" disabled>
          + Novo Cliente
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="user-table-container">
        <table className="user-table">
          <thead>
            <tr>
              <th>Razão Social</th>
              <th>CPF/CNPJ</th>
              <th>Email</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(customer => (
              <tr key={customer.id}>
                <td>{customer.razao_social}</td>
                <td>{customer.cpf_cnpj}</td>
                <td>{customer.email || 'N/A'}</td>
                <td>
                  <button className="btn-secondary btn-sm" style={{ marginRight: '8px' }} disabled>Editar</button>
                  <button className="btn-danger btn-sm" onClick={() => handleDelete(customer.id)}>Excluir</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && !loading && (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>Nenhum cliente cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;
