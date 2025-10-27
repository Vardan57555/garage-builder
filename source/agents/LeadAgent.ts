import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { sharedLLM } from "@llm/SharedLLM";
import {AIMessageChunk, BaseMessage, HumanMessage} from "@langchain/core/messages";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import {
    LeadAgentSessionMetadata,
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
import {StateDataValidator} from "@agents/validators/StateValidator";
import {RoofDataValidator} from "@agents/validators/RoofValidator";

const logger: pino.Logger = createLogger(module);

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
     * Detects if user wants to update a parameter with improved pattern matching
     * Can handle MULTIPLE parameters in one input
     * @param input - User input to check for update intent
     * @returns Array of objects with detected fields and values, or null
     */
    private async detectParameterUpdate(input: string): Promise<{field: keyof UserFriendlyParams, value: any} | null>
    {
        const lowerInput = input.toLowerCase();

        // FIRST: Try regex-based extraction (faster, more reliable)
        // Check if this is a multi-parameter update like "width 25 length 25 height 20"
        const multiParamResult = this.extractMultipleParametersByRegex(lowerInput);
        if (multiParamResult && multiParamResult.length > 0) {
            logger.info(`[LeadAgent] Regex extracted ${multiParamResult.length} parameters`);
            // Store all updates in session and return them one by one
            (this as any).pendingUpdates = multiParamResult;
            return multiParamResult[0];
        }

        // SECOND: Single parameter update
        const regexResult = this.extractParameterByRegex(lowerInput);
        if (regexResult) {
            logger.info(`[LeadAgent] Regex extracted update: ${regexResult.field} = ${regexResult.value}`);
            return regexResult;
        }

        // THIRD: Fall back to AI extraction if regex fails
        const updatePatterns = [
            { regex: /\b(change|update|correct|fix|actually|wait|let me|make|set)\b/i, weight: 1 },
            { regex: /\b(width|length|height|roof|state|gauge)\b/i, weight: 2 }
        ];

        const hasUpdateIntent: boolean = updatePatterns.some(p => p.regex.test(input));

        if (!hasUpdateIntent) return null;

        try
        {
            const prompt = `Given this user message: "${input}"

            Extract the parameter update:
            1. Which parameter? (width, length, height, roof_type, state_name, gauge, building_type)
            2. What is the NEW value?
            
            Respond ONLY with JSON - no markdown, no explanation:
            {"isUpdate": true, "field": "width", "value": 25}
            or
            {"isUpdate": false}`;

            const aiMessage: AIMessageChunk = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const responseText = (aiMessage.content as string).trim();

            logger.info(`[LeadAgent] AI update detection response: ${responseText}`);

            // Clean up response
            const cleanedResponse = responseText
                .replace(/^```json\s*/g, '')
                .replace(/^```\s*/g, '')
                .replace(/\s*```$/g, '')
                .trim();

            const response = JSON.parse(cleanedResponse);

            if (response.isUpdate && response.field && response.value !== undefined && response.value !== null)
            {
                logger.info(`[LeadAgent] AI detected update: ${response.field} = ${response.value}`);
                return {
                    field: response.field as keyof UserFriendlyParams,
                    value: response.value
                };
            }
        }
        catch (error)
        {
            logger.warn("[LeadAgent] AI update detection failed:", error);
        }

        return null;
    }

    /**
     * Extract MULTIPLE parameters from a single input
     * E.g., "width 25 length 25 height 20" or "25x25x20"
     */
    private extractMultipleParametersByRegex(input: string): {field: keyof UserFriendlyParams, value: any}[] | null
    {
        const updates: {field: keyof UserFriendlyParams, value: any}[] = [];
        const lowerInput = input.toLowerCase().trim();

        logger.info(`[extractMultipleParametersByRegex] Processing input: "${input}"`);
        logger.info(`[extractMultipleParametersByRegex] Lowercase input: "${lowerInput}"`);

        // Pattern 1: "width 25 length 25 height 20"
        // Use word boundaries to ensure we match whole words
        const widthMatch = lowerInput.match(/\bwidth\s+(\d+(?:\.\d+)?)\b/);
        const lengthMatch = lowerInput.match(/\blength\s+(\d+(?:\.\d+)?)\b/);
        const heightMatch = lowerInput.match(/\bheight\s+(\d+(?:\.\d+)?)\b/);
        const gaugeMatch = lowerInput.match(/\bgauge\s+(\d+(?:\.\d+)?)\b/);

        logger.info(`[extractMultipleParametersByRegex] Raw matches - width: ${widthMatch?.[1]}, length: ${lengthMatch?.[1]}, height: ${heightMatch?.[1]}, gauge: ${gaugeMatch?.[1]}`);

        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'width', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added width: ${value}`);
            }
        }
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'length', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added length: ${value}`);
            }
        }
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'height', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added height: ${value}`);
            }
        }
        if (gaugeMatch) {
            const value = parseFloat(gaugeMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: 'gauge', value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added gauge: ${value}`);
            }
        }

        // Pattern 2: "25x25x20" or "25 x 25 x 20" (width x length x height)
        if (updates.length === 0) {
            const dimensionMatch = lowerInput.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/);
            if (dimensionMatch) {
                updates.push(
                    { field: 'width', value: parseFloat(dimensionMatch[1]) },
                    { field: 'length', value: parseFloat(dimensionMatch[2]) },
                    { field: 'height', value: parseFloat(dimensionMatch[3]) }
                );
                logger.info(`[extractMultipleParametersByRegex] Matched dimensions format: ${dimensionMatch[1]}x${dimensionMatch[2]}x${dimensionMatch[3]}`);
            }
        }

        logger.info(`[extractMultipleParametersByRegex] Total updates found: ${updates.length}`);
        logger.info(`[extractMultipleParametersByRegex] Final updates:`, JSON.stringify(updates));
        return updates.length > 0 ? updates : null;
    }

    /**
     * Extract parameter using regex patterns (faster fallback)
     */
    private extractParameterByRegex(input: string): {field: keyof UserFriendlyParams, value: any} | null
    {
        // More comprehensive patterns
        const patterns = [
            // Pattern: "make width 25" or "set width to 25" or "width 25"
            {
                regex: /(?:make|set|change|update)?\s*(?:the\s+)?(width|length|height)\s+(?:to\s+)?(\d+)/i,
                parse: (match: RegExpMatchArray) => ({
                    field: match[1].toLowerCase() as any,
                    value: parseFloat(match[2])
                })
            },
            // Pattern: "gauge 16" or "make gauge 16"
            {
                regex: /(?:make|set|change|update)?\s*gauge\s+(?:to\s+)?(\d+)/i,
                parse: (match: RegExpMatchArray) => ({
                    field: 'gauge',
                    value: parseFloat(match[1])
                })
            },
            // Pattern: "state texas" or "texas" or "in texas"
            {
                regex: /(?:state|location|in)\s+([a-z\s]+?)(?:\s*(?:\.|$|,))/i,
                parse: (match: RegExpMatchArray) => ({
                    field: 'state_name',
                    value: match[1].trim()
                })
            },
            // Pattern: "roof vertical" or "make roof a-frame"
            {
                regex: /(?:make|set|change|update)?\s*(?:roof|style)\s+(?:to\s+)?([\w\-]+)/i,
                parse: (match: RegExpMatchArray) => ({
                    field: 'roof_type',
                    value: match[1].toLowerCase()
                })
            }
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern.regex);
            if (match) {
                try {
                    const result = pattern.parse(match);
                    if (result && result.value !== null && result.value !== undefined) {
                        logger.info(`[extractParameterByRegex] Matched ${result.field} = ${result.value}`);
                        return result as any;
                    }
                } catch (e) {
                    logger.warn(`[extractParameterByRegex] Parse error:`, e);
                }
            }
        }

        return null;
    }

    /**
     * Handles parameter update and validation
     */
    private handleParameterUpdate(session: LeadAgentSessionMetadata, update: {field: keyof UserFriendlyParams, value: any}): {success: boolean, message: string, updatedField?: keyof UserFriendlyParams}
    {
        const { field, value } = update;

        logger.info(`[LeadAgent] Attempting to update ${field} from ${(session.state.userFriendlyParams as any)[field]} to ${value}`);

        // Validate and convert numeric fields
        if (["width", "length", "height", "gauge", "utility_length"].includes(field))
        {
            let numValue: number;

            if (typeof value === 'string') {
                numValue = parseFloat(value.replace(/[^\d.]/g, ''));
            } else if (typeof value === 'number') {
                numValue = value;
            } else {
                numValue = NaN;
            }

            if (isNaN(numValue) || numValue <= 0)
            {
                logger.warn(`[LeadAgent] Invalid ${field} value: ${value}`);
                return {
                    success: false,
                    message: `❌ Invalid ${field}. Please provide a positive number (e.g., "make ${field} 25").`
                };
            }

            (session.state.userFriendlyParams as any)[field] = numValue;
            logger.info(`[LeadAgent] Successfully updated ${field} to ${numValue} (numeric)`);
        }
        else
        {
            (session.state.userFriendlyParams as any)[field] = String(value).trim();
            logger.info(`[LeadAgent] Successfully updated ${field} to ${value} (string)`);
        }

        logger.info(`[LeadAgent] Current session params after update:`, JSON.stringify(session.state.userFriendlyParams));

        const updatedValue = (session.state.userFriendlyParams as any)[field];
        const displayField = field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, ' ');
        const fieldSuffix = ["width", "length", "height", "gauge", "utility_length"].includes(field) ? "ft." : "";

        return {
            success: true,
            message: `✓ Updated ${displayField} to ${updatedValue}${fieldSuffix ? ' ' + fieldSuffix : ''}`,
            updatedField: field
        };
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
            let map_id: number = 1;
            let manufacturer_id: number  = 1;

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
     * @param currentParams - A partial object containing user-friendly building parameters.
     * @returns {string} A formatted string summarizing the provided dimensions, or an empty string if none are found.
     */

    private formatDimensionsResponse(currentParams: Partial<UserFriendlyParams>): string
    {
        const dimensions: string = (["width", "length", "height"] as const)
            .filter((k) => currentParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${currentParams[k]}ft.`)
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

        const session: LeadAgentSessionMetadata = this.getOrCreateSession(sessionId);

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

        // FIRST: Check if user is updating existing parameters (single or multiple)
        const paramUpdate = await this.detectParameterUpdate(input);

        if (paramUpdate)
        {
            // Handle multiple pending updates if detected
            const pendingUpdates = (this as any).pendingUpdates || [];
            let allUpdateResults: {success: boolean, message: string, updatedField?: keyof UserFriendlyParams}[] = [];

            if (pendingUpdates.length > 0)
            {
                logger.info(`[LeadAgent] Processing ${pendingUpdates.length} pending updates`, JSON.stringify(pendingUpdates));

                // Process all updates
                for (const update of pendingUpdates)
                {
                    logger.info(`[LeadAgent] Validating update: ${update.field} = ${update.value}`);

                    // Validate the parameter update
                    if (update.field === "state_name")
                    {
                        const validationResult = await StateDataValidator.validateState(
                            update.value,
                            async (name: string) => await this.mapStateToDB(name, this.getOrCreateSession("temp"))
                        );

                        if (!validationResult.isValid)
                        {
                            const errorMessage = `❌ "${update.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
                            await session.memory.chatHistory.addAIChatMessage(errorMessage);
                            return errorMessage;
                        }
                        update.value = validationResult.normalizedName;
                    }

                    if (update.field === "roof_type")
                    {
                        const validationResult = await RoofDataValidator.validateRoofType(update.value);
                        if (!validationResult.isValid)
                        {
                            const errorMessage = `❌ "${update.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
                            await session.memory.chatHistory.addAIChatMessage(errorMessage);
                            return errorMessage;
                        }
                        update.value = validationResult.normalizedType;
                    }

                    const updateResult = await this.handleParameterUpdate(session, update);
                    allUpdateResults.push(updateResult);

                    logger.info(`[LeadAgent] Update result for ${update.field}:`, updateResult);

                    if (!updateResult.success)
                    {
                        await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                        return updateResult.message;
                    }
                }
                (this as any).pendingUpdates = [];

                logger.info(`[LeadAgent] Final session params after all updates:`, JSON.stringify(session.state.userFriendlyParams));

                // Build response for all updates
                const allUpdatesMessage = allUpdateResults
                    .map((result, idx) => {
                        const update = pendingUpdates[idx];
                        const val = (session.state.userFriendlyParams as any)[update.field];
                        const suffix = ["width", "length", "height", "gauge"].includes(update.field) ? "ft." : "";
                        return `${update.field}: ${val}${suffix ? ' ' + suffix : ''}`;
                    })
                    .join(" | ");

                const response1 = `✓ Updated: ${allUpdatesMessage}`;
                await session.memory.chatHistory.addAIChatMessage(response1);
                logger.info(`[LeadAgent] Multi-param update response: ${response1}`);
            }
            else
            {
                // Single parameter update
                if (paramUpdate.field === "state_name")
                {
                    const validationResult = await StateDataValidator.validateState(
                        paramUpdate.value,
                        async (name: string) => await this.mapStateToDB(name, this.getOrCreateSession("temp"))
                    );

                    if (!validationResult.isValid)
                    {
                        const errorMessage = `❌ "${paramUpdate.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    paramUpdate.value = validationResult.normalizedName;
                }

                if (paramUpdate.field === "roof_type")
                {
                    const validationResult = await RoofDataValidator.validateRoofType(paramUpdate.value);
                    if (!validationResult.isValid)
                    {
                        const errorMessage = `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    paramUpdate.value = validationResult.normalizedType;
                }

                const updateResult = await this.handleParameterUpdate(session, paramUpdate);
                allUpdateResults.push(updateResult);

                if (!updateResult.success)
                {
                    await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                    return updateResult.message;
                }
            }

            // After all updates, check if all required fields are complete
            const missingFields: (keyof UserFriendlyParams)[] = this.getMissingFields(session.state.userFriendlyParams);

            if (missingFields.length === 0)
            {
                const confirmMessage = `✓ All parameters set! Calculating price...`;
                await session.memory.chatHistory.addAIChatMessage(confirmMessage);

                const technicalParams: IPricingParams | null = await this.convertToTechnicalParams(session.state.userFriendlyParams as UserFriendlyParams, session);
                if (technicalParams)
                {
                    const priceResult: string = await PriceParamsExtractorTool.getInstance().calculatePriceWithParams(technicalParams);
                    const finalResponse: string = priceResult + "\n\nNeed another quote? Just describe what you're looking for!";
                    await session.memory.chatHistory.addAIChatMessage(priceResult);
                    this.resetSessionState(session);
                    return finalResponse;
                }
            }
            else
            {
                const nextField: keyof UserFriendlyParams = missingFields[0];
                session.state.currentField = nextField;

                // Build response showing current params + what's needed next
                const currentParams = this.formatCurrentParams(session.state.userFriendlyParams);
                const response: string = `${currentParams}\n\n${Constants.FIELD_PROMPTS[nextField]}`;

                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
        }

        // SECOND: Extract new parameters from user input
        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const rawParams: string = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);

        const extractedParams: Partial<UserFriendlyParams> = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Safe extracted user-friendly params:`, extractedParams);

        if (extractedParams.state_name)
        {
            const validationResult = await StateDataValidator.validateState(
                extractedParams.state_name,
                async (name: string) => await this.mapStateToDB(name, this.getOrCreateSession("temp"))
            );

            if (!validationResult.isValid)
            {
                const errorMessage = `❌ "${extractedParams.state_name}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}\n\nPlease specify your state.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.state_name = validationResult.normalizedName;
        }

        if (extractedParams.roof_type)
        {
            const validationResult = await RoofDataValidator.validateRoofType(extractedParams.roof_type);
            if (!validationResult.isValid)
            {
                const errorMessage = `❌ "${extractedParams.roof_type}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}\n\nPlease specify your roof type.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.roof_type = validationResult.normalizedType;
        }

        // Only add extracted params that don't already exist in session
        const filteredExtractedParams: Partial<UserFriendlyParams> = {};
        for (const [key, value] of Object.entries(extractedParams))
        {
            if (value !== undefined && value !== null && !session.state.userFriendlyParams[key as keyof UserFriendlyParams])
            {
                (filteredExtractedParams as any)[key as keyof UserFriendlyParams] = value;
            }
        }

        session.state.userFriendlyParams = {
            ...session.state.userFriendlyParams,
            ...filteredExtractedParams
        };

        const missingFields: (keyof UserFriendlyParams)[] = this.getMissingFields(session.state.userFriendlyParams);

        if (missingFields.length > 0)
        {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            session.state.currentField = nextField;

            const response: string = this.formatDimensionsResponse(
                session.state.userFriendlyParams
            ) + Constants.FIELD_PROMPTS[nextField];

            logger.info(`[LeadAgent] Missing field: ${nextField}, prompting user`);
            await session.memory.chatHistory.addAIChatMessage(response);
            return response;
        }

        const technicalParams: IPricingParams | null = await this.convertToTechnicalParams(session.state.userFriendlyParams as UserFriendlyParams, session);

        if (!technicalParams)
        {
            return "Failed to convert user input to technical parameters.";
        }

        const result: string = await PriceParamsExtractorTool.getInstance().calculatePriceWithParams(technicalParams);
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
     * Format current parameters for display
     */
    private formatCurrentParams(params: Partial<UserFriendlyParams>): string
    {
        const parts: string[] = [];

        if (params.width) parts.push(`Width: ${params.width}ft`);
        if (params.length) parts.push(`Length: ${params.length}ft`);
        if (params.height) parts.push(`Height: ${params.height}ft`);
        if (params.roof_type) parts.push(`Roof: ${params.roof_type}`);
        if (params.state_name) parts.push(`State: ${params.state_name}`);
        if (params.gauge) parts.push(`Gauge: ${params.gauge}`);

        return parts.length > 0 ? `📋 Current parameters: ${parts.join(" | ")}` : "";
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
