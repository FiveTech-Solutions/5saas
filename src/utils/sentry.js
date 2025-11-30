import * as Sentry from '@sentry/react';
import logger from './logger';

/**
 * Inicializa o Sentry para rastreamento de erros
 * 
 * IMPORTANTE: Para usar em produção, você precisa:
 * 1. Criar uma conta em https://sentry.io
 * 2. Criar um novo projeto React
 * 3. Copiar o DSN fornecido
 * 4. Adicionar VITE_SENTRY_DSN ao arquivo .env
 */
export const initSentry = () => {
    const dsn = import.meta.env.VITE_SENTRY_DSN;
    const environment = import.meta.env.MODE || 'development';

    // Apenas inicializa se houver DSN configurado e não estiver em desenvolvimento
    if (dsn && environment !== 'development') {
        Sentry.init({
            dsn,
            environment,
            // Performance Monitoring
            tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

            beforeSend(event, hint) {
                // Filtra erros conhecidos ou não críticos
                const error = hint.originalException;

                if (error && typeof error === 'object') {
                    // Ignora erros de rede temporários
                    if (error.message?.includes('Network Error')) {
                        return null;
                    }

                    // Ignora erros de cancelamento de requisições
                    if (error.message?.includes('canceled')) {
                        return null;
                    }
                }

                return event;
            },
        });

        logger.info('Sentry initialized for environment:', environment);
    } else {
        logger.debug('Sentry not initialized (development mode or missing DSN)');
    }
};

/**
 * Captura um erro manualmente no Sentry
 */
export const captureError = (error, context = {}) => {
    if (import.meta.env.MODE !== 'development') {
        Sentry.captureException(error, {
            extra: context,
        });
    }
    logger.error('Error captured:', error, context);
};

/**
 * Define informações do usuário no Sentry
 */
export const setUser = (user) => {
    if (import.meta.env.MODE !== 'development') {
        Sentry.setUser({
            id: user?.id,
            email: user?.email,
            username: user?.email?.split('@')[0],
        });
    }
};

/**
 * Limpa informações do usuário (logout)
 */
export const clearUser = () => {
    if (import.meta.env.MODE !== 'development') {
        Sentry.setUser(null);
    }
};

/**
 * Adiciona breadcrumb (rastro de navegação)
 */
export const addBreadcrumb = (message, category = 'custom', level = 'info') => {
    if (import.meta.env.MODE !== 'development') {
        Sentry.addBreadcrumb({
            message,
            category,
            level,
            timestamp: Date.now(),
        });
    }
};

export default {
    initSentry,
    captureError,
    setUser,
    clearUser,
    addBreadcrumb,
};
