import { ServerError } from "@errors/ServerError";
import { IAiAnswer } from "@common/io/IAiAgent";
import { LeadAgent } from "@agents/LeadAgent";
import { v4 as uuidv4 } from "uuid";
import { ChatService } from "@modules/chat-service/services/ChatService";
import { InstantiationError } from "@errors/InstantiationError";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {SessionMetadata, SessionMetrics} from "@modules/chat-service/routes/io/IChat";

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

    private readonly SESSION_TIMEOUT: number = 30 * 60 * 1000;
    private readonly CLEANUP_INTERVAL: number = 5 * 60 * 1000;
    private readonly WARNING_THRESHOLD: number = 5 * 60 * 1000;

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
     * @param body - The request body containing the user's input question.
     * @param clientIp - The client's IP address, used for session identification.
     * @param userAgent - The client's user-agent string, used for generating a unique session key.
     * @returns {Promise<IAiAnswer>} A promise resolving to the AI-generated answer, session ID, and timestamp.
     * @throws {ServerError.INTERNAL} If the input is invalid, the agent fails to initialize,
     * or the response generation process encounters an error.
     */

    public async generateAssistantResponse(body: Record<string, string>, clientIp: string, userAgent: string): Promise<IAiAnswer>
    {
        const { question } = body;

        if (!question || question.trim().length === 0)
        {
            throw new ServerError(ServerError.INTERNAL, "Question is required");
        }

        const clientId: string = this.generateClientIdentifier(clientIp, userAgent);
        const { sessionId } = this.getOrCreateSession(clientId, clientIp, userAgent);

        let pricingData;

        try
        {
            const agent: LeadAgent = await LeadAgent.getInstance();
            pricingData = await agent.run(sessionId, question);
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to process request: ${error.message}`);
        }

        return {
            answer: pricingData,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * @param sessionId - The unique identifier of the session to be ended.
     * @returns {Promise<{ success: boolean; message: string }>} A promise resolving to an object
     * indicating whether the session was successfully terminated, along with a descriptive message.
     * @throws {ServerError.INTERNAL} If the session does not exist or if an error occurs during
     * the session termination process.
     */

    public async endSession(sessionId: string): Promise<{ success: boolean; message: string }>
    {
        const metadata = this.sessionMetadata.get(sessionId);

        if (!metadata)
        {
            logger.warn("[ChatService] Attempt to end non-existent session", { sessionId })
            throw new ServerError(ServerError.INTERNAL, `Session ${sessionId} not found`);
        }

        try
        {
            const agent: LeadAgent = await LeadAgent.getInstance();
            await agent.endSession(sessionId);

            this.sessionMetadata.delete(sessionId);
            this.clientSessions.delete(metadata.clientIdentifier);
            this.metrics.totalEnded++;

            return {success: true, message: `Session ${sessionId} ended successfully`};
        }
        catch (error)
        {
            throw new ServerError(ServerError.INTERNAL, `Failed to end session: ${error.message}`);
        }
    }

    /**
     * @param ip - The client's IP address.
     * @param userAgent - The client's user-agent string.
     * @returns {string} A deterministic hashed client identifier derived from the IP and user-agent.
     */

    private generateClientIdentifier(ip: string, userAgent: string): string
    {
        const combined = `${ip}:${userAgent}`;
        let hash: number = 0;

        for (let i = 0; i < combined.length; i++)
        {
            const char: number = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }

        return `client-${Math.abs(hash)}`;
    }

    /**
     * @param clientId - The unique identifier representing the client (derived from IP and user-agent).
     * @param ip - The client's IP address.
     * @param userAgent - The client's user-agent string.
     * @returns {{ sessionId: string; isNew: boolean }} An object containing the active session ID and a flag indicating whether it was newly created.
     */

    private getOrCreateSession(clientId: string, ip: string, userAgent: string): { sessionId: string; isNew: boolean }
    {
        const now: number = Date.now();

        if (this.clientSessions.has(clientId))
        {
            const existingSessionId: string = this.clientSessions.get(clientId)!;
            const metadata: SessionMetadata = this.sessionMetadata.get(existingSessionId);

            if (metadata && metadata.expiresAt > now)
            {
                metadata.lastActivity = now;

                return { sessionId: existingSessionId, isNew: false };
            }
            else
            {
                this.clientSessions.delete(clientId);
                if (metadata)
                {
                    this.sessionMetadata.delete(existingSessionId);
                    this.metrics.totalExpired++;
                }
            }
        }

        const newSessionId: string | Uint8Array = uuidv4();
        const expiresAt: number = now + this.SESSION_TIMEOUT;

        const metadata: SessionMetadata = {
            sessionId: newSessionId,
            clientIdentifier: clientId,
            createdAt: now,
            lastActivity: now,
            expiresAt: expiresAt
        };

        this.sessionMetadata.set(newSessionId, metadata);
        this.clientSessions.set(clientId, newSessionId);
        this.metrics.totalCreated++;

        return { sessionId: newSessionId, isNew: true };
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

        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.CLEANUP_INTERVAL);

        logger.info("[ChatService] Cleanup interval started", {intervalMinutes: this.CLEANUP_INTERVAL / 60000});
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
                cleanedCount++;
                this.metrics.totalExpired++;
            }
            else if (timeUntilExpiry < this.WARNING_THRESHOLD)
            {
                warningCount++;
            }
        }

        if (cleanedCount > 0 || warningCount > 0)
        {
            logger.info("[SessionDebug] Cleanup cycle complete", {
                cleanedSessions: cleanedCount,
                expiringSoonCount: warningCount,
                activeSessions: this.sessionMetadata.size,
                activeClients: this.clientSessions.size,
                metrics: this.metrics
            });
        }
    }
}

function Enforce(): void {}
