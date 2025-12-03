import React, { useState, useEffect } from 'react';
import logger from '../utils/logger';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';
import ContentLoader from '../components/ContentLoader';
import { useToast } from '../contexts/ToastContext';
import './UserManagement.css';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerList = await getCustomers();
      setCustomers(customerList);
    } catch (err) {
      logger.error(err);
      toast.error('Falha ao carregar clientes.');
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
        toast.success('Cliente excluído com sucesso!');
        await loadCustomers(); // Refresh list
      } catch (err) {
        logger.error(err);
        toast.error('Falha ao excluir cliente.');
      }
    }
  };

  return (
    <div className="user-management-container">
      <div className="page-header">
        <h1>Meus Clientes</h1>
        <button className="btn-primary" disabled>
          + Novo Cliente
        </button>
      </div>

      {loading ? (
        <ContentLoader type="table" rows={6} />
      ) : (

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
      )}
    </div>
  );
};

export default Customers;
