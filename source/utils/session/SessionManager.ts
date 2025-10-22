import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {SessionConfig, SessionMetadata, SessionMetrics} from "@utils/session/io/ISession";
import {Constants} from "@common/io/Constants";

const logger: pino.Logger = createLogger(module);

export class SessionManager
{
    /**
     * The singleton instance of the SessionManager class.
     * @private
     */
    private static instance: SessionManager;

    /**
     * A map that stores active sessions, keyed by session ID.
     * @private
     */
    private sessions: Map<string, SessionMetadata> = new Map();

    /**
     * A map that associates client identifiers with their corresponding session IDs.
     * @private
     */

    private clientSessions: Map<string, string> = new Map();

    /**
     * A reference to the interval timer responsible for cleaning up expired sessions.
     * @private
     */
    private cleanupInterval: NodeJS.Timeout | null = null;

    /**
     * An object that tracks various session-related metrics, including:
     * @private
     */

    private metrics: SessionMetrics = {
        totalCreated: 0,
        totalEnded: 0,
        totalExpired: 0,
        averageDuration: 0,
    };

    /**
     * The configuration settings for managing sessions,
     * @private
     */

    private config: SessionConfig;

    /**
     * Private constructor to enforce a Singleton pattern.
     * @param config - Optional session configuration. Uses defaults if not provided.
     */
    private constructor(config?: SessionConfig)
    {
        this.config = config || Constants.DEFAULT_CONFIG;
        this.startSessionCleanup();
    }

    /**
     * Gets the singleton instance of SessionManager.
     * @param config - Optional configuration for first-time initialization. Ignored on subsequent calls.
     * @returns {SessionManager} The single instance of SessionManager.
     */
    public static getInstance(config?: SessionConfig): SessionManager
    {
        if (!SessionManager.instance)
        {
            SessionManager.instance = new SessionManager(config);
        }

        return SessionManager.instance;
    }

    /**
     * Creates a new session and registers it.
     */
    public createSession(sessionId: string, metadata: SessionMetadata): SessionMetadata
    {
        this.sessions.set(sessionId, metadata);
        this.metrics.totalCreated++;
        logger.info(`[SessionManager] Session created: ${sessionId}`);
        return metadata;
    }

    /**
     * Retrieves an existing session by ID.
     */
    public getSession(sessionId: string): SessionMetadata | undefined
    {
        return this.sessions.get(sessionId);
    }

    /**
     * Updates the last activity timestamp for a session.
     */
    public updateLastActivity(sessionId: string): void
    {
        const session: SessionMetadata = this.sessions.get(sessionId);

        if (session)
        {
            session.lastActivity = Date.now();
        }
    }

    /**
     * Checks if a session exists and is still valid (not expired).
     */
    public isSessionValid(sessionId: string): boolean
    {
        const session: SessionMetadata = this.sessions.get(sessionId);

        if (!session)
        {
            return false
        }

        return session.expiresAt > Date.now();
    }

    /**
     * Ends a session and cleans up associated mappings.
     */
    public endSession(sessionId: string): boolean
    {
        const metadata: SessionMetadata = this.sessions.get(sessionId);

        if (!metadata)
        {
            logger.warn("[SessionManager] Attempt to end non-existent session", { sessionId });
            return false;
        }

        this.sessions.delete(sessionId);

        if (metadata.clientIdentifier)
        {
            this.clientSessions.delete(metadata.clientIdentifier);
        }

        this.metrics.totalEnded++;
        logger.info(`[SessionManager] Session ended: ${sessionId}`);
        return true;
    }

    /**
     * Starts the periodic cleanup interval.
     */
    private startSessionCleanup(): void
    {
        if (this.cleanupInterval)
        {
            return;
        }

        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.config.CLEANUP_INTERVAL);

        logger.info("[SessionManager] Cleanup interval started", {
            intervalMinutes: this.config.CLEANUP_INTERVAL / 60000,
        });
    }

    /**
     * Performs the cleanup cycle, removing expired sessions.
     */
    private performCleanup(): void
    {
        const now: number = Date.now();
        let cleanedCount: number = 0;
        let warningCount: number = 0;

        for (const [sessionId, metadata] of this.sessions.entries())
        {
            const timeUntilExpiry: number = metadata.expiresAt - now;

            if (timeUntilExpiry < 0)
            {
                this.sessions.delete(sessionId);
                if (metadata.clientIdentifier)
                {
                    this.clientSessions.delete(metadata.clientIdentifier);
                }
                cleanedCount++;
                this.metrics.totalExpired++;
            }
            else if (this.config.WARNING_THRESHOLD && timeUntilExpiry < this.config.WARNING_THRESHOLD)
            {
                warningCount++;
            }
        }

        if (cleanedCount > 0 || warningCount > 0)
        {
            logger.info("[SessionManager] Cleanup cycle complete", {
                cleanedSessions: cleanedCount,
                expiringSoonCount: warningCount,
                activeSessions: this.sessions.size,
                activeClients: this.clientSessions.size,
                metrics: this.metrics,
            });
        }
    }

    /**
     * Stops the cleanup interval and clears all sessions.
     */
    public destroy(): void
    {
        if (this.cleanupInterval)
        {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.sessions.clear();
        this.clientSessions.clear();
        logger.info("[SessionManager] Destroyed - all sessions cleared");
    }
}
