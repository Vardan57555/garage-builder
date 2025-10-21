import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { sharedLLM } from "@llm/SharedLLM";
import {AIMessageChunk, BaseMessage, HumanMessage} from "@langchain/core/messages";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import {ConversationState, RoofMappingResult, StateMapping, UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

interface SessionData {
    memory: BufferMemory;
    state: ConversationState;
    stateMapCache: Map<string, StateMapping | null>;
    roofMapCache: Map<string, number>;
    lastActivity: number;
}

export class LeadAgent
{
    private static instance: LeadAgent;
    private sessions: Map<string, SessionData> = new Map();
    private readonly SESSION_TIMEOUT = 30 * 60 * 1000;
    private cleanupInterval: NodeJS.Timeout | null = null;

    private constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        // Start periodic cleanup of expired sessions
        this.startSessionCleanup();
    }

    public static async getInstance(): Promise<LeadAgent>
    {
        if (!LeadAgent.instance)
        {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }

    /**
     * Creates or retrieves a session by ID
     */
    private getOrCreateSession(sessionId: string): SessionData
    {
        if (this.sessions.has(sessionId))
        {
            const session = this.sessions.get(sessionId)!;
            session.lastActivity = Date.now();
            return session;
        }

        const newSession: SessionData = {
            memory: new BufferMemory({
                memoryKey: "chat_history",
                returnMessages: true,
                chatHistory: new ChatMessageHistory(),
            }),
            state: {
                userFriendlyParams: {},
                hasGarageIntent: false,
            },
            stateMapCache: new Map(),
            roofMapCache: new Map(),
            lastActivity: Date.now(),
        };

        this.sessions.set(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
        return newSession;
    }

    /**
     * Starts automatic cleanup of expired sessions
     */
    private startSessionCleanup(): void
    {
        if (this.cleanupInterval)
        {
            return;
        }

        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            let cleanedCount = 0;

            for (const [sessionId, session] of this.sessions.entries())
            {
                if (now - session.lastActivity > this.SESSION_TIMEOUT)
                {
                    this.sessions.delete(sessionId);
                    cleanedCount++;
                    logger.info(`[LeadAgent] Session expired and cleaned: ${sessionId}`);
                }
            }

            if (cleanedCount > 0)
            {
                logger.info(`[LeadAgent] Cleaned up ${cleanedCount} expired sessions. Active sessions: ${this.sessions.size}`);
            }
        }, 5 * 60 * 1000);
    }

    private getMessageString(content: string | any[]): string
    {
        if (typeof content === "string")
        {
            return content;
        }

        if (Array.isArray(content))
        {
            return content
                .map((c) => ("text" in c ? c.text : JSON.stringify(c)))
                .join(" ");
        }

        return String(content);
    }

    private async detectGarageIntentWithAI(input: string): Promise<boolean>
    {
        try {
            const prompt: string = Constants.INTENT_PROMPT.replace("{input}", input);
            logger.info("[LeadAgent] Intent detection prompt:", prompt);

            const aiMessage: AIMessageChunk = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const response: string = (aiMessage.content as string).trim().toUpperCase();
            logger.info("[LeadAgent] Intent detection response:", response);

            return response.includes("YES");
        }
        catch (error)
        {
            logger.warn("[LeadAgent] AI intent detection failed, using fallback:", error);
            return this.detectGarageIntentFallback(input);
        }
    }

    private detectGarageIntentFallback(input: string): boolean
    {
        const lowerInput: string = input.toLowerCase();
        return Array.from(Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }

    private async mapStateToDB(stateName: string, session: SessionData, preferredBuildingId = 1): Promise<StateMapping | null>
    {
        const cacheKey = `${stateName}:${preferredBuildingId}`;

        if (session.stateMapCache.has(cacheKey))
        {
            return session.stateMapCache.get(cacheKey) ?? null;
        }

        try
        {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [stateName],
                "getMapIdByStateName(?)",
                "getMapIdByStateName"
            );

            if (result?.length > 0)
            {
                const preferredMapping = result.find(
                    (item: any) => item.building_id === preferredBuildingId
                );
                const mapping = preferredMapping || result[0];
                const output: StateMapping = {map_id: mapping.map_id, manufacturer_id: mapping.manufacturer_id};
                session.stateMapCache.set(cacheKey, output);
                return output;
            }

            session.stateMapCache.set(cacheKey, null);
            return null;
        }
        catch (error)
        {
            logger.error("[LeadAgent] State mapping failed:", error);
            session.stateMapCache.set(cacheKey, null);
            return null;
        }
    }

    private async mapRoofTypeToDB(roofType: string, mapId: number, session: SessionData): Promise<number>
    {
        const normalizedRoofType: string = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        if (session.roofMapCache.has(cacheKey))
        {
            return session.roofMapCache.get(cacheKey)!;
        }

        try
        {
            const result: RoofMappingResult[] =
                await ProcedureExecutor.getProcedureData<RoofMappingResult>(
                    [mapId, roofType],
                    "getRoofIdByType(?, ?)",
                    "roof_mapping"
                );

            if (result?.length > 0)
            {
                session.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        }
        catch (error)
        {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }

        const fallbackId: number = Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ?? (normalizedRoofType.includes("vertical") ? 1 : normalizedRoofType.includes("box") ? 3 : 2);

        session.roofMapCache.set(cacheKey, fallbackId);
        return fallbackId;
    }

    private async convertToTechnicalParams(userParams: UserFriendlyParams, session: SessionData): Promise<IPricingParams | null>
    {
        try
        {
            let map_id = 1;
            let manufacturer_id = 1;

            if (userParams.state_name)
            {
                const mapping: StateMapping = await this.mapStateToDB(userParams.state_name, session);

                if (mapping)
                {
                    map_id = mapping.map_id;
                    manufacturer_id = mapping.manufacturer_id;
                }
                else
                {
                    logger.warn(`[LeadAgent] State "${userParams.state_name}" not found, using defaults.`);
                }
            }

            const roof_id: number = userParams.roof_type ? await this.mapRoofTypeToDB(userParams.roof_type, map_id, session) : 2;

            return {
                width: userParams.width ?? 0,
                length: userParams.length ?? 0,
                height: userParams.height ?? 0,
                map_id,
                roof_id,
                manufacturer_id,
                utility_length: userParams.utility_length,
                building_type: userParams.building_type,
                gauge: userParams.gauge ?? 14,
                is_barn: userParams.is_barn,
            };
        }
        catch (error)
        {
            logger.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }

    private getMissingFields(params: Partial<UserFriendlyParams>): (keyof UserFriendlyParams)[]
    {
        return Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }

    private formatDimensionsResponse(extractedParams: Partial<UserFriendlyParams>): string
    {
        const dimensions: string = (["width", "length", "height"] as const)
            .filter((k) => extractedParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${extractedParams[k]}ft.`)
            .join(" ");

        return dimensions ? `Got it! ${dimensions}\n\n` : "";
    }

    public async run(sessionId: string, input: string): Promise<string>
    {
        console.log(sessionId);

        logger.info(`[LeadAgent] Session ${sessionId} - User input:`, input);

        const session = this.getOrCreateSession(sessionId);

        await session.memory.chatHistory.addUserMessage(input);

        if (!session.state.hasGarageIntent)
        {
            const hasIntent: boolean = await this.detectGarageIntentWithAI(input);
            if (!hasIntent)
            {
                const response: string =
                    "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            session.state.hasGarageIntent = true;
        }

        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const rawParams: string = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);

        const extractedParams: Partial<UserFriendlyParams> = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Safe extracted user-friendly params:`, extractedParams);

        session.state.userFriendlyParams = {
            ...session.state.userFriendlyParams,
            ...extractedParams
        };

        const missingFields = this.getMissingFields(session.state.userFriendlyParams);
        if (missingFields.length > 0)
        {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            session.state.currentField = nextField;
            const response: string = this.formatDimensionsResponse(extractedParams) +
                Constants.FIELD_PROMPTS[nextField];

            await session.memory.chatHistory.addAIChatMessage(response);
            return response;
        }

        const technicalParams: IPricingParams = await this.convertToTechnicalParams(session.state.userFriendlyParams as UserFriendlyParams, session);

        if (!technicalParams)
        {
            return "⚠️ Failed to convert user input to technical parameters.";
        }

        const result: string = await extractor.calculatePriceWithParams(technicalParams);
        await session.memory.chatHistory.addAIChatMessage(result);

        this.resetSessionState(session);

        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
    }

    private async getConversationContext(session: SessionData): Promise<string>
    {
        const history: BaseMessage[] = await session.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }

    private resetSessionState(session: SessionData): void
    {
        session.state.userFriendlyParams = {};
        session.state.hasGarageIntent = false;
        session.state.currentField = undefined;
    }

    /**
     * Manually end a session
     */
    public async endSession(sessionId: string): Promise<void>
    {
        if (this.sessions.has(sessionId))
        {
            this.sessions.delete(sessionId);
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
    }

    /**
     * Get active session count
     */
    public getActiveSessionCount(): number
    {
        return this.sessions.size;
    }

    /**
     * Full reset (for testing/shutdown)
     */
    public async reset(): Promise<void>
    {
        this.sessions.clear();
        if (this.cleanupInterval)
        {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }
}

function Enforce(): void {}
