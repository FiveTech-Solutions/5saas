import { useState } from 'react';
import { login, signup } from '../services/userService';
import CookieConsent from '../components/CookieConsent';
import PrivacyPolicyModal from '../components/PrivacyPolicyModal';
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

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        await signup(name, email, password, companyName);
        setMessage('Cadastro realizado com sucesso! Você já pode fazer login.');
        setIsSignUp(false);
      } else {
        await login(email, password);
        // For manual auth, we need to force a reload or redirect to update the app state
        window.location.reload();
      }
    } catch (error) {
      setError(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  const openPolicyModal = () => setPolicyModalOpen(true);
  const closePolicyModal = () => setPolicyModalOpen(false);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{isSignUp ? 'Criar Conta' : 'Login'}</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Junte-se a nós!' : 'Bem-vindo de volta!'}
        </p>
        <form onSubmit={handleAuth}>
          {isSignUp && (
            <>
              <div className="input-group">
                <label htmlFor="name">Nome</label>
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
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary auth-button" disabled={loading}>
            {loading ? 'Carregando...' : (isSignUp ? 'Cadastrar' : 'Entrar')}
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}
        <div className="auth-toggle">
          <p>
            {isSignUp ? 'Já tem uma conta?' : 'Não tem uma conta?'}
            <button
              className="toggle-button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp ? 'Faça Login' : 'Cadastre-se'}
            </button>
          </p>
        </div>
      </div>
      <CookieConsent onPolicyClick={openPolicyModal} />
      {isPolicyModalOpen && <PrivacyPolicyModal onClose={closePolicyModal} />}
    </div>
  );
};

export default Auth;
