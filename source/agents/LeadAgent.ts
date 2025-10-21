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

export class LeadAgent
{
    /**
     * The singleton instance of `LeadAgent`.
     * @private
     */

    private static instance: LeadAgent;

    /**
     * Stores the conversation history and other memory-related data for the LeadAgent.
     */

    private memory: BufferMemory;

    /**
     * Tracks the current conversation state for the LeadAgent.
     */

    private state: ConversationState;

    /**
     * Caches state name to database mapping results for faster lookups.
     */

    private stateMapCache: Map<string, StateMapping | null> = new Map();
    /**
     * Caches a roof type to database `roof_id` mappings for faster lookups.
     */

    private roofMapCache: Map<string, number> = new Map();

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    private constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        this.memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });

        this.state = {
            userFriendlyParams: {},
            hasGarageIntent: false,
        };
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
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }

    /**
     * Converts a message content input into a single string representation.
     * @param content - The message content, which can be a string, an array of objects, or any other type.
     * @returns A string representing the full message content.
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
     * Detects whether the user input indicates garage-related intent using an AI model.
     * @param input - The raw user input string to analyze for garage-related intent.
     * @returns A promise that resolves to `true` if the AI (or fallback) detects garage intent otherwise `false`.
     * @throws Does not throw errors; logs warnings and falls back if AI invocation fails.
     */

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

    /**
     * Fallback method to detect garage-related intent from user input using keyword matching.
     * @param input - The raw user input string to analyze.
     * @returns `true` if any keyword from `Constants.INTENT_KEYWORDS` is found in the input, otherwise `false`.
     */

    private detectGarageIntentFallback(input: string): boolean
    {
        const lowerInput: string = input.toLowerCase();
        return Array.from(Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }

    /**
     * Maps a given state name to its corresponding database identifiers (`map_id` and `manufacturer_id`).
     * @param stateName - The name of the state to map.
     * @param preferredBuildingId - Optional ID of the preferred building; defaults to `1`.
     * @returns A promise resolving to a `StateMapping` object containing `map_id` and `manufacturer_id` if found,
     * @throws Does not propagate errors; logs failures and caches `null` on error.
     */

    private async mapStateToDB(stateName: string, preferredBuildingId = 1): Promise<StateMapping | null>
    {
        const cacheKey = `${stateName}:${preferredBuildingId}`;

        if (this.stateMapCache.has(cacheKey))
        {
            return this.stateMapCache.get(cacheKey) ?? null;
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
                this.stateMapCache.set(cacheKey, output);
                return output;
            }

            this.stateMapCache.set(cacheKey, null);
            return null;
        }
        catch (error)
        {
            logger.error("[LeadAgent] State mapping failed:", error);
            this.stateMapCache.set(cacheKey, null);
            return null;
        }
    }

    /**
     * @param roofType - The type of roof to map (e.g., "vertical", "box").
     * @param mapId - The ID of the map associated with the roof type.
     * @returns A promise resolving to the database `roof_id` corresponding to the given roof type and map ID.
     * @throws Does not propagate errors; logs failures and uses a fallback ID if mapping fails.
     */

    private async mapRoofTypeToDB(roofType: string, mapId: number): Promise<number>
    {
        const normalizedRoofType: string = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        if (this.roofMapCache.has(cacheKey))
        {
            return this.roofMapCache.get(cacheKey)!;
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
                this.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        }
        catch (error)
        {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }

        const fallbackId: number = Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ?? (normalizedRoofType.includes("vertical") ? 1 : normalizedRoofType.includes("box") ? 3 : 2);

        this.roofMapCache.set(cacheKey, fallbackId);
        return fallbackId;
    }

    /**
     * @param userParams - An object containing user-friendly parameters such as dimensions, state, roof type, and building attributes.
     * @returns A promise resolving to an `IPricingParams` object with fully mapped technical parameters, or `null` if conversion fails.
     * @throws Does not propagate errors; logs failures and returns `null` on error.
     */

    private async convertToTechnicalParams(userParams: UserFriendlyParams): Promise<IPricingParams | null>
    {
        try
        {
            let map_id = 1;
            let manufacturer_id = 1;

            if (userParams.state_name)
            {
                const mapping: StateMapping = await this.mapStateToDB(userParams.state_name);

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

            const roof_id: number = userParams.roof_type ? await this.mapRoofTypeToDB(userParams.roof_type, map_id) : 2;

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
     * @returns An array of keys from `UserFriendlyParams` that are missing or undefined in `params`.
     */

    private getMissingFields(params: Partial<UserFriendlyParams>): (keyof UserFriendlyParams)[]
    {
        return Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }

    /**
     * @param extractedParams - A partial object containing user-friendly parameters, potentially including width, length, and height.
     * @returns A formatted string listing the available dimensions, or an empty string if none are provided.
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
     * @param input - The raw user input string to process.
     * @returns A promise resolving to a user-friendly response string, which may include prompts for missing fields,
     */

    public async run(input: string): Promise<string>
    {
        logger.info("[LeadAgent] User input:", input);

        await this.memory.chatHistory.addUserMessage(input);

        if (!this.state.hasGarageIntent)
        {
            const hasIntent: boolean = await this.detectGarageIntentWithAI(input);
            if (!hasIntent)
            {
                const response: string =
                    "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await this.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            this.state.hasGarageIntent = true;
        }

        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const rawParams: string = await extractor._call(await this.getConversationContext());
        logger.info("[LeadAgent] Raw params from extractor:", rawParams);

        const extractedParams: Partial<UserFriendlyParams> = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info("[LeadAgent] Safe extracted user-friendly params:", extractedParams);

        this.state.userFriendlyParams = {
            ...this.state.userFriendlyParams,
            ...extractedParams
        };

        const missingFields = this.getMissingFields(this.state.userFriendlyParams);
        if (missingFields.length > 0)
        {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            this.state.currentField = nextField;
            const response: string = this.formatDimensionsResponse(extractedParams) +
                Constants.FIELD_PROMPTS[nextField];

            await this.memory.chatHistory.addAIChatMessage(response);
            return response;
        }

        const technicalParams: IPricingParams = await this.convertToTechnicalParams(this.state.userFriendlyParams as UserFriendlyParams);

        if (!technicalParams)
        {
            return "⚠️ Failed to convert user input to technical parameters.";
        }

        const result: string = await extractor.calculatePriceWithParams(technicalParams);
        await this.memory.chatHistory.addAIChatMessage(result);

        this.resetState();

        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
    }

    /**
     * Retrieves the full conversation history as a single string.
     * @returns A promise resolving to the complete conversation context as a single string.
     */

    private async getConversationContext(): Promise<string>
    {
        const history: BaseMessage[] = await this.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }

    /**
     * Resets the internal state of the LeadAgent for a new conversation or interaction.
     * Clears all stored user-friendly parameters, resets the garage intent flag, and clears the current field tracker.
     */

    private resetState(): void
    {
        this.state.userFriendlyParams = {};
        this.state.hasGarageIntent = false;
        this.state.currentField = undefined;
    }

    /**
     * Performs a full reset of the LeadAgent instance.
     * @returns A promise that resolves once the reset is complete.
     */

    public async reset(): Promise<void>
    {
        this.resetState();
        this.stateMapCache.clear();
        this.roofMapCache.clear();
        this.memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });
    }
}

function Enforce(): void {}
