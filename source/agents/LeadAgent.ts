import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { sharedLLM } from "@llm/SharedLLM";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import {
    LeadAgentSessionMetadata,
    RoofMappingResult,
    StateMapping,
    UserFriendlyParams
} from "@agents/tools/io/IChat";
import { Constants } from "@common/io/Constants";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { RedisCacheUtils } from "@utils/cache/RedisCacheUtils";
import { SessionManager } from "@utils/session/SessionManager";
import { SessionMetadata } from "@utils/session/io/ISession";
import { StateDataValidator } from "@agents/validators/StateValidator";
import { RoofDataValidator } from "@agents/validators/RoofValidator";
import { DynamicGarageDimensionCalculator } from "@utils/dimensionCalculator/DimensionCalculator";
import {ChoiceResult, GenericChoiceManager} from "@agents/tools/impl/ChoiceHandler";

const logger: pino.Logger = createLogger(module);

/**
 * Interface for parameter update operations
 */
interface ParameterUpdate {
    field: keyof UserFriendlyParams;
    value: any;
}

/**
 * Interface for update operation results
 */
interface UpdateResult {
    success: boolean;
    message: string;
    updatedField?: keyof UserFriendlyParams;
}

export class LeadAgent {
    private static instance: LeadAgent;
    private sessionManager: SessionManager;
    private cacheUtils: RedisCacheUtils;
    private choiceManager: GenericChoiceManager;
    private currentSessionId: string | null = null;
    private validationError: string | null = null;
    private pendingUpdates: ParameterUpdate[] = [];

    private constructor(enforce: () => void, cacheUtils: RedisCacheUtils) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use LeadAgent.getInstance() instead of new."
            );
        }

        this.cacheUtils = cacheUtils;
        this.choiceManager = new GenericChoiceManager();

        this.sessionManager = SessionManager.getInstance({
            SESSION_TIMEOUT: 30 * 60 * 1000,
            CLEANUP_INTERVAL: 5 * 60 * 1000,
            WARNING_THRESHOLD: 5 * 60 * 1000,
        });
    }

    public static async getInstance(): Promise<LeadAgent> {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce, RedisCacheUtils.getInstance());
        }
        return LeadAgent.instance;
    }

    /**
     * ✅ USE CASE 1: Handle roof type selection with ChoiceHandler
     *
     * WHEN: User is asked "Which roof style would you prefer?"
     * USER SAYS: "any", "vertical", "1", "whatever", etc.
     * WHAT HAPPENS: ChoiceHandler intelligently picks the right option
     */
    private async handleRoofTypeSelection(userInput: string): Promise<ChoiceResult> {
        try {
            logger.info("[LeadAgent] Handling roof type selection:", userInput);

            // Use ChoiceManager to parse user response
            const choice = await this.choiceManager.handleChoice("roof_type", userInput);

            logger.info(`[LeadAgent] Roof type selected: ${choice.selected} (confidence: ${choice.confidence})`);
            logger.info(`[LeadAgent] Reasoning: ${choice.reasoning}`);

            return choice;
        } catch (error) {
            logger.error("[LeadAgent] Roof type selection failed:", error);
            throw error;
        }
    }

    /**
     * ✅ USE CASE 2: Handle building type selection
     *
     * WHEN: User is asked "What type of building?"
     * USER SAYS: "garage", "shed", "barn", "something", "any", etc.
     */
    // private async handleBuildingTypeSelection(userInput: string): Promise<ChoiceResult> {
    //     try {
    //         logger.info("[LeadAgent] Handling building type selection:", userInput);
    //
    //         const choice = await this.choiceManager.handleChoice("building_type", userInput);
    //
    //         logger.info(`[LeadAgent] Building type selected: ${choice.selected}`);
    //
    //         return choice;
    //     } catch (error) {
    //         logger.error("[LeadAgent] Building type selection failed:", error);
    //         throw error;
    //     }
    // }

    /**
     * ✅ USE CASE 3: Get prompt for asking user
     *
     * WHEN: Need to ask user to choose between options
     * RETURNS: Formatted question with numbered options
     */
    private getRoofTypePrompt(): string {
        return this.choiceManager.getPrompt("roof_type");
    }

    private getBuildingTypePrompt(): string {
        return this.choiceManager.getPrompt("building_type");
    }

    /**
     * ✅ USE CASE 4: Check if user response is a clear choice
     *
     * WHEN: Want to know if user clearly selected something
     * RETURNS: true if "vertical", "1", etc. / false if "any", "whatever"
     */
    private isClearRoofChoice(userInput: string): boolean {
        // Get options from choice manager
        const options = [
            { value: "vertical", label: "Vertical" },
            { value: "regular", label: "Regular" },
            { value: "box", label: "Box" }
        ];

        const lowerInput = userInput.toLowerCase().trim();

        // Check for number (1, 2, 3)
        const numberMatch = userInput.match(/^\d+$/);
        if (numberMatch) {
            const index = parseInt(userInput) - 1;
            return index >= 0 && index < options.length;
        }

        // Check if matches any option
        return options.some(opt =>
            opt.value.toLowerCase() === lowerInput ||
            opt.label.toLowerCase() === lowerInput
        );
    }

    // ============================================================================
    // EXISTING METHODS (unchanged)
    // ============================================================================

    private async detectGarageIntentWithAI(input: string): Promise<boolean> {
        try {
            const prompt: string = Constants.INTENT_PROMPT.replace("{input}", input);
            logger.info("[LeadAgent] Intent detection prompt:", prompt);

            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const upperResponse: string = response.trim().toUpperCase();

            logger.info("[LeadAgent] Intent detection response:", upperResponse);
            return upperResponse.includes("YES");
        } catch (error) {
            logger.warn("[LeadAgent] AI intent detection failed, using fallback:", error);
            return this.detectGarageIntentFallback(input);
        }
    }

    private detectGarageIntentFallback(input: string): boolean {
        const lowerInput: string = input.toLowerCase();
        return Array.from(Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }

    private async detectParameterUpdate(input: string): Promise<ParameterUpdate | null> {
        const lowerInput = input.toLowerCase();

        const carCountMatch = input.match(/(\d+)\s*cars?/i);
        if (carCountMatch) {
            const updateResult = this.handleCarCountUpdate(carCountMatch[1]);
            if (updateResult) return updateResult;
        }

        const multiParamResult = this.extractMultipleParametersByRegex(lowerInput);
        if (multiParamResult && multiParamResult.length > 0) {
            logger.info(`[LeadAgent] Regex extracted ${multiParamResult.length} parameters`);

            for (const param of multiParamResult) {
                const validationError = await this.validateParameterValue(param.field, param.value);
                if (validationError) {
                    logger.warn(`[LeadAgent] Validation failed for ${param.field}: ${validationError}`);
                    this.validationError = validationError;
                    return null;
                }
            }

            this.pendingUpdates = multiParamResult;
            return multiParamResult[0];
        }

        const regexResult = this.extractParameterByRegex(lowerInput);
        if (regexResult) {
            logger.info(`[LeadAgent] Regex extracted update: ${regexResult.field} = ${regexResult.value}`);

            const validationError = await this.validateParameterValue(regexResult.field, regexResult.value);
            if (validationError) {
                logger.warn(`[LeadAgent] Validation failed for ${regexResult.field}: ${validationError}`);
                this.validationError = validationError;
                return null;
            }

            return regexResult;
        }

        const hasUpdateIntent = this.hasUpdateIntent(input);
        if (!hasUpdateIntent) return null;

        return await this.detectParameterUpdateWithAI(input);
    }

    private handleCarCountUpdate(carCount: string): ParameterUpdate | null {
        const newCarCount = parseInt(carCount, 10);

        if (!this.currentSessionId) {
            logger.warn("[LeadAgent] No current session ID available");
            return null;
        }

        const sessionData = this.sessionManager.getSession(
            this.currentSessionId
        ) as LeadAgentSessionMetadata;

        const currentParams = sessionData?.state?.userFriendlyParams;
        const currentGarageType = currentParams?.garage_type as string;
        const currentCarCountMatch = currentGarageType?.match(/(\d+)-car/);
        const currentCarCount = currentCarCountMatch
            ? parseInt(currentCarCountMatch[1], 10)
            : null;

        logger.info(
            `[LeadAgent] Car count check - Current: ${currentCarCount}, New: ${newCarCount}`
        );

        if (currentCarCount !== null && currentCarCount !== newCarCount) {
            logger.info(
                `[LeadAgent] Car count CHANGED from ${currentCarCount} to ${newCarCount}`
            );
            return {
                field: "garage_type",
                value: `${newCarCount}-car`,
            };
        }

        if (currentCarCount === null && newCarCount) {
            logger.info(`[LeadAgent] Initial car count set to ${newCarCount}`);
            return {
                field: "garage_type",
                value: `${newCarCount}-car`,
            };
        }

        return null;
    }

    private hasUpdateIntent(input: string): boolean {
        const updatePatterns = [
            /\b(change|update|correct|fix|actually|wait|let me|make|set)\b/i,
            /\b(width|length|height|roof|state|gauge)\b/i,
        ];

        return updatePatterns.some((p) => p.test(input));
    }

    private async detectParameterUpdateWithAI(input: string): Promise<ParameterUpdate | null> {
        try {
            const prompt = `Given this user message: "${input}"

Extract the parameter update:
1. Which parameter? (width, length, height, roof_type, state_name, gauge, building_type)
2. What is the NEW value?

Respond ONLY with JSON - no markdown, no explanation:
{"isUpdate": true, "field": "width", "value": 25}
or
{"isUpdate": false}`;

            const responseText: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
            logger.info(`[LeadAgent] AI update detection response: ${responseText}`);

            const cleanedResponse = responseText
                .replace(/^```json\s*/g, "")
                .replace(/^```\s*/g, "")
                .replace(/\s*```$/g, "")
                .trim();

            const response = JSON.parse(cleanedResponse);

            if (
                response.isUpdate &&
                response.field &&
                response.value !== undefined &&
                response.value !== null
            ) {
                logger.info(`[LeadAgent] AI detected update: ${response.field} = ${response.value}`);

                const validationError = await this.validateParameterValue(
                    response.field,
                    response.value
                );
                if (validationError) {
                    logger.warn(
                        `[LeadAgent] Validation failed for ${response.field}: ${validationError}`
                    );
                    this.validationError = validationError;
                    return null;
                }

                return {
                    field: response.field as keyof UserFriendlyParams,
                    value: response.value,
                };
            }
        } catch (error) {
            logger.warn("[LeadAgent] AI update detection failed:", error);
        }

        return null;
    }

    private async validateParameterValue(
        field: keyof UserFriendlyParams,
        value: any
    ): Promise<string | null> {
        if (field === "roof_type") {
            const validationResult = await RoofDataValidator.validateRoofType(value);
            if (!validationResult.isValid) {
                return `❌ "${value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
            }
        }

        if (field === "state_name") {
            if (!this.currentSessionId) return "❌ No active session";

            const sessionData = this.sessionManager.getSession(
                this.currentSessionId
            ) as LeadAgentSessionMetadata;
            const validationResult = await StateDataValidator.validateState(
                value,
                async (name: string) => await this.mapStateToDB(name, sessionData)
            );
            if (!validationResult.isValid) {
                return `❌ "${value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
            }
        }

        if (["width", "length", "height", "gauge", "utility_length"].includes(field as string)) {
            let numValue: number;
            if (typeof value === "string") {
                numValue = parseFloat(value.replace(/[^\d.]/g, ""));
            } else if (typeof value === "number") {
                numValue = value;
            } else {
                numValue = NaN;
            }

            if (isNaN(numValue) || numValue <= 0) {
                return `❌ Invalid ${field}. Please provide a positive number (e.g., "make ${field} 25").`;
            }
        }

        return null;
    }

    private extractMultipleParametersByRegex(input: string): ParameterUpdate[] | null {
        const updates: ParameterUpdate[] = [];

        logger.info(`[extractMultipleParametersByRegex] Processing input: "${input}"`);

        const widthMatch = input.match(/\bwidth\s+(\d+(?:\.\d+)?)\b/);
        const lengthMatch = input.match(/\blength\s+(\d+(?:\.\d+)?)\b/);
        const heightMatch = input.match(/\bheight\s+(\d+(?:\.\d+)?)\b/);
        const gaugeMatch = input.match(/\bgauge\s+(\d+(?:\.\d+)?)\b/);

        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "width", value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added width: ${value}`);
            }
        }
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "length", value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added length: ${value}`);
            }
        }
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "height", value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added height: ${value}`);
            }
        }
        if (gaugeMatch) {
            const value = parseFloat(gaugeMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "gauge", value });
                logger.info(`[extractMultipleParametersByRegex] ✓ Added gauge: ${value}`);
            }
        }

        if (updates.length === 0) {
            const dimensionMatch = input.match(
                /(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/
            );
            if (dimensionMatch) {
                updates.push(
                    { field: "width", value: parseFloat(dimensionMatch[1]) },
                    { field: "length", value: parseFloat(dimensionMatch[2]) },
                    { field: "height", value: parseFloat(dimensionMatch[3]) }
                );
                logger.info(
                    `[extractMultipleParametersByRegex] Matched dimensions: ${dimensionMatch[1]}x${dimensionMatch[2]}x${dimensionMatch[3]}`
                );
            }
        }

        return updates.length > 0 ? updates : null;
    }

    private extractParameterByRegex(input: string): ParameterUpdate | null {
        const patterns = [
            {
                regex: /^\s*(vert(?:ical)?|a-?frame|aframe|box|box-?style|regular|standard|normal|pitched|gabled|sidewall)\s*$/i,
                parse: (match: RegExpMatchArray) => {
                    let value = match[1].toLowerCase();
                    if (value === "vert") value = "vertical";
                    return { field: "roof_type", value };
                },
            },
            {
                regex: /(?:want|in|make|set|change|update|roof|style|to)\s+(?:to\s+)?(vert(?:ical)?|a-?frame|aframe|box|box-?style|regular|standard|normal|pitched|gabled|sidewall)/i,
                parse: (match: RegExpMatchArray) => {
                    let value = match[1].toLowerCase();
                    if (value === "vert") value = "vertical";
                    return { field: "roof_type", value };
                },
            },
            {
                regex: /(?:make|set|change|update)?\s*(?:the\s+)?(width|length|height)\s+(?:to\s+)?(\d+)/i,
                parse: (match: RegExpMatchArray) => ({
                    field: match[1].toLowerCase() as any,
                    value: parseFloat(match[2]),
                }),
            },
            {
                regex: /(?:make|set|change|update)?\s*gauge\s+(?:to\s+)?(\d+)/i,
                parse: (match: RegExpMatchArray) => ({
                    field: "gauge",
                    value: parseFloat(match[1]),
                }),
            },
            {
                regex: /\b(?:state|location|in)\s+([a-z\s]+?)(?:\s*(?:\.|$|,|and))/i,
                parse: (match: RegExpMatchArray) => ({
                    field: "state_name",
                    value: match[1].trim(),
                }),
            },
        ];

        for (const pattern of patterns) {
            const match = input.match(pattern.regex);
            if (match) {
                try {
                    const result = pattern.parse(match);
                    if (result && result.value !== null && result.value !== undefined) {
                        logger.info(`[extractParameterByRegex] Matched ${result.field} = ${result.value}`);
                        return result as ParameterUpdate;
                    }
                } catch (e) {
                    logger.warn("[extractParameterByRegex] Parse error:", e);
                }
            }
        }

        return null;
    }

    private handleParameterUpdate(
        session: LeadAgentSessionMetadata,
        update: ParameterUpdate
    ): UpdateResult {
        const { field, value } = update;

        logger.info(
            `[LeadAgent] Attempting to update ${field} from ${
                (session.state.userFriendlyParams as any)[field]
            } to ${value}`
        );

        if (field === "garage_type") {
            return this.handleGarageTypeUpdate(session, value);
        }

        if (["width", "length", "height", "gauge", "utility_length"].includes(field)) {
            return this.handleNumericUpdate(session, field, value);
        }

        return this.handleStringUpdate(session, field, value);
    }

    private handleGarageTypeUpdate(session: LeadAgentSessionMetadata, value: any): UpdateResult {
        const carCountMatch = String(value).match(/(\d+)/);
        const numCars = carCountMatch ? parseInt(carCountMatch[1], 10) : null;

        logger.info(`[LeadAgent] Processing garage_type: ${value}, extracted numCars: ${numCars}`);

        if (numCars && numCars > 0) {
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${numCars} cars`
            );
            logger.info("[LeadAgent] Calculation result:", JSON.stringify(calculation));

            if (calculation.width && calculation.length) {
                (session.state.userFriendlyParams as any).width = calculation.width;
                (session.state.userFriendlyParams as any).length = calculation.length;
                (session.state.userFriendlyParams as any).height = calculation.height;
                (session.state.userFriendlyParams as any).garage_type = calculation.garageType;

                logger.info(
                    `[LeadAgent] Recalculated dimensions: ${calculation.width}×${calculation.length}×${calculation.height}`
                );

                return {
                    success: true,
                    message: `✓ Updated to ${calculation.numCars}-car garage (${calculation.width}ft × ${calculation.length}ft × ${calculation.height}ft)`,
                    updatedField: "garage_type",
                };
            }
        }

        logger.warn(`[LeadAgent] Failed to calculate dimensions for garage_type: ${value}`);
        return {
            success: false,
            message: `❌ Could not calculate dimensions for ${value}`,
        };
    }

    private handleNumericUpdate(
        session: LeadAgentSessionMetadata,
        field: keyof UserFriendlyParams,
        value: any
    ): UpdateResult {
        let numValue: number;

        if (typeof value === "string") {
            numValue = parseFloat(value.replace(/[^\d.]/g, ""));
        } else if (typeof value === "number") {
            numValue = value;
        } else {
            numValue = NaN;
        }

        if (isNaN(numValue) || numValue <= 0) {
            logger.warn(`[LeadAgent] Invalid ${field} value: ${value}`);
            return {
                success: false,
                message: `❌ Invalid ${field}. Please provide a positive number.`,
            };
        }

        (session.state.userFriendlyParams as any)[field] = numValue;
        logger.info(`[LeadAgent] Successfully updated ${field} to ${numValue}`);

        return {
            success: true,
            message: `✓ Updated ${this.formatFieldName(field)} to ${numValue} ft.`,
            updatedField: field,
        };
    }

    private handleStringUpdate(
        session: LeadAgentSessionMetadata,
        field: keyof UserFriendlyParams,
        value: any
    ): UpdateResult {
        (session.state.userFriendlyParams as any)[field] = String(value).trim();
        logger.info(`[LeadAgent] Successfully updated ${field} to ${value}`);

        return {
            success: true,
            message: `✓ Updated ${this.formatFieldName(field)} to ${value}`,
            updatedField: field,
        };
    }

    private formatFieldName(field: keyof UserFriendlyParams): string {
        return field.charAt(0).toUpperCase() + field.slice(1).replace(/_/g, " ");
    }

    private getOrCreateSession(sessionId: string): LeadAgentSessionMetadata {
        const existingSession: SessionMetadata = this.sessionManager.getSession(sessionId);

        if (existingSession && this.sessionManager.isSessionValid(sessionId)) {
            this.sessionManager.updateLastActivity(sessionId);
            return existingSession as LeadAgentSessionMetadata;
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

    private async getConversationContext(session: LeadAgentSessionMetadata): Promise<string> {
        const history: BaseMessage[] = await session.memory.chatHistory.getMessages();
        return history.map((msg) => this.getMessageString(msg.content)).join("\n");
    }

    private getMessageString(content: string | any[]): string {
        if (typeof content === "string") {
            return content;
        }

        if (Array.isArray(content)) {
            return content
                .map((c) => (typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)))
                .join(" ");
        }

        return String(content);
    }

    private async mapStateToDB(
        stateName: string,
        session: LeadAgentSessionMetadata,
        preferredBuildingId = 1
    ): Promise<StateMapping | null> {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        const cachedState = session.stateMapCache.get(cacheKey);

        if (cachedState !== undefined) {
            return cachedState;
        }

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [stateName],
                "getMapIdByStateName(?)",
                "getMapIdByStateName"
            );

            if (result?.length > 0) {
                const preferredMapping = result.find(
                    (item: any) => item.building_id === preferredBuildingId
                );
                const mapping = preferredMapping || result[0];
                const output: StateMapping = {
                    map_id: mapping.map_id,
                    manufacturer_id: mapping.manufacturer_id,
                };
                await this.cacheUtils.put(cacheKey, output);
                session.stateMapCache.set(cacheKey, output);
                return output;
            }

            await this.cacheUtils.put(cacheKey, null);
            session.stateMapCache.set(cacheKey, null);
            return null;
        } catch (error) {
            logger.error("[LeadAgent] State mapping failed:", error);
            session.stateMapCache.set(cacheKey, null);
            return null;
        }
    }

    private async mapRoofTypeToDB(
        roofType: string,
        mapId: number,
        session: LeadAgentSessionMetadata
    ): Promise<number> {
        const normalizedRoofType: string = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        const cachedRoofId: number = await this.cacheUtils.get(cacheKey);
        if (cachedRoofId) {
            return cachedRoofId;
        }

        try {
            const result: RoofMappingResult[] = await ProcedureExecutor.getProcedureData<RoofMappingResult>(
                [mapId, roofType],
                "getRoofIdByType(?, ?)",
                "roof_mapping"
            );

            if (result?.length > 0) {
                session.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        } catch (error) {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }

        const fallbackId: number = Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ??
            (normalizedRoofType.includes("vertical")
                ? 1
                : normalizedRoofType.includes("box")
                    ? 3
                    : 2);

        await this.cacheUtils.put(cacheKey, fallbackId);
        return fallbackId;
    }

    private async convertToTechnicalParams(
        userParams: UserFriendlyParams,
        session: LeadAgentSessionMetadata
    ): Promise<IPricingParams | null> {
        try {
            let map_id: number = 1;
            let manufacturer_id: number = 1;

            if (userParams.state_name) {
                const mapping: StateMapping | null = await this.mapStateToDB(
                    userParams.state_name,
                    session
                );

                if (mapping) {
                    map_id = mapping.map_id;
                    manufacturer_id = mapping.manufacturer_id;
                } else {
                    logger.warn(`[LeadAgent] State "${userParams.state_name}" not found, using defaults.`);
                }
            }

            const roof_id: number = userParams.roof_type
                ? await this.mapRoofTypeToDB(userParams.roof_type, map_id, session)
                : 2;

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
        } catch (error) {
            logger.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }

    private getMissingFields(params: Partial<UserFriendlyParams>): (keyof UserFriendlyParams)[] {
        return Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }

    // private formatDimensionsResponse(currentParams: Partial<UserFriendlyParams>): string {
    //     const dimensions: string = (["width", "length", "height"] as const)
    //         .filter((k) => currentParams[k])
    //         .map((k) => `${this.formatFieldName(k)}: ${currentParams[k]}ft`)
    //         .join(" | ");
    //
    //     return dimensions ? `Got it! ${dimensions}\n\n` : "";
    // }

    private formatCurrentParams(params: Partial<UserFriendlyParams>): string {
        const parts: string[] = [];

        if (params.width) parts.push(`Width: ${params.width}ft`);
        if (params.length) parts.push(`Length: ${params.length}ft`);
        if (params.height) parts.push(`Height: ${params.height}ft`);
        if (params.roof_type) parts.push(`Roof: ${params.roof_type}`);
        if (params.state_name) parts.push(`State: ${params.state_name}`);
        if (params.gauge) parts.push(`Gauge: ${params.gauge}`);

        return parts.length > 0 ? `📋 Current parameters: ${parts.join(" | ")}` : "";
    }

    private resetSessionState(session: LeadAgentSessionMetadata, fullReset: boolean = false): void {
        if (fullReset) {
            // Only reset when user explicitly starts over
            session.state.userFriendlyParams = {};
            session.state.hasGarageIntent = false;
            session.state.currentField = undefined;
            session.state.priceCalculated = false;
        } else {
            // Partial reset: keep parameters, just clear current field
            session.state.currentField = undefined;
            session.state.priceCalculated = true;
        }
    }

    /**
     * MAIN: Process user input and generate response
     *
     * ✅ WHERE CHOICE HANDLER IS USED:
     * This is integrated throughout the run() method to handle user selections
     */
    public async run(sessionId: string, input: string): Promise<string> {
        this.currentSessionId = sessionId;
        this.validationError = null;
        this.pendingUpdates = [];

        logger.info(`[LeadAgent] Session ${sessionId} - User input:`, input);

        const session: LeadAgentSessionMetadata = this.getOrCreateSession(sessionId);
        await session.memory.chatHistory.addUserMessage(input);

        // ✅ AFTER PRICE: Check if price was already calculated
        if (session.state.priceCalculated) {
            logger.info(`[LeadAgent] Post-price phase - User trying to update`);

            // Check if user wants to completely reset
            if (this.detectResetIntent(input)) {
                logger.info(`[LeadAgent] User requested full reset`);
                this.resetSessionState(session, true);
                session.state.hasGarageIntent = false;
                const response: string =
                    "Got it! Let's start fresh.\n" +
                    "Tell me about your new building - dimensions or building type?";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            // Try to detect what parameter user wants to change
            const paramUpdate = await this.detectParameterUpdate(input);

            if (paramUpdate === null) {
                if (this.validationError) {
                    logger.warn(`[LeadAgent] Validation error: ${this.validationError}`);
                    const error = this.validationError;
                    this.validationError = null;
                    await session.memory.chatHistory.addAIChatMessage(error);
                    return error;
                }

                // User said something but we couldn't detect an update
                // Show current params and ask what they want to change
                const currentParams = this.formatCurrentParams(session.state.userFriendlyParams);
                const response =
                    `${currentParams}\n\n` +
                    "What would you like to change? (e.g., 'change width to 30', 'make roof box', 'different state')\n" +
                    "Or type 'new quote' to start over.";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            // ✅ Update the parameter and recalculate price
            const updateResult = await this.handleParameterUpdateAfterPrice(session, paramUpdate);

            if (!updateResult.success) {
                await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                return updateResult.message;
            }

            // Show update confirmation
            await session.memory.chatHistory.addAIChatMessage(updateResult.message);
            logger.info(`[LeadAgent] Parameter updated: ${paramUpdate.field} = ${paramUpdate.value}`);

            // Recalculate price with updated parameters
            const technicalParams: IPricingParams | null = await this.convertToTechnicalParams(
                session.state.userFriendlyParams as UserFriendlyParams,
                session
            );

            if (!technicalParams) {
                return "Failed to recalculate price.";
            }

            const newPrice: string = await PriceParamsExtractorTool.getInstance().calculatePriceWithParams(
                technicalParams
            );

            const response =
                newPrice +
                "\n\n" +
                `${this.formatCurrentParams(session.state.userFriendlyParams)}\n` +
                "Want to change anything else?";

            await session.memory.chatHistory.addAIChatMessage(newPrice);
            return response;
        }

        // ============================================================
        // INITIAL QUOTE FLOW (Before first price calculation)
        // ============================================================

        // Step 1: Check if user has garage intent
        if (!session.state.hasGarageIntent) {
            const hasIntent: boolean = await this.detectGarageIntentWithAI(input);

            if (!hasIntent) {
                const response: string =
                    "Hello! I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            session.state.hasGarageIntent = true;
        }

        // Step 2: Extract building_type if mentioned
        if (!session.state.userFriendlyParams.building_type) {
            const detectedBuildingType = await this.detectBuildingTypeFromInitialInput(input);
            if (detectedBuildingType) {
                (session.state.userFriendlyParams as any).building_type = detectedBuildingType;
                logger.info(`[LeadAgent] Pre-filled building_type: ${detectedBuildingType}`);
                await session.memory.chatHistory.addAIChatMessage(
                    `✓ Got it - you're looking for a ${detectedBuildingType}!`
                );
            }
        }

        // Step 3: Check for parameter updates during initial flow
        const paramUpdate = await this.detectParameterUpdate(input);

        if (paramUpdate === null) {
            if (this.validationError) {
                logger.warn(`[LeadAgent] Validation error: ${this.validationError}`);
                const error = this.validationError;
                this.validationError = null;
                await session.memory.chatHistory.addAIChatMessage(error);
                return error;
            }
        }

        // Step 4: Process parameter updates during initial flow
        if (paramUpdate) {
            const updateResults = await this.processParameterUpdates(session, paramUpdate);
            if (updateResults) {
                return updateResults;
            }
        }

        // Step 5: Extract parameters from conversation context
        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const rawParams: string = await extractor._call(await this.getConversationContext(session));
        logger.info(`[LeadAgent] Session ${sessionId} - Raw params from extractor:`, rawParams);

        const extractedParams: Partial<UserFriendlyParams> = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info(`[LeadAgent] Session ${sessionId} - Extracted params:`, extractedParams);

        // Validate extracted parameters
        if (extractedParams.state_name) {
            const validationResult = await StateDataValidator.validateState(
                extractedParams.state_name,
                async (name: string) => await this.mapStateToDB(name, session)
            );

            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.state_name}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}\n\nPlease specify your state.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.state_name = validationResult.normalizedName;
        }

        if (extractedParams.roof_type) {
            const validationResult = await RoofDataValidator.validateRoofType(extractedParams.roof_type);
            if (!validationResult.isValid) {
                const errorMessage = `❌ "${extractedParams.roof_type}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}\n\nPlease specify your roof type.`;
                await session.memory.chatHistory.addAIChatMessage(errorMessage);
                return errorMessage;
            }
            extractedParams.roof_type = validationResult.normalizedType;
        }

        // Keep building_type if already detected
        if (extractedParams.building_type && !session.state.userFriendlyParams.building_type) {
            extractedParams.building_type = extractedParams.building_type;
        } else if (session.state.userFriendlyParams.building_type) {
            extractedParams.building_type = session.state.userFriendlyParams.building_type;
        }

        // Merge extracted parameters into session
        const filteredExtractedParams: Partial<UserFriendlyParams> = {};
        for (const [key, value] of Object.entries(extractedParams)) {
            if (
                value !== undefined &&
                value !== null &&
                !session.state.userFriendlyParams[key as keyof UserFriendlyParams]
            ) {
                (filteredExtractedParams as any)[key as keyof UserFriendlyParams] = value;
            }
        }

        session.state.userFriendlyParams = {
            ...session.state.userFriendlyParams,
            ...filteredExtractedParams,
        };

        // Step 6: Check for missing fields
        const missingFields: (keyof UserFriendlyParams)[] = this.getMissingFields(
            session.state.userFriendlyParams
        );

        if (missingFields.length > 0) {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            session.state.currentField = nextField;

            // Skip building_type if already filled
            if (nextField === "building_type" && session.state.userFriendlyParams.building_type) {
                logger.info("[LeadAgent] Building type already set, skipping");
                const updatedMissingFields = this.getMissingFields(session.state.userFriendlyParams);

                if (updatedMissingFields.length === 0) {
                    // All params filled, calculate price
                    return await this.calculateAndReturnPrice(session);
                } else {
                    // Ask for next field
                    const nextMissingField = updatedMissingFields[0];
                    return await this.askForField(session, nextMissingField);
                }
            }

            // Ask for missing field
            return await this.askForField(session, nextField);
        }

        // Step 7: All fields provided - Calculate price
        return await this.calculateAndReturnPrice(session);
    }

    private async handleParameterUpdateAfterPrice(
        session: LeadAgentSessionMetadata,
        paramUpdate: ParameterUpdate
    ): Promise<UpdateResult> {
        // Validate the update value
        const validationError = await this.validateParameterValue(paramUpdate.field, paramUpdate.value);
        if (validationError) {
            logger.warn(`[LeadAgent] Validation failed for ${paramUpdate.field}: ${validationError}`);
            return {
                success: false,
                message: validationError
            };
        }

        // For roof_type, use ChoiceHandler if not a clear choice
        if (paramUpdate.field === "roof_type") {
            if (!this.isClearRoofChoice(String(paramUpdate.value))) {
                const choice = await this.handleRoofTypeSelection(String(paramUpdate.value));
                paramUpdate.value = choice.selected;
                logger.info(`[LeadAgent] ChoiceHandler selected roof: ${choice.selected}`);
            }

            const validationResult = await RoofDataValidator.validateRoofType(paramUpdate.value);
            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`
                };
            }
            paramUpdate.value = validationResult.normalizedType;
        }

        // For state_name, validate it
        if (paramUpdate.field === "state_name") {
            const validationResult = await StateDataValidator.validateState(
                paramUpdate.value,
                async (name: string) => await this.mapStateToDB(name, session)
            );

            if (!validationResult.isValid) {
                return {
                    success: false,
                    message: `❌ "${paramUpdate.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`
                };
            }
            paramUpdate.value = validationResult.normalizedName;
        }

        // Apply the update
        return this.handleParameterUpdate(session, paramUpdate);
    }

    private async calculateAndReturnPrice(session: LeadAgentSessionMetadata): Promise<string> {
        const technicalParams: IPricingParams | null = await this.convertToTechnicalParams(
            session.state.userFriendlyParams as UserFriendlyParams,
            session
        );

        if (!technicalParams) {
            return "Failed to convert parameters to technical format.";
        }

        const result: string = await PriceParamsExtractorTool.getInstance().calculatePriceWithParams(
            technicalParams
        );

        await session.memory.chatHistory.addAIChatMessage(result);

        // ✅ Mark price as calculated so next input goes to update flow
        session.state.priceCalculated = true;
        session.state.currentField = undefined;

        const response =
            result +
            "\n\n" +
            `${this.formatCurrentParams(session.state.userFriendlyParams)}\n` +
            "Want to change anything? (e.g., 'change width to 30', 'make roof box')";

        return response;
    }


    private async askForField(session: LeadAgentSessionMetadata, field: keyof UserFriendlyParams): Promise<string> {
        let promptMessage = "";

        if (field === "roof_type") {
            promptMessage = this.getRoofTypePrompt();
        } else if (field === "building_type") {
            promptMessage = this.getBuildingTypePrompt();
        } else {
            const currentParams = this.formatCurrentParams(session.state.userFriendlyParams);
            promptMessage = `${currentParams}\n\n${Constants.FIELD_PROMPTS[field]}`;
        }

        session.state.currentField = field;
        await session.memory.chatHistory.addAIChatMessage(promptMessage);
        logger.info(`[LeadAgent] Asking for field: ${field}`);
        return promptMessage;
    }

    /**
     * Process parameter updates from user input
     *
     * ✅ USE CASE 6: When processing updates that might be choices
     * Example: If updating roof_type, check if it's a choice response first
     */
    private async processParameterUpdates(
        session: LeadAgentSessionMetadata,
        paramUpdate: ParameterUpdate
    ): Promise<string | null> {
        const pendingUpdates = this.pendingUpdates;
        let allUpdateResults: UpdateResult[] = [];

        if (pendingUpdates.length > 0) {
            logger.info(`[LeadAgent] Processing ${pendingUpdates.length} pending updates`);

            for (const update of pendingUpdates) {
                logger.info(`[LeadAgent] Validating update: ${update.field} = ${update.value}`);

                // Handle roof_type choice
                if (update.field === "roof_type") {
                    if (!this.isClearRoofChoice(String(update.value))) {
                        const choice = await this.handleRoofTypeSelection(String(update.value));
                        update.value = choice.selected;
                    }

                    const validationResult = await RoofDataValidator.validateRoofType(update.value);
                    if (!validationResult.isValid) {
                        const errorMessage = `❌ "${update.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    update.value = validationResult.normalizedType;
                }

                // Handle state_name
                if (update.field === "state_name") {
                    const validationResult = await StateDataValidator.validateState(
                        update.value,
                        async (name: string) => await this.mapStateToDB(name, session)
                    );

                    if (!validationResult.isValid) {
                        const errorMessage = `❌ "${update.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
                        await session.memory.chatHistory.addAIChatMessage(errorMessage);
                        return errorMessage;
                    }
                    update.value = validationResult.normalizedName;
                }

                const updateResult = await this.handleParameterUpdate(session, update);
                allUpdateResults.push(updateResult);

                if (!updateResult.success) {
                    await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                    return updateResult.message;
                }
            }

            this.pendingUpdates = [];

            const allUpdatesMessage = allUpdateResults
                .map((result) => result.message)
                .join(" | ");

            const response = `✓ Updated: ${allUpdatesMessage}`;
            await session.memory.chatHistory.addAIChatMessage(response);
            logger.info(`[LeadAgent] Multi-param update response: ${response}`);

            const missingFields = this.getMissingFields(session.state.userFriendlyParams);
            if (missingFields.length === 0) {
                return await this.calculateAndReturnPrice(session);
            } else {
                const nextField: keyof UserFriendlyParams = missingFields[0];
                return await this.askForField(session, nextField);
            }
        } else {
            // Single parameter update
            if (paramUpdate.field === "roof_type") {
                if (!this.isClearRoofChoice(String(paramUpdate.value))) {
                    const choice = await this.handleRoofTypeSelection(String(paramUpdate.value));
                    paramUpdate.value = choice.selected;
                }

                const validationResult = await RoofDataValidator.validateRoofType(paramUpdate.value);
                if (!validationResult.isValid) {
                    const errorMessage = `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
                    await session.memory.chatHistory.addAIChatMessage(errorMessage);
                    return errorMessage;
                }
                paramUpdate.value = validationResult.normalizedType;
            }

            if (paramUpdate.field === "state_name") {
                const validationResult = await StateDataValidator.validateState(
                    paramUpdate.value,
                    async (name: string) => await this.mapStateToDB(name, session)
                );

                if (!validationResult.isValid) {
                    const errorMessage = `❌ "${paramUpdate.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
                    await session.memory.chatHistory.addAIChatMessage(errorMessage);
                    return errorMessage;
                }
                paramUpdate.value = validationResult.normalizedName;
            }

            const updateResult = await this.handleParameterUpdate(session, paramUpdate);
            allUpdateResults.push(updateResult);

            if (!updateResult.success) {
                await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                return updateResult.message;
            }

            await session.memory.chatHistory.addAIChatMessage(updateResult.message);
            logger.info(`[LeadAgent] Single parameter updated:`, JSON.stringify(session.state.userFriendlyParams));

            const missingFields = this.getMissingFields(session.state.userFriendlyParams);
            if (missingFields.length === 0) {
                return await this.calculateAndReturnPrice(session);
            } else {
                const nextField: keyof UserFriendlyParams = missingFields[0];
                return await this.askForField(session, nextField);
            }
        }

        return null;
    }

    /**
     * Manually end a session
     */
    public async endSession(sessionId: string): Promise<void> {
        if (this.sessionManager.endSession(sessionId)) {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        } else {
            logger.warn(`[LeadAgent] Attempted to end non-existent session: ${sessionId}`);
        }
    }

    /**
     * Full reset (for testing/shutdown)
     */
    public async reset(): Promise<void> {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped.");
    }

    /**
     * Enhanced parameter extraction to detect building_type early
     * So we don't ask for it later
     */
    private async detectBuildingTypeFromInitialInput(input: string): Promise<string | null> {
        try {
            const lowerInput = input.toLowerCase();

            // Quick regex check for common patterns
            const buildingPatterns = [
                { pattern: /\bgarage\b/i, type: "garage" },
                { pattern: /\bshed\b/i, type: "shed" },
                { pattern: /\bbarn\b/i, type: "barn" },
                { pattern: /\bmetallic? building\b/i, type: "garage" },
                { pattern: /\bstructure\b/i, type: "garage" },
            ];

            for (const { pattern, type } of buildingPatterns) {
                if (pattern.test(lowerInput)) {
                    logger.info(`[LeadAgent] Detected building type from input: ${type}`);
                    return type;
                }
            }

            return null;
        } catch (error) {
            logger.warn("[LeadAgent] Error detecting building type:", error);
            return null;
        }
    }

    private detectResetIntent(input: string): boolean {
        const resetPatterns = [
            /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
            /\b(quit|exit|done with this)\b/i,
        ];
        return resetPatterns.some((p) => p.test(input));
    }

    // private async processParameterUpdatesPostPrice(
    //     session: LeadAgentSessionMetadata,
    //     paramUpdate: ParameterUpdate
    // ): Promise<string | null> {
    //     const pendingUpdates = this.pendingUpdates;
    //     let allUpdateResults: UpdateResult[] = [];
    //
    //     if (pendingUpdates.length > 0) {
    //         logger.info(`[LeadAgent] Processing ${pendingUpdates.length} pending post-price updates`);
    //
    //         for (const update of pendingUpdates) {
    //             logger.info(`[LeadAgent] Validating post-price update: ${update.field} = ${update.value}`);
    //
    //             // ✅ SPECIAL CASE: Check if this is a roof_type choice response
    //             if (update.field === "roof_type") {
    //                 if (this.isClearRoofChoice(String(update.value))) {
    //                     logger.info(`[LeadAgent] Direct roof choice matched: ${update.value}`);
    //                 } else {
    //                     const choice = await this.handleRoofTypeSelection(String(update.value));
    //                     logger.info(`[LeadAgent] ChoiceHandler selected: ${choice.selected}`);
    //                     update.value = choice.selected;
    //                 }
    //
    //                 const validationResult = await RoofDataValidator.validateRoofType(update.value);
    //                 if (!validationResult.isValid) {
    //                     const errorMessage = `❌ "${update.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
    //                     await session.memory.chatHistory.addAIChatMessage(errorMessage);
    //                     return errorMessage;
    //                 }
    //                 update.value = validationResult.normalizedType;
    //             }
    //
    //             // ✅ SPECIAL CASE: Check if this is a state_name response
    //             if (update.field === "state_name") {
    //                 const validationResult = await StateDataValidator.validateState(
    //                     update.value,
    //                     async (name: string) => await this.mapStateToDB(name, session)
    //                 );
    //
    //                 if (!validationResult.isValid) {
    //                     const errorMessage = `❌ "${update.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
    //                     await session.memory.chatHistory.addAIChatMessage(errorMessage);
    //                     return errorMessage;
    //                 }
    //                 update.value = validationResult.normalizedName;
    //             }
    //
    //             const updateResult = await this.handleParameterUpdate(session, update);
    //             allUpdateResults.push(updateResult);
    //
    //             if (!updateResult.success) {
    //                 await session.memory.chatHistory.addAIChatMessage(updateResult.message);
    //                 return updateResult.message;
    //             }
    //         }
    //
    //         this.pendingUpdates = [];
    //
    //         const allUpdatesMessage = allUpdateResults
    //             .map((result) => result.message)
    //             .join(" | ");
    //
    //         const response = `✓ Updated: ${allUpdatesMessage}`;
    //         await session.memory.chatHistory.addAIChatMessage(response);
    //         logger.info(`[LeadAgent] Multi-param post-price update response: ${response}`);
    //
    //         return response; // ✅ Return here - don't ask for missing fields
    //     } else {
    //         // Single parameter update
    //         if (paramUpdate.field === "roof_type") {
    //             if (this.isClearRoofChoice(String(paramUpdate.value))) {
    //                 logger.info(`[LeadAgent] Direct roof choice matched: ${paramUpdate.value}`);
    //             } else {
    //                 const choice = await this.handleRoofTypeSelection(String(paramUpdate.value));
    //                 logger.info(`[LeadAgent] ChoiceHandler selected: ${choice.selected}`);
    //                 paramUpdate.value = choice.selected;
    //             }
    //
    //             const validationResult = await RoofDataValidator.validateRoofType(paramUpdate.value);
    //             if (!validationResult.isValid) {
    //                 const errorMessage = `❌ "${paramUpdate.value}" is not a valid roof type.\n\n${RoofDataValidator.getValidRoofTypesMessage()}`;
    //                 await session.memory.chatHistory.addAIChatMessage(errorMessage);
    //                 return errorMessage;
    //             }
    //             paramUpdate.value = validationResult.normalizedType;
    //         }
    //
    //         if (paramUpdate.field === "state_name") {
    //             const validationResult = await StateDataValidator.validateState(
    //                 paramUpdate.value,
    //                 async (name: string) => await this.mapStateToDB(name, session)
    //             );
    //
    //             if (!validationResult.isValid) {
    //                 const errorMessage = `❌ "${paramUpdate.value}" is not a valid state.\n\n${StateDataValidator.getValidStatesMessage()}`;
    //                 await session.memory.chatHistory.addAIChatMessage(errorMessage);
    //                 return errorMessage;
    //             }
    //             paramUpdate.value = validationResult.normalizedName;
    //         }
    //
    //         const updateResult = await this.handleParameterUpdate(session, paramUpdate);
    //         allUpdateResults.push(updateResult);
    //
    //         if (!updateResult.success) {
    //             await session.memory.chatHistory.addAIChatMessage(updateResult.message);
    //             return updateResult.message;
    //         }
    //
    //         await session.memory.chatHistory.addAIChatMessage(updateResult.message);
    //         logger.info(`[LeadAgent] Single post-price parameter updated:`, JSON.stringify(session.state.userFriendlyParams));
    //
    //         return updateResult.message; // ✅ Return here - don't ask for missing fields
    //     }
    // }
}

function Enforce(): void {}
