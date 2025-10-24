"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionManager = void 0;
const Log_1 = require("../logger/Log");
const Constants_1 = require("../../common/io/Constants");
const logger = (0, Log_1.createLogger)(module);
class SessionManager {
    static instance;
    sessions = new Map();
    clientSessions = new Map();
    cleanupInterval = null;
    metrics = {
        totalCreated: 0,
        totalEnded: 0,
        totalExpired: 0,
        averageDuration: 0,
    };
    config;
    constructor(config) {
        this.config = config || Constants_1.Constants.DEFAULT_CONFIG;
        this.startSessionCleanup();
    }
    static getInstance(config) {
        if (!SessionManager.instance) {
            SessionManager.instance = new SessionManager(config);
        }
        return SessionManager.instance;
    }
    createSession(sessionId, metadata) {
        this.sessions.set(sessionId, metadata);
        this.metrics.totalCreated++;
        logger.info(`[SessionManager] Session created: ${sessionId}`);
        return metadata;
    }
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    updateLastActivity(sessionId) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivity = Date.now();
        }
    }
    isSessionValid(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        return session.expiresAt > Date.now();
    }
    endSession(sessionId) {
        const metadata = this.sessions.get(sessionId);
        if (!metadata) {
            logger.warn("[SessionManager] Attempt to end non-existent session", { sessionId });
            return false;
        }
        this.sessions.delete(sessionId);
        if (metadata.clientIdentifier) {
            this.clientSessions.delete(metadata.clientIdentifier);
        }
        this.metrics.totalEnded++;
        logger.info(`[SessionManager] Session ended: ${sessionId}`);
        return true;
    }
    startSessionCleanup() {
        if (this.cleanupInterval) {
            return;
        }
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.config.CLEANUP_INTERVAL);
        logger.info("[SessionManager] Cleanup interval started", {
            intervalMinutes: this.config.CLEANUP_INTERVAL / 60000,
        });
    }
    performCleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        let warningCount = 0;
        for (const [sessionId, metadata] of this.sessions.entries()) {
            const timeUntilExpiry = metadata.expiresAt - now;
            if (timeUntilExpiry < 0) {
                this.sessions.delete(sessionId);
                if (metadata.clientIdentifier) {
                    this.clientSessions.delete(metadata.clientIdentifier);
                }
                cleanedCount++;
                this.metrics.totalExpired++;
            }
            else if (this.config.WARNING_THRESHOLD && timeUntilExpiry < this.config.WARNING_THRESHOLD) {
                warningCount++;
            }
        }
        if (cleanedCount > 0 || warningCount > 0) {
            logger.info("[SessionManager] Cleanup cycle complete", {
                cleanedSessions: cleanedCount,
                expiringSoonCount: warningCount,
                activeSessions: this.sessions.size,
                activeClients: this.clientSessions.size,
                metrics: this.metrics,
            });
        }
    }
    destroy() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.sessions.clear();
        this.clientSessions.clear();
        logger.info("[SessionManager] Destroyed - all sessions cleared");
    }
}
exports.SessionManager = SessionManager;
//# sourceMappingURL=SessionManager.js.map