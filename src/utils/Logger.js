/**
 * Logger — Structured logging utility for Spatial UI 3D.
 * Replaces raw console.log with configurable log levels.
 *
 * Usage:
 *   import { logger } from '../utils/Logger.js';
 *   logger.debug('Overlay created', id);
 *   logger.warn('Missing renderer');
 *   Logger.setLevel('debug'); // Show all logs
 *
 * @module Logger
 */

/** Log level constants */
const LEVELS = Object.freeze({
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
});

export class Logger {
    /**
     * @param {string} prefix - Prefix tag for log messages
     * @param {number} level - Log verbosity (LEVELS enum)
     */
    constructor(prefix = 'SpatialUI', level = LEVELS.WARN) {
        this.prefix = prefix;
        this.level = level;
    }

    /** Set global log level. Accepts 'error' | 'warn' | 'info' | 'debug' */
    static setLevel(levelName) {
        const key = String(levelName).toUpperCase();
        if (LEVELS[key] !== undefined) {
            _singletonLevel = LEVELS[key];
            logger.level = _singletonLevel;
        }
    }

    /** @returns {string} Current level name */
    static getLevel() {
        return Object.keys(LEVELS).find(k => LEVELS[k] === _singletonLevel) || 'WARN';
    }

    error(...args) {
        if (this.level >= LEVELS.ERROR) console.error(`[${this.prefix}]`, ...args);
    }

    warn(...args) {
        if (this.level >= LEVELS.WARN) console.warn(`[${this.prefix}]`, ...args);
    }

    info(...args) {
        if (this.level >= LEVELS.INFO) console.info(`[${this.prefix}]`, ...args);
    }

    debug(...args) {
        if (this.level >= LEVELS.DEBUG) console.log(`[${this.prefix}]`, ...args);
    }
}

/** @type {Logger} Singleton logger instance */
let _singletonLevel = LEVELS.WARN;
export const logger = new Logger('SpatialUI', _singletonLevel);
