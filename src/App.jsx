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
import './App.css';

function App() {
  const { session, profile } = useAuth();

  // A simple router wrapper for protected routes
  const ProtectedRoutes = () => (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/nfse/new" element={<NewNFSe />} />
        <Route path="/nfse/:id" element={<NFSeDetails />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/empresa/configuracoes" element={<CompanySettings />} />
        <Route path="/clientes" element={<Customers />} />
        
        {/* Admin Route */}
        <Route 
          path="/admin/usuarios" 
          element={profile?.role === 'admin' ? <UserManagement /> : <Navigate to="/" />}
        />

        {/* Redirect any other path to home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Route>
    </Routes>
  );

  return (
    <Router>
      {session ? <ProtectedRoutes /> : <Auth />}
    </Router>
  );
}

export default App;
