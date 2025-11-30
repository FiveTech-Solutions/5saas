import logger from './logger';

/**
 * SecureStorage utility for handling sensitive data like auth tokens.
 * Uses sessionStorage by default to ensure data is cleared when the session ends (tab closed).
 * Also adds a layer of abstraction to easily switch storage strategies or add encryption later.
 */
class SecureStorage {
    constructor() {
        this.storage = window.sessionStorage; // Default to sessionStorage for better security
        this.prefix = '5saas_';
    }

    /**
     * Set an item in storage with optional expiration
     * @param {string} key - The key to store
     * @param {any} value - The value to store
     * @param {number} [expiresInMinutes] - Optional expiration time in minutes
     */
    setItem(key, value, expiresInMinutes = null) {
        try {
            const item = {
                value,
                timestamp: Date.now(),
            };

            if (expiresInMinutes) {
                item.expiresAt = Date.now() + expiresInMinutes * 60 * 1000;
            }

            this.storage.setItem(this.prefix + key, JSON.stringify(item));
        } catch (error) {
            logger.error('Error setting item in SecureStorage:', error);
        }
    }

    /**
     * Get an item from storage, checking for expiration
     * @param {string} key - The key to retrieve
     * @returns {any|null} - The stored value or null if not found/expired
     */
    getItem(key) {
        try {
            const itemStr = this.storage.getItem(this.prefix + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);

            // Check expiration
            if (item.expiresAt && Date.now() > item.expiresAt) {
                this.removeItem(key);
                logger.debug(`Item ${key} expired and was removed from storage`);
                return null;
            }

            return item.value;
        } catch (error) {
            logger.error('Error getting item from SecureStorage:', error);
            return null;
        }
    }

    /**
     * Remove an item from storage
     * @param {string} key - The key to remove
     */
    removeItem(key) {
        try {
            this.storage.removeItem(this.prefix + key);
        } catch (error) {
            logger.error('Error removing item from SecureStorage:', error);
        }
    }

    /**
     * Clear all items with the application prefix
     */
    clear() {
        try {
            // Only clear items belonging to this app
            Object.keys(this.storage).forEach(key => {
                if (key.startsWith(this.prefix)) {
                    this.storage.removeItem(key);
                }
            });
            logger.info('SecureStorage cleared');
        } catch (error) {
            logger.error('Error clearing SecureStorage:', error);
        }
    }
}

export const secureStorage = new SecureStorage();
export default secureStorage;
