import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { StateProvider } from './contexts/StateContext';
import './index.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <StateProvider>
        <App />
      </StateProvider>
    </AuthProvider>
  </StrictMode>
);
