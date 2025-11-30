import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, signup } from '../services/userService';
import { useAuth } from '../contexts/AuthContext';
import CookieConsent from '../components/CookieConsent';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
import logger from '../utils/logger';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isPolicyModalOpen, setPolicyModalOpen] = useState(false);

  const navigate = useNavigate();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      logger.debug('User already authenticated, redirecting to home');
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let result;
      if (isSignUp) {
        result = await signup(name, email, password, companyName);
      } else {
        result = await login(email, password);
      }

      if (result && result.user) {
        setTimeout(() => navigate('/'), 100);
      } else {
        setError('Não foi possível autenticar. Verifique os dados ou tente novamente.');
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      setError(error.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const openPolicyModal = () => setPolicyModalOpen(true);
  const closePolicyModal = () => setPolicyModalOpen(false);

  if (authLoading) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div>Verificando autenticação...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{isSignUp ? 'Criar Conta' : 'Five-SaaS Login'}</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Junte-se a nós!' : 'Bem-vindo de volta!'}
        </p>

        <form onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div className="input-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  required
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="input-group">
                <label htmlFor="company_name">Nome da Empresa</label>
                <input
                  id="company_name"
                  type="text"
                  placeholder="Nome da sua empresa"
                  value={companyName}
                  required
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              required
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              required
              minLength={6}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="auth-error">
              ⚠️ {error}
            </div>
          )}

          {message && (
            <div className="auth-message">
              ✅ {message}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary auth-button"
            disabled={loading}
          >
            {loading ? (
              <span className="loading-text">
                {isSignUp ? 'Criando conta...' : 'Entrando...'}
              </span>
            ) : (
              isSignUp ? 'Criar Conta' : 'Entrar'
            )}
          </button>
        </form>

        <div className="auth-toggle">
          {isSignUp ? (
            <p>
              Já tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(false);
                  setError(null);
                  setMessage(null);
                }}
                className="link-button"
              >
                Fazer Login
              </button>
            </p>
          ) : (
            <p>
              Não tem uma conta?{' '}
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(true);
                  setError(null);
                  setMessage(null);
                }}
                className="link-button"
              >
                Criar Conta
              </button>
            </p>
          )}
        </div>

        <div className="auth-footer">
          <button onClick={openPolicyModal} className="link-button">
            Política de Privacidade
          </button>
        </div>
      </div>

      <CookieConsent />

      {isPolicyModalOpen && (
        <PrivacyPolicyModal onClose={closePolicyModal} />
      )}
    </div>
  );
};

export default Auth;
