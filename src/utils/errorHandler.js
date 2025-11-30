import logger from './logger';

/**
 * Custom Error class to handle application-specific errors with more context.
 */
export class AppError extends Error {
    constructor(message, code = 'UNKNOWN_ERROR', originalError = null, context = {}) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.originalError = originalError;
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

/**
 * Helper function to handle errors in services consistently.
 * Logs the error and rethrows it as an AppError if it isn't one already.
 * 
 * @param {Error} error - The original error caught in the service
 * @param {string} contextName - The name of the service/function where the error occurred
 * @param {string} defaultMessage - A user-friendly message to show if the error is generic
 */
export const handleServiceError = (error, contextName, defaultMessage = 'Ocorreu um erro inesperado.') => {
    // Log the original error with full context
    logger.setContext(contextName).error(defaultMessage, error);

    // If it's already an AppError, just rethrow it
    if (error instanceof AppError) {
        throw error;
    }

    // If it's a Supabase error (usually has a 'code' and 'message')
    if (error.code && error.message && !error.name) {
        throw new AppError(error.message, error.code, error, { source: 'Supabase' });
    }

    // Otherwise, wrap it in an AppError
    throw new AppError(defaultMessage, 'SERVICE_ERROR', error);
};

/**
 * Formats an error for display to the user.
 * @param {Error} error 
 * @returns {string} User-friendly error message
 */
export const getErrorMessage = (error) => {
    if (error instanceof AppError) {
        return error.message;
    }
    return error.message || 'Ocorreu um erro desconhecido.';
};
