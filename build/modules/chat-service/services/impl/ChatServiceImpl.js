"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServiceImpl = void 0;
const ServerError_1 = require("../../../../errors/ServerError");
const LeadAgent_1 = require("../../../../agents/LeadAgent");
const uuid_1 = require("uuid");
const InstantiationError_1 = require("../../../../errors/InstantiationError");
const Log_1 = require("../../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ChatServiceImpl {
    static instance;
    sessionMetadata = new Map();
    clientSessions = new Map();
    SESSION_TIMEOUT = 30 * 60 * 1000;
    CLEANUP_INTERVAL = 5 * 60 * 1000;
    WARNING_THRESHOLD = 5 * 60 * 1000;
    cleanupInterval = null;
    metrics = {
        totalCreated: 0,
        totalEnded: 0,
        totalExpired: 0,
        averageDuration: 0,
    };
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use ChatService.getInstance() instead of new.");
        }
        this.startSessionCleanup();
    }
    static getInstance() {
        if (!ChatServiceImpl.instance) {
            ChatServiceImpl.instance = new ChatServiceImpl(Enforce);
        }
        return ChatServiceImpl.instance;
    }
    async generateAssistantResponse(body, clientIp, userAgent) {
        const { question } = body;
        if (!question || question.trim().length === 0) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "Question is required");
        }
        const clientId = this.generateClientIdentifier(clientIp, userAgent);
        const { sessionId } = this.getOrCreateSession(clientId, clientIp, userAgent);
        let pricingData;
        try {
            const agent = await LeadAgent_1.LeadAgent.getInstance();
            pricingData = await agent.run(sessionId, question);
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to process request: ${error.message}`);
        }
        return {
            answer: pricingData,
            sessionId: sessionId,
            timestamp: new Date().toISOString()
        };
    }
    async endSession(sessionId) {
        const metadata = this.sessionMetadata.get(sessionId);
        if (!metadata) {
            logger.warn("[ChatService] Attempt to end non-existent session", { sessionId });
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Session ${sessionId} not found`);
        }
        try {
            const agent = await LeadAgent_1.LeadAgent.getInstance();
            await agent.endSession(sessionId);
            this.sessionMetadata.delete(sessionId);
            this.clientSessions.delete(metadata.clientIdentifier);
            this.metrics.totalEnded++;
            return { success: true, message: `Session ${sessionId} ended successfully` };
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Failed to end session: ${error.message}`);
        }
    }
    generateClientIdentifier(ip, userAgent) {
        const combined = `${ip}:${userAgent}`;
        let hash = 0;
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return `client-${Math.abs(hash)}`;
    }
    getOrCreateSession(clientId, ip, userAgent) {
        const now = Date.now();
        if (this.clientSessions.has(clientId)) {
            const existingSessionId = this.clientSessions.get(clientId);
            const metadata = this.sessionMetadata.get(existingSessionId);
            if (metadata && metadata.expiresAt > now) {
                metadata.lastActivity = now;
                return { sessionId: existingSessionId, isNew: false };
            }
            else {
                this.clientSessions.delete(clientId);
                if (metadata) {
                    this.sessionMetadata.delete(existingSessionId);
                    this.metrics.totalExpired++;
                }
            }
        }
        const newSessionId = (0, uuid_1.v4)();
        const expiresAt = now + this.SESSION_TIMEOUT;
        const metadata = {
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
    startSessionCleanup() {
        if (this.cleanupInterval) {
            return;
        }
        this.cleanupInterval = setInterval(() => {
            this.performCleanup();
        }, this.CLEANUP_INTERVAL);
        logger.info("[ChatService] Cleanup interval started", { intervalMinutes: this.CLEANUP_INTERVAL / 60000 });
    }
    performCleanup() {
        const now = Date.now();
        let cleanedCount = 0;
        let warningCount = 0;
        for (const [sessionId, metadata] of this.sessionMetadata.entries()) {
            const timeUntilExpiry = metadata.expiresAt - now;
            if (timeUntilExpiry < 0) {
                this.sessionMetadata.delete(sessionId);
                this.clientSessions.delete(metadata.clientIdentifier);
                cleanedCount++;
                this.metrics.totalExpired++;
            }
            else if (timeUntilExpiry < this.WARNING_THRESHOLD) {
                warningCount++;
            }
        }
        if (cleanedCount > 0 || warningCount > 0) {
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
exports.ChatServiceImpl = ChatServiceImpl;
function Enforce() { }
//# sourceMappingURL=ChatServiceImpl.js.map