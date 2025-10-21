import { Service } from "@common/service/Service";
import {IAiAnswer} from "@common/io/IAiAgent";

export interface ChatService extends Service
{
    generateAssistantResponse(body: Record<string, string>, clientIp: string, userAgent: string): Promise<IAiAnswer>

    endSession(sessionId: string): Promise<{ success: boolean; message: string }>
}
