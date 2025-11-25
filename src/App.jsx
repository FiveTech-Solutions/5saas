import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import NewNFSe from './pages/NewNFSe';
import NFSeDetails from './pages/NFSeDetails';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import CompanySettings from './pages/CompanySettings';
import UserManagement from './pages/UserManagement';
import Customers from './pages/Customers';
import ServicosTomados from './pages/ServicosTomados';
import Desif from './pages/Desif';
import AdminParametros from './pages/AdminParametros';
import AuditoriaSimplesNacional from './pages/AuditoriaSimplesNacional';
import AuditoriaAutosInfracao from './pages/AuditoriaAutosInfracao';
import DividaAtiva from './pages/DividaAtiva';
import MinhasNFSe from './pages/MinhasNFSe';
import ServiceManagement from './pages/ServiceManagement';
import Sales from './pages/pdv/Sales';
import Cashier from './pages/pdv/Cashier';
import PDVSettings from './pages/pdv/Settings';
import NFeList from './pages/nfe/NFeList';
import NFeForm from './pages/nfe/NFeForm';
import NFCeList from './pages/nfce/NFCeList';
import NFCeForm from './pages/nfce/NFCeForm';
import Insights from './pages/ai/Insights';
import ProductList from './pages/ProductList';
import CategoryList from './pages/CategoryList';
import CategoryForm from './pages/CategoryForm';

// A generic protected route that just checks for authentication.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Protects routes based on user role (e.g., 'admin').
const RoleProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  // Using the new `isAdmin` flag or checking the role directly.
  if (user?.role !== role) {
    return <Navigate to="/" replace />; // Redirect if role doesn't match.
  }

  return children;
};

// Protects routes based on subscription features (e.g., 'NFE').
const FeatureProtectedRoute = ({ feature, children }) => {
  const { isAuthenticated, features } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!features.includes(feature)) {
    // Optional: Redirect to an "upgrade plan" page in the future.
    // For now, redirect to home.
    return <Navigate to="/" replace />;
  }

  return children;
};


function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontSize: '18px' }}>
        Carregando sistema...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public authentication route */}
        <Route path="/auth" element={<Auth />} />

        {/* Protected routes using the MainLayout */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Routes available to all authenticated users */}
          <Route index element={<Home />} />
          <Route path="settings" element={<Settings />} />
          <Route path="clientes" element={<Customers />} />

          {/* NFS-e Routes (Basic Plan) */}
          <Route path="nfse" element={<FeatureProtectedRoute feature="NFSE"><MinhasNFSe /></FeatureProtectedRoute>} />
          <Route path="nfse/new" element={<FeatureProtectedRoute feature="NFSE"><NewNFSe /></FeatureProtectedRoute>} />
          <Route path="nfse/:id" element={<FeatureProtectedRoute feature="NFSE"><NFSeDetails /></FeatureProtectedRoute>} />
          <Route path="servicos-tomados" element={<FeatureProtectedRoute feature="NFSE"><ServicosTomados /></FeatureProtectedRoute>} />
          <Route path="des-if" element={<FeatureProtectedRoute feature="NFSE"><Desif /></FeatureProtectedRoute>} />

          {/* NF-e / NFC-e Routes (Standard Plan) */}
          <Route
            path="servicos/*"
            element={<FeatureProtectedRoute feature="NFE"><ServiceManagement /></FeatureProtectedRoute>}
          />

          {/* PDV Routes */}
          <Route path="pdv/vendas" element={<Sales />} />
          <Route path="pdv/caixa" element={<Cashier />} />
          <Route path="pdv/configuracao" element={<PDVSettings />} />

          {/* NF-e Routes */}
          <Route path="nfe" element={<FeatureProtectedRoute feature="NFE"><NFeList /></FeatureProtectedRoute>} />
          <Route path="nfe/new" element={<FeatureProtectedRoute feature="NFE"><NFeForm /></FeatureProtectedRoute>} />
          {/* Product Routes */}
          <Route path="produtos" element={<ProductList />} />
          <Route path="produtos/novo" element={<ProductForm />} />
          <Route path="produtos/editar/:id" element={<ProductForm />} />
          {/* Category Routes (admin only) */}
          <Route path="categorias" element={<RoleProtectedRoute role="admin"><CategoryList /></RoleProtectedRoute>} />
          <Route path="categorias/novo" element={<RoleProtectedRoute role="admin"><CategoryForm /></RoleProtectedRoute>} />
          <Route path="categorias/editar/:id" element={<RoleProtectedRoute role="admin"><CategoryForm /></RoleProtectedRoute>} />
          {/* NFC-e Routes */}
          <Route path="nfce" element={<FeatureProtectedRoute feature="NFCE"><NFCeList /></FeatureProtectedRoute>} />
          <Route path="nfce/new" element={<FeatureProtectedRoute feature="NFCE"><NFCeForm /></FeatureProtectedRoute>} />

          {/* Admin Routes (Role-based) */}
          <Route
            path="admin/users"
            element={<RoleProtectedRoute role="admin"><UserManagement /></RoleProtectedRoute>}
          />
          <Route
            path="admin/parametros"
            element={<RoleProtectedRoute role="admin"><AdminParametros /></RoleProtectedRoute>}
          />
          <Route
            path="empresa/configuracoes"
            element={<RoleProtectedRoute role="admin"><CompanySettings /></RoleProtectedRoute>}
          />

          {/* AI / Premium Routes (Feature-based) */}
          <Route
            path="auditoria/simples-nacional"
            element={<FeatureProtectedRoute feature="AI_TOOLS"><AuditoriaSimplesNacional /></FeatureProtectedRoute>}
          />
          <Route
            path="auditoria/autos-infracao"
            element={<FeatureProtectedRoute feature="AI_TOOLS"><AuditoriaAutosInfracao /></FeatureProtectedRoute>}
          />
          <Route
            path="divida-ativa"
            element={<FeatureProtectedRoute feature="AI_TOOLS"><DividaAtiva /></FeatureProtectedRoute>}
          />
          <Route
            path="ai/insights"
            element={<FeatureProtectedRoute feature="AI_TOOLS"><Insights /></FeatureProtectedRoute>}
          />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;