import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './layouts/MainLayout'; // Import the new layout
import Home from './pages/Home';
import NewNFSe from './pages/NewNFSe';
import NFSeDetails from './pages/NFSeDetails';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import CompanySettings from './pages/CompanySettings'; // Import new page
import UserManagement from './pages/UserManagement'; // Import new page
import Customers from './pages/Customers'; // Import new page
import ServicosTomados from './pages/ServicosTomados';
import Desif from './pages/Desif';
import AdminParametros from './pages/AdminParametros';
import AuditoriaSimplesNacional from './pages/AuditoriaSimplesNacional';
import AuditoriaAutosInfracao from './pages/AuditoriaAutosInfracao';
import DividaAtiva from './pages/DividaAtiva';
import MinhasNFSe from './pages/MinhasNFSe';
import ServiceManagement from './pages/ServiceManagement'; // Import new page
import AdminTools from './components/AdminTools'; // Temporário para atualizar usuário
import './App.css';

// Componente para proteger rotas que exigem apenas autenticação
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth" replace />;
};

// Componente para proteger rotas baseadas em perfil (role)
const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user?.user_role)) {
    // Redireciona para a home se não tiver a permissão
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { loading } = useAuth();

  // Mostrar loading enquanto verifica autenticação
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Carregando...
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Rota pública de autenticação */}
        <Route path="/auth" element={<Auth />} />
        
        {/* Rota temporária de admin */}
        <Route path="/update-user" element={<AdminTools />} />

        {/* Agrupamento de rotas protegidas que usam o MainLayout */}
        <Route 
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Rotas para todos os usuários autenticados */}
          <Route path="/" element={<Home />} />
          <Route path="/nfse" element={<MinhasNFSe />} />
          <Route path="/nfse/new" element={<NewNFSe />} />
          <Route path="/nfse/:id" element={<NFSeDetails />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/empresa/configuracoes" element={<CompanySettings />} />
          <Route path="/clientes" element={<Customers />} />
          <Route path="/servicos-tomados" element={<ServicosTomados />} />
          <Route path="/servicos/*" element={<ServiceManagement />} /> {/* New Service Management Route */}
          <Route path="/des-if" element={<Desif />} />

          {/* Rotas com permissões específicas */}
          <Route 
            path="/admin/users"
            element={
              <RoleProtectedRoute allowedRoles={['administrador']}>
                <UserManagement />
              </RoleProtectedRoute>
            }
          />
          <Route 
            path="/admin/parametros"
            element={
              <RoleProtectedRoute allowedRoles={['administrador']}>
                <AdminParametros />
              </RoleProtectedRoute>
            }
          />
          <Route 
            path="/auditoria/simples-nacional"
            element={
              <RoleProtectedRoute allowedRoles={['administrador', 'auditor']}>
                <AuditoriaSimplesNacional />
              </RoleProtectedRoute>
            }
          />
          <Route 
            path="/auditoria/autos-infracao"
            element={
              <RoleProtectedRoute allowedRoles={['administrador', 'auditor']}>
                <AuditoriaAutosInfracao />
              </RoleProtectedRoute>
            }
          />
          <Route 
            path="/divida-ativa"
            element={
              <RoleProtectedRoute allowedRoles={['administrador', 'auditor']}>
                <DividaAtiva />
              </RoleProtectedRoute>
            }
          />
        </Route>

        {/* Redirecionamento para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
