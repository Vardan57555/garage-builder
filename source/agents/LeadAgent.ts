import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { sharedLLM } from "@llm/SharedLLM";
import {AIMessageChunk, BaseMessage, HumanMessage} from "@langchain/core/messages";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import {
    RoofMappingResult,
    StateMapping,
    UserFriendlyParams
} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {RedisCacheUtils} from "@utils/cache/RedisCacheUtils";
import {SessionManager} from "@utils/session/SessionManager";
import {SessionMetadata} from "@utils/session/io/ISession";

const logger: pino.Logger = createLogger(module);

interface LeadAgentSessionMetadata extends SessionMetadata {
    memory: BufferMemory;
    state: {
        userFriendlyParams: Partial<UserFriendlyParams>;
        hasGarageIntent: boolean;
        currentField?: keyof UserFriendlyParams;
    };
    stateMapCache: Map<string, StateMapping | null>;
    roofMapCache: Map<string, number>;
}

export class LeadAgent
{
    /**
     * The singleton instance of `LeadAgent`.
     * @private
     */
    private static instance: LeadAgent;

    /**
     * Session manager instance for handling all session operations.
     * @private
     */
    private sessionManager: SessionManager;

    /**
     * Redis cache utility instance.
     * @private
     */
    private cacheUtils: RedisCacheUtils;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @param cacheUtils - The Redis service instance.
     * @throws Error if instantiation is attempted directly.
     */
    private constructor(enforce: () => void, cacheUtils: RedisCacheUtils)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        this.cacheUtils = cacheUtils;
        this.sessionManager = SessionManager.getInstance({
            SESSION_TIMEOUT: 30 * 60 * 1000,
            CLEANUP_INTERVAL: 5 * 60 * 1000,
            WARNING_THRESHOLD: 5 * 60 * 1000,
        });
    }

    /**
     * Gets the singleton instance of LeadAgent.
     *
     * @returns The singleton instance of LeadAgent.
     */
    public static async getInstance(): Promise<LeadAgent>
    {
        if (!LeadAgent.instance)
        {
            LeadAgent.instance = new LeadAgent(Enforce, RedisCacheUtils.getInstance());
        }
        return LeadAgent.instance;
    }

    /**
     * @param sessionId - A unique identifier for the user session.
     * @returns {LeadAgentSessionMetadata} The existing or newly created session data object.
     * @throws {Error} If session creation or retrieval encounters unexpected issues.
     */
    private getOrCreateSession(sessionId: string): LeadAgentSessionMetadata
    {
        const existingSession: SessionMetadata = this.sessionManager.getSession(sessionId);

        if (existingSession && this.sessionManager.isSessionValid(sessionId))
        {
            this.sessionManager.updateLastActivity(sessionId);
            return <LeadAgentSessionMetadata>existingSession;
        }

        const newSession: LeadAgentSessionMetadata = {
            sessionId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
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
        };

        this.sessionManager.createSession(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
        return newSession;
    }

    /**
     * Converts a message content value into a single string representation.
     * @param content - The message content to format, which can be a string, an array, or another type.
     * @returns {string} A string representation of the provided content.
     */
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

    /**
     * Uses an AI model to detect whether the user input indicates garage-building intent.
     * @param input - The raw user input text to analyze for intent.
     * @returns {Promise<boolean>} `true` if garage intent is detected, otherwise `false`.
     * @throws {Error} If both AI and fallback detection fail unexpectedly.
     */
    private async detectGarageIntentWithAI(input: string): Promise<boolean>
    {
        try
        {
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

    /**
     * Performs a simple keyword-based check to detect garage-building intent
     * when the AI detection is unavailable or fails.
     * @param input - The raw user input text to analyze for intent.
     * @returns {boolean} `true` if any intent keyword is found, otherwise `false`.
     */
    private detectGarageIntentFallback(input: string): boolean
    {
        const lowerInput: string = input.toLowerCase();
        return Array.from(Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }

    /**
     * @param stateName - The name of the state to be mapped to a database record.
     * @param session - The current session containing the state map cache.
     * @param preferredBuildingId - The preferred building ID to match against (defaults to `1`).
     * @returns {Promise<StateMapping | null>} The matched state mapping object, or `null` if no match is found.
     * @throws {Error} If the database procedure call fails unexpectedly.
     */
    private async mapStateToDB(stateName: string, session: LeadAgentSessionMetadata, preferredBuildingId = 1): Promise<StateMapping | null>
    {
        const cacheKey = `${stateName}:${preferredBuildingId}`;

        const cachedState: StateMapping | null | undefined = session.stateMapCache.get(cacheKey)

        if (cachedState !== undefined)
        {
            return cachedState;
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
                await this.cacheUtils.put(cacheKey, output);
                session.stateMapCache.set(cacheKey, output);
                return output;
            }

            await this.cacheUtils.put(cacheKey, null);
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

    /**
     * @param roofType - The roof type string to map.
     * @param mapId - The map ID associated with the current building state.
     * @param session - The current session containing the roof map cache.
     * @returns {Promise<number>} The resolved roof ID, either from the database, cache, or fallback mapping.
     * @throws {Error} If database interaction encounters unexpected issues.
     */
    private async mapRoofTypeToDB(roofType: string, mapId: number, session: LeadAgentSessionMetadata): Promise<number>
    {
        const normalizedRoofType: string = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        const cachedRoofId: number = await this.cacheUtils.get(cacheKey);

        if (cachedRoofId)
        {
            return cachedRoofId
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

        await this.cacheUtils.put(cacheKey, fallbackId);
        return fallbackId;
    }

    /**
     * @param userParams - The user-friendly parameters provided by the user.
     * @param session - The current session, used for caching and mapping lookups.
     * @returns {Promise<IPricingParams | null>} The converted technical pricing parameters, or `null` on failure.
     *
     * @throws {Error} If state or roof mapping fails unexpectedly.
     */
    private async convertToTechnicalParams(userParams: UserFriendlyParams, session: LeadAgentSessionMetadata): Promise<IPricingParams | null>
    {
        try
        {
            let map_id = 1;
            let manufacturer_id = 1;

            if (userParams.state_name)
            {
                const mapping: StateMapping | null = await this.mapStateToDB(userParams.state_name, session);

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

    /**
     * @param params - A partial object containing user-friendly parameters.
     * @returns {(keyof UserFriendlyParams)[]} An array of missing required field names.
     */
    private getMissingFields(params: Partial<UserFriendlyParams>): (keyof UserFriendlyParams)[]
    {
        return Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }

    /**
     * @param extractedParams - A partial object containing user-friendly building parameters.
     * @returns {string} A formatted string summarizing the provided dimensions, or an empty string if none are found.
     */
    private formatDimensionsResponse(extractedParams: Partial<UserFriendlyParams>): string
    {
        const dimensions: string = (["width", "length", "height"] as const)
            .filter((k) => extractedParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${extractedParams[k]}ft.`)
            .join(" ");

        return dimensions ? `Got it! ${dimensions}\n\n` : "";
    }

    /**
     * @param sessionId - The unique identifier for the current user session.
     * @param input - The raw user input message to process.
     * @returns {Promise<string>} A response string from the AI, either prompting for more info or providing a price quote.
     * @throws {Error} If parameter extraction, AI intent detection, or price calculation encounters unexpected issues.
     */
    public async run(sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] Session ${sessionId} - User input:`, input);

        const session = this.getOrCreateSession(sessionId);

        await session.memory.chatHistory.addUserMessage(input);

        if (!session.state.hasGarageIntent)
        {
            const hasIntent: boolean = await this.detectGarageIntentWithAI(input);
            if (!hasIntent)
            {
                const response: string =
                    "Hello! I can help you get a price quote for a garage or metal building.\n" +
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

        const missingFields: (keyof UserFriendlyParams)[] = this.getMissingFields(session.state.userFriendlyParams);
        if (missingFields.length > 0)
        {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            session.state.currentField = nextField;
            const response: string = this.formatDimensionsResponse(extractedParams) +
                Constants.FIELD_PROMPTS[nextField];

            await session.memory.chatHistory.addAIChatMessage(response);
            return response;
        }

        const technicalParams: IPricingParams | null = await this.convertToTechnicalParams(session.state.userFriendlyParams as UserFriendlyParams, session);

        if (!technicalParams)
        {
            return "Failed to convert user input to technical parameters.";
        }

        const result: string = await extractor.calculatePriceWithParams(technicalParams);
        await session.memory.chatHistory.addAIChatMessage(result);

        this.resetSessionState(session);

        return result + "\n\nNeed another quote? Just describe what you're looking for!";
    }

    /**
     * @param session - The current session containing the chat history.
     * @returns {Promise<string>} The conversation context as a single concatenated string.
     */
    private async getConversationContext(session: LeadAgentSessionMetadata): Promise<string>
    {
        const history: BaseMessage[] = await session.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }

    /**
     * @param session - The session whose state is to be reset.
     * @returns {void}
     */
    private resetSessionState(session: LeadAgentSessionMetadata): void
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
        if (this.sessionManager.endSession(sessionId))
        {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
        else
        {
            logger.warn(`[LeadAgent] Attempted to end non-existent session: ${sessionId}`);
        }
    }

    /**
     * Full reset (for testing/shutdown)
     */
    public async reset(): Promise<void>
    {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }
}

function Enforce(): void {}
