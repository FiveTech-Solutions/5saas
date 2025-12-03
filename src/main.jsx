import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { StateProvider } from './contexts/StateContext';
import { ToastProvider } from './contexts/ToastContext';
import ErrorBoundary from './components/ErrorBoundary';
import { initSentry } from './utils/sentry';
import './index.css';

// Initialize Sentry before rendering
initSentry();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <StateProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </StateProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);
