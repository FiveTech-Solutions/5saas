/**
 * Professional logging utility
 * Logs only appear in development mode
 * In production, only errors are logged to help with debugging
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

class Logger {
    constructor() {
        this.context = '';
    }

    setContext(context) {
        this.context = context;
        return this;
    }

    debug(...args) {
        if (isDev) {
            console.log(`[DEBUG]${this.context ? ` [${this.context}]` : ''}`, ...args);
        }
    }

    info(...args) {
        if (isDev) {
            console.info(`[INFO]${this.context ? ` [${this.context}]` : ''}`, ...args);
        }
    }

    warn(...args) {
        console.warn(`[WARN]${this.context ? ` [${this.context}]` : ''}`, ...args);
    }

    error(...args) {
        console.error(`[ERROR]${this.context ? ` [${this.context}]` : ''}`, ...args);

        if (isProd) {
            // TODO: Send to error tracking service (Sentry, etc.)
        }
    }

    group(label) {
        if (isDev) {
            console.group(label);
        }
    }

    groupEnd() {
        if (isDev) {
            console.groupEnd();
        }
    }

    table(data) {
        if (isDev) {
            console.table(data);
        }
    }
}

export const logger = new Logger();

export default logger;
