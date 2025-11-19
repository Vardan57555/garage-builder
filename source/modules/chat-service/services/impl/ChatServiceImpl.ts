import { ServerError } from "@errors/ServerError";
import { IAiAnswer } from "@common/io/IAiAgent";
import { LeadAgent } from "@agents/LeadAgent";
import { v4 as uuidv4 } from "uuid";
import { ChatService } from "@modules/chat-service/services/ChatService";
import { InstantiationError } from "@errors/InstantiationError";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {SessionMetadata, SessionMetrics} from "@modules/chat-service/routes/io/IChat";
import {Constants} from "@common/io/Constants";

const logger: pino.Logger = createLogger(module);

export class ChatServiceImpl implements ChatService
{
    /**
     * The singleton instance of `PriceService`.
     * @private
     */

    public static instance: ChatService;

    private sessionMetadata: Map<string, SessionMetadata> = new Map();
    private clientSessions: Map<string, string> = new Map();

    /**
     * ✅ NEW: Track which sessions are currently processing requests
     * Prevents concurrent requests on the same session
     * @private
     */

    private requestLocks: Map<string, { locked: boolean; timestamp: number; timeout: NodeJS.Timeout }> = new Map();

    private cleanupInterval: NodeJS.Timeout | null = null;
    private metrics: SessionMetrics = {
        totalCreated: 0,
        totalEnded: 0,
        totalExpired: 0,
        averageDuration: 0,
    };

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use ChatService.getInstance() instead of new.");
        }

        this.startSessionCleanup();
        this.startLockCleanup();
    }

    /**
     * Gets the singleton instance of PriceService.
     *
     * @returns The singleton instance of PriceService.
     */

    public static getInstance(): ChatService
    {
        if (!ChatServiceImpl.instance)
        {
            ChatServiceImpl.instance = new ChatServiceImpl(Enforce);
        }

        return ChatServiceImpl.instance;
    }

    /**
     * ✅ NEW: Acquires a lock for a session
     * Prevents concurrent requests on the same session
     *
     * @param sessionId - The session to lock
     * @returns {boolean} true if lock acquired, false if already locked
     */

    private acquireLock(sessionId: string): boolean
    {
        const lockInfo = this.requestLocks.get(sessionId);

        if (lockInfo && lockInfo.locked)
        {
            logger.warn(`[ChatService] Session already processing ${sessionId}`);
            return false;
        }

        if (lockInfo?.timeout)
        {
            clearTimeout(lockInfo.timeout);
        }

        const autoReleaseTimeout = setTimeout(() => {
            logger.warn(`[ChatService] Lock auto-released due to timeout ${sessionId}`);
            this.releaseLock(sessionId);
        }, 90000);

        this.requestLocks.set(sessionId, {
            locked: true,
            timestamp: Date.now(),
            timeout: autoReleaseTimeout
        });

        logger.info(`[ChatService] Lock acquired ${sessionId}`);
        return true;
    }

    /**
     * ✅ NEW: Releases a lock for a session
     *
     * @param sessionId - The session to unlock
     */

    private releaseLock(sessionId: string): void
    {
        const lockInfo = this.requestLocks.get(sessionId);

        if (lockInfo)
        {
            clearTimeout(lockInfo.timeout);
            this.requestLocks.delete(sessionId);
            logger.info(`[ChatService] Lock released ${sessionId}`);
        }
    }

    /**
     * ✅ NEW: Cleanup stale locks every 2 minutes
     * Removes locks that have been held for too long
     */

    private startLockCleanup(): void
    {
        setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [sessionId, lockInfo] of this.requestLocks.entries())
            {
                if (now - lockInfo.timestamp > 120000)
                {
                    logger.warn(`[ChatService] Force releasing stale lock ${sessionId}`);
                    this.releaseLock(sessionId);
                    cleanedCount++;
                }
            }

            if (cleanedCount > 0)
            {
                logger.info(`[ChatService] Lock cleanup complete ${cleanedCount}`);
            }
        }, 120000);
    }

    /**
     * @param body - The request body containing the user's input question.
     * @param clientIp - The client's IP address, used for session identification.
     * @param userAgent - The client's user-agent string, used for generating a unique session key.
     * @returns {Promise<IAiAnswer>} A promise resolving to the AI-generated answer, session ID, and timestamp.
     * @throws {ServerError.INTERNAL} If the input is invalid, the agent fails to initialize,
     * or the response generation process encounters an error.
     */

    public async generateAssistantResponse(body: Record<string, string>, clientIp: string, userAgent: string): Promise<IAiAnswer>
    {
        const { question, sessionId: clientProvidedSessionId } = body;

        if (!question || question.trim().length === 0)
        {
            throw new ServerError(ServerError.INTERNAL, "Question is required");
        }

        /**
         * ✅ KEY FIX: If client provides a sessionId, use it directly
         * This ensures each browser tab uses its own backend session
         */
        let sessionId: string;

        if (clientProvidedSessionId && this.sessionMetadata.has(clientProvidedSessionId))
        {
            sessionId = clientProvidedSessionId;
            logger.info(`[ChatService] Using client-provided sessionId: ${sessionId}`);
        }
        else if (clientProvidedSessionId)
        {
            // Client provided an expired session ID - create new one
            sessionId = uuidv4();
            logger.info(`[ChatService] Client session expired, creating new: ${sessionId}`);
        }
        else
        {
            // First message from this browser tab - create new session
            sessionId = uuidv4();
            logger.info(`[ChatService] New session created: ${sessionId}`);
        }

        if (!this.acquireLock(sessionId))
        {
            throw new ServerError(
                ServerError.INTERNAL,
                `Session ${sessionId} is already processing a request. Please wait a moment and try again.`
            );
        }

        let pricingData;

        try
        {
            const agent: LeadAgent = await LeadAgent.getInstance();
            pricingData = await agent.run(sessionId, question);

            // Ensure session metadata exists
            if (!this.sessionMetadata.has(sessionId))
            {
                const metadata: SessionMetadata = {
                    sessionId: sessionId,
                    clientIdentifier: `tab_${sessionId}`, // ✅ Now tied to backend sessionId
                    createdAt: Date.now(),
                    lastActivity: Date.now(),
                    expiresAt: Date.now() + Constants.DEFAULT_CONFIG.SESSION_TIMEOUT,
                    ip: clientIp,
                    userAgent: userAgent,
                    lastIp: clientIp,
                    lastUserAgent: userAgent,
                    deviceFingerprint: this.generateFingerprint(clientIp, userAgent),
                    accessCount: 1
                };
                this.sessionMetadata.set(sessionId, metadata);
                this.metrics.totalCreated++;
            }
            else
            {
                // Update existing session
                const metadata = this.sessionMetadata.get(sessionId)!;
                metadata.lastActivity = Date.now();
                metadata.accessCount++;
            }

            return {
                answer: pricingData,
                sessionId: sessionId,
                timestamp: new Date().toISOString()
            };
        }
        catch (error)
        {
            logger.error(`[ChatService] Error processing request ${error.message}`);
            throw new ServerError(ServerError.INTERNAL, `Failed to process request: ${error.message}`);
        }
        finally
        {
            this.releaseLock(sessionId);
            logger.info(`[ChatService] Request completed and lock released ${sessionId}`);
        }
    }

    /**
     * @param sessionId - The unique identifier of the session to be ended.
     * @returns {Promise<{ success: boolean; message: string }>} A promise resolving to an object
     * indicating whether the session was successfully terminated, along with a descriptive message.
     * @throws {ServerError.INTERNAL} If the session does not exist, or if an error occurs during
     * the session termination process.
     */

    public async endSession(sessionId: string): Promise<{ success: boolean; message: string }>
    {
        const metadata: SessionMetadata = this.sessionMetadata.get(sessionId);

        if (!metadata)
        {
            logger.warn(`[ChatService] Attempt to end non-existent session ${sessionId}`)
            throw new ServerError(ServerError.INTERNAL, `Session ${sessionId} not found`);
        }

        try
        {
            const agent: LeadAgent = await LeadAgent.getInstance();
            await agent.endSession(sessionId);

            this.sessionMetadata.delete(sessionId);
            this.clientSessions.delete(metadata.clientIdentifier);
            this.requestLocks.delete(sessionId);
            this.metrics.totalEnded++;

            logger.info(`[ChatService] Session ended successfully ${sessionId}`);

            return {success: true, message: `Session ${sessionId} ended successfully`};
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to end session: ${error.message}`);
        }
    }

    /**
     * Generates a security fingerprint from IP and User-Agent
     */

    private generateFingerprint(ip: string, userAgent: string): string
    {
        const combined: string = `${ip}:${userAgent}`;
        let hash: number = 0;

        for (let i = 0; i < combined.length; i++)
        {
            const char: number = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return `fp-${Math.abs(hash)}`;
    }

    /**
     * This method ensures that only one cleanup interval is active at a time.
     * @returns {void}
     */

    private startSessionCleanup(): void
    {
        if (this.cleanupInterval)
        {
            return;
        }

        this.cleanupInterval = setInterval(() => {this.performCleanup();}, Constants.DEFAULT_CONFIG.CLEANUP_INTERVAL);

        logger.info(`[ChatService] Cleanup interval started ${Constants.DEFAULT_CONFIG.CLEANUP_INTERVAL / 60000}`);
    }

    /**
     * This method iterates through all tracked session metadata, removing sessions that have
     * passed their expiration time and updating relevant metrics.
     *
     * @returns {void}
     */

    private performCleanup(): void
    {
        const now: number = Date.now();
        let cleanedCount: number = 0;
        let warningCount: number = 0;

        for (const [sessionId, metadata] of this.sessionMetadata.entries())
        {
            const timeUntilExpiry: number = metadata.expiresAt - now;

            if (timeUntilExpiry < 0)
            {
                this.sessionMetadata.delete(sessionId);
                this.clientSessions.delete(metadata.clientIdentifier);
                this.requestLocks.delete(sessionId);
                cleanedCount++;
                this.metrics.totalExpired++;
            }
            else if (timeUntilExpiry < Constants.DEFAULT_CONFIG.WARNING_THRESHOLD)
            {
                warningCount++;
            }
        }

        if (cleanedCount > 0 || warningCount > 0)
        {
            logger.info("[SessionDebug] Cleanup cycle complete");
        }
    }
}

function Enforce(): void {}
