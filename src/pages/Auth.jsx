import { useState } from 'react';
import { supabase } from '../services/supabase';
import './Auth.css';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const handleAuth = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      let response;
      if (isSignUp) {
        response = await supabase.auth.signUp({ email, password });
        if (response.error) throw response.error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta.');
      } else {
        response = await supabase.auth.signInWithPassword({ email, password });
        if (response.error) throw response.error;
        // O login será detectado pelo listener no App.jsx, redirecionando o usuário.
      }
    } catch (error) {
      setError(error.message || 'Ocorreu um erro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1 className="auth-title">{isSignUp ? 'Criar Conta' : 'Login'}</h1>
        <p className="auth-subtitle">
          {isSignUp ? 'Junte-se a nós!' : 'Bem-vindo de volta!'}
        </p>
        <form onSubmit={handleAuth}>
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
    </div>
  );
};

export default Auth;
