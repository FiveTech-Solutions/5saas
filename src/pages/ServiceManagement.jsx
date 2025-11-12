import React from 'react';
import { Routes, Route, Outlet } from 'react-router-dom';
import ServiceList from './ServiceList';
import ServiceForm from './ServiceForm';

const ServiceManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<ServiceList />} />
      <Route path="cadastrar" element={<ServiceForm />} />
      {/* Add other routes like "editar/:id" if needed in the future */}
    </Routes>
  );
};

export default ServiceManagement;
