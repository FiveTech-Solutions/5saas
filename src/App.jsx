import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Header from './components/Header';
import Home from './pages/Home';
import NewNFSe from './pages/NewNFSe';
import NFSeDetails from './pages/NFSeDetails';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import Admin from './pages/Admin'; // <-- Import Admin page
import './App.css';

function App() {
  const { session, profile } = useAuth();

  return (
    <div className="app">
      {session ? (
        <Router>
          <Header />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nfse/new" element={<NewNFSe />} />
              <Route path="/nfse/:id" element={<NFSeDetails />} />
              <Route path="/settings" element={<Settings />} />
              {/* Admin Route */}
              <Route 
                path="/admin" 
                element={profile?.role === 'admin' ? <Admin /> : <Navigate to="/" />}
              />
            </Routes>
          </main>
        </Router>
      ) : (
        <Auth />
      )}
    </div>
  );
}

export default App;
