export interface SessionMetadata {
    sessionId: string;
    clientIdentifier: string;
    createdAt: number;
    lastActivity: number;
    expiresAt: number;
    ip: string;
    userAgent: string;
    lastIp: string;
    lastUserAgent: string;
    deviceFingerprint: string;
    accessCount: number;
}

export interface SessionMetrics {
    totalCreated: number;
    totalEnded: number;
    totalExpired: number;
    averageDuration: number;
}
