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
import AdminTools from './components/AdminTools'; // Temporário para atualizar usuário
import './App.css';

function App() {
  const { isAuthenticated, user, loading } = useAuth();

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

  // A simple router wrapper for protected routes
  const ProtectedRoutes = () => (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/nfse" element={<MinhasNFSe />} />
        <Route path="/nfse/new" element={<NewNFSe />} />
        <Route path="/nfse/:id" element={<NFSeDetails />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/empresa/configuracoes" element={<CompanySettings />} />
        <Route path="/clientes" element={<Customers />} />
        <Route path="/servicos-tomados" element={<ServicosTomados />} />
        <Route path="/des-if" element={<Desif />} />
        <Route path="/divida-ativa" element={<DividaAtiva />} />
        
        {/* Admin Routes */}
        <Route
          path="/admin/company"
          element={user?.user_role === 'administrador' ? <CompanySettings /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/users"
          element={user?.user_role === 'administrador' ? <UserManagement /> : <Navigate to="/" />}
        />
        <Route
          path="/admin/parametros"
          element={user?.user_role === 'administrador' ? <AdminParametros /> : <Navigate to="/" />}
        />

        {/* Auditor Routes */}
        <Route
          path="/auditoria/simples-nacional"
          element={user?.user_role === 'auditor' ? <AuditoriaSimplesNacional /> : <Navigate to="/" />}
        />
        <Route
          path="/auditoria/autos-infracao"
          element={user?.user_role === 'auditor' ? <AuditoriaAutosInfracao /> : <Navigate to="/" />}
        />

        {/* Redirect any other path to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );

  return (
    <Router>
      {isAuthenticated ? <ProtectedRoutes /> : <Auth />}
    </Router>
  );
}

export default App;
