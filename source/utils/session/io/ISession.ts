export interface SessionConfig {
    SESSION_TIMEOUT: number;
    CLEANUP_INTERVAL: number;
    WARNING_THRESHOLD?: number;
}

export interface SessionMetadata {
    sessionId: string;
    clientIdentifier?: string;
    createdAt: number;
    lastActivity: number;
    expiresAt: number;
}

export interface SessionMetrics {
    totalCreated: number;
    totalEnded: number;
    totalExpired: number;
    averageDuration: number;
}
