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

interface AIIntentResult {
    hasIntent: boolean;
    buildingType?: string;
    numCars?: number;
    width?: number;
    length?: number;
    height?: number;
    roofType?: string;
    state?: string;
    gauge?: number;
    confidence: number;
    reasoning?: string;
}

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

    private async handleRoofTypeSelection(userInput: string): Promise<ChoiceResult> {
        try {
            logger.info({ userInput }, "[LeadAgent] Handling roof type selection");

            const choice = await this.choiceManager.handleChoice("roof_type", userInput);

            logger.info({
                selected: choice.selected,
                confidence: choice.confidence
            }, "[LeadAgent] Roof type selected");

            logger.info({ reasoning: choice.reasoning }, "[LeadAgent] Choice reasoning");

            return choice;
        } catch (error) {
            logger.error({ err: error }, "[LeadAgent] Roof type selection failed");
            throw error;
        }
    }

    private getRoofTypePrompt(): string {
        return this.choiceManager.getPrompt("roof_type");
    }

    private getBuildingTypePrompt(): string {
        return this.choiceManager.getPrompt("building_type");
    }

    private isClearRoofChoice(userInput: string): boolean {
        const options = [
            { value: "vertical", label: "Vertical" },
            { value: "regular", label: "Regular" },
            { value: "box", label: "Box" }
        ];

        const lowerInput = userInput.toLowerCase().trim();

        const numberMatch = userInput.match(/^\d+$/);
        if (numberMatch) {
            const index = parseInt(userInput) - 1;
            return index >= 0 && index < options.length;
        }

        return options.some(opt =>
            opt.value.toLowerCase() === lowerInput ||
            opt.label.toLowerCase() === lowerInput
        );
    }

    // private async detectGarageIntentWithAI(input: string): Promise<boolean> {
    //     try {
    //         const prompt: string = Constants.INTENT_PROMPT.replace("{input}", input);
    //         logger.debug({ promptLength: prompt.length }, "[LeadAgent] Intent detection prompt sent");
    //
    //         const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
    //         const upperResponse: string = response.trim().toUpperCase();
    //
    //         logger.info({ response: upperResponse }, "[LeadAgent] Intent detection response");
    //         return upperResponse.includes("YES");
    //     } catch (error) {
    //         logger.warn({ err: error }, "[LeadAgent] AI intent detection failed, using fallback");
    //         return this.detectGarageIntentFallback(input);
    //     }
    // }

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
            logger.info({ count: multiParamResult.length }, "[LeadAgent] Regex extracted parameters");

            for (const param of multiParamResult) {
                const validationError = await this.validateParameterValue(param.field, param.value);
                if (validationError) {
                    logger.warn({ field: param.field }, "[LeadAgent] Validation failed");
                    this.validationError = validationError;
                    return null;
                }
            }

            this.pendingUpdates = multiParamResult;
            return multiParamResult[0];
        }

        const regexResult = this.extractParameterByRegex(lowerInput);
        if (regexResult) {
            logger.info({
                field: regexResult.field,
                value: regexResult.value
            }, "[LeadAgent] Regex extracted parameter");

            const validationError = await this.validateParameterValue(regexResult.field, regexResult.value);
            if (validationError) {
                logger.warn({ field: regexResult.field }, "[LeadAgent] Validation failed");
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

        logger.info({
            currentCarCount,
            newCarCount
        }, "[LeadAgent] Car count check");

        if (currentCarCount !== null && currentCarCount !== newCarCount) {
            logger.info({
                from: currentCarCount,
                to: newCarCount
            }, "[LeadAgent] Car count changed");

            return {
                field: "garage_type",
                value: `${newCarCount}-car`,
            };
        }

        if (currentCarCount === null && newCarCount) {
            logger.info({ carCount: newCarCount }, "[LeadAgent] Initial car count set");
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
            logger.debug({ responseLength: responseText.length }, "[LeadAgent] AI update detection response");

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
                logger.info({
                    field: response.field,
                    value: response.value
                }, "[LeadAgent] AI detected update");

                const validationError = await this.validateParameterValue(
                    response.field,
                    response.value
                );
                if (validationError) {
                    logger.warn({ field: response.field }, "[LeadAgent] Validation failed");
                    this.validationError = validationError;
                    return null;
                }

                return {
                    field: response.field as keyof UserFriendlyParams,
                    value: response.value,
                };
            }
        } catch (error) {
            logger.warn({ err: error }, "[LeadAgent] AI update detection failed");
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

        logger.debug({ inputLength: input.length }, "[extractMultipleParametersByRegex] Processing input");

        const widthMatch = input.match(/\bwidth\s+(\d+(?:\.\d+)?)\b/);
        const lengthMatch = input.match(/\blength\s+(\d+(?:\.\d+)?)\b/);
        const heightMatch = input.match(/\bheight\s+(\d+(?:\.\d+)?)\b/);
        const gaugeMatch = input.match(/\bgauge\s+(\d+(?:\.\d+)?)\b/);

        if (widthMatch) {
            const value = parseFloat(widthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "width", value });
                logger.debug({ value }, "[extractMultipleParametersByRegex] Added width");
            }
        }
        if (lengthMatch) {
            const value = parseFloat(lengthMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "length", value });
                logger.debug({ value }, "[extractMultipleParametersByRegex] Added length");
            }
        }
        if (heightMatch) {
            const value = parseFloat(heightMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "height", value });
                logger.debug({ value }, "[extractMultipleParametersByRegex] Added height");
            }
        }
        if (gaugeMatch) {
            const value = parseFloat(gaugeMatch[1]);
            if (!isNaN(value) && value > 0) {
                updates.push({ field: "gauge", value });
                logger.debug({ value }, "[extractMultipleParametersByRegex] Added gauge");
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
                logger.debug({
                    width: dimensionMatch[1],
                    length: dimensionMatch[2],
                    height: dimensionMatch[3]
                }, "[extractMultipleParametersByRegex] Matched dimensions");
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
                        logger.debug({
                            field: result.field,
                            value: result.value
                        }, "[extractParameterByRegex] Pattern matched");
                        return result as ParameterUpdate;
                    }
                } catch (e) {
                    logger.warn({ err: e }, "[extractParameterByRegex] Parse error");
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

        logger.debug({
            field,
            newValue: value
        }, "[LeadAgent] Attempting parameter update");

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

        logger.info({ value, numCars }, "[LeadAgent] Processing garage_type");

        if (numCars && numCars > 0) {
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${numCars} cars`
            );
            logger.debug({ calculationKeys: Object.keys(calculation) }, "[LeadAgent] Calculation result");

            if (calculation.width && calculation.length) {
                (session.state.userFriendlyParams as any).width = calculation.width;
                (session.state.userFriendlyParams as any).length = calculation.length;
                (session.state.userFriendlyParams as any).height = calculation.height;
                (session.state.userFriendlyParams as any).garage_type = calculation.garageType;

                logger.info({
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height
                }, "[LeadAgent] Recalculated dimensions");

                return {
                    success: true,
                    message: `✓ Updated to ${calculation.numCars}-car garage (${calculation.width}ft × ${calculation.length}ft × ${calculation.height}ft)`,
                    updatedField: "garage_type",
                };
            }
        }

        logger.warn({ value }, "[LeadAgent] Failed to calculate dimensions for garage_type");
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
            logger.warn({ field, value }, "[LeadAgent] Invalid numeric value");
            return {
                success: false,
                message: `❌ Invalid ${field}. Please provide a positive number.`,
            };
        }

        (session.state.userFriendlyParams as any)[field] = numValue;
        logger.info({ field, value: numValue }, "[LeadAgent] Successfully updated numeric field");

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
        logger.info({ field, value }, "[LeadAgent] Successfully updated string field");

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
        logger.info({ sessionId }, "[LeadAgent] New session created");
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
            logger.error({ err: error }, "[LeadAgent] State mapping failed");
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
            logger.error({ err: error }, "[LeadAgent] Roof type mapping failed");
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
                    logger.warn({ stateName: userParams.state_name }, "[LeadAgent] State not found, using defaults");
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
            logger.error({ err: error }, "[LeadAgent] Param conversion failed");
            return null;
        }
    }

    private getMissingFields(params: Partial<UserFriendlyParams>): (keyof UserFriendlyParams)[] {
        return Constants.REQUIRED_FIELDS.filter((field) => !params[field]);
    }

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
            session.state.userFriendlyParams = {};
            session.state.hasGarageIntent = false;
            session.state.currentField = undefined;
            session.state.priceCalculated = false;
        } else {
            session.state.currentField = undefined;
            session.state.priceCalculated = true;
        }
    }

    public async run(sessionId: string, input: string): Promise<string> {
        this.currentSessionId = sessionId;
        this.validationError = null;
        this.pendingUpdates = [];

        logger.info({ input }, "[LeadAgent] User input received");

        const session: LeadAgentSessionMetadata = this.getOrCreateSession(sessionId);
        await session.memory.chatHistory.addUserMessage(input);

        if (session.state.priceCalculated) {
            logger.info("[LeadAgent] Post-price phase - User attempting parameter update");

            if (this.detectResetIntent(input)) {
                logger.info("[LeadAgent] User requested full reset");
                this.resetSessionState(session, true);
                session.state.hasGarageIntent = false;
                const response: string =
                    "Got it! Let's start fresh.\n" +
                    "Tell me about your new building - dimensions or building type?";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            const paramUpdate = await this.detectParameterUpdate(input);

            if (paramUpdate === null) {
                if (this.validationError) {
                    logger.warn({ validationError: this.validationError }, "[LeadAgent] Validation error occurred");
                    const error = this.validationError;
                    this.validationError = null;
                    await session.memory.chatHistory.addAIChatMessage(error);
                    return error;
                }

                const currentParams = this.formatCurrentParams(session.state.userFriendlyParams);
                const response =
                    `${currentParams}\n\n` +
                    "What would you like to change? (e.g., 'change width to 30', 'make roof box', 'different state')\n" +
                    "Or type 'new quote' to start over.";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            const updateResult = await this.handleParameterUpdateAfterPrice(session, paramUpdate);

            if (!updateResult.success) {
                await session.memory.chatHistory.addAIChatMessage(updateResult.message);
                return updateResult.message;
            }

            await session.memory.chatHistory.addAIChatMessage(updateResult.message);
            logger.info({ field: paramUpdate.field, value: paramUpdate.value }, "[LeadAgent] Parameter update detected");

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

        // NEW: Use AI-powered intent detection instead of simple keyword matching
        if (!session.state.hasGarageIntent) {
            logger.info("[LeadAgent] Checking intent with AI (handles typos)");

            const aiResult = await this.detectIntentAndParametersWithAI(input);

            if (!aiResult.hasIntent || aiResult.confidence < 0.6) {
                const response: string =
                    "Hello! I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            session.state.hasGarageIntent = true;

            // NEW: Apply all parameters extracted by AI
            this.applyAIExtractedParameters(session, aiResult);

            logger.info({
                confidence: aiResult.confidence,
                reasoning: aiResult.reasoning,
                extractedParams: Object.keys(session.state.userFriendlyParams)
            }, "[LeadAgent] AI detected intent and extracted parameters");

            // If AI extracted dimensions from "2 casrs" typo, acknowledge it
            if (aiResult.numCars) {
                const ackMessage = `✓ Got it - you're looking for a ${aiResult.numCars}-car garage!`;
                await session.memory.chatHistory.addAIChatMessage(ackMessage);
            }
        }

        const paramUpdate = await this.detectParameterUpdate(input);

        if (paramUpdate === null) {
            if (this.validationError) {
                logger.warn({ validationError: this.validationError }, "[LeadAgent] Validation error occurred");
                const error = this.validationError;
                this.validationError = null;
                await session.memory.chatHistory.addAIChatMessage(error);
                return error;
            }
        }

        if (paramUpdate) {
            const updateResults = await this.processParameterUpdates(session, paramUpdate);
            if (updateResults) {
                return updateResults;
            }
        }

        const extractor: PriceParamsExtractorTool = PriceParamsExtractorTool.getInstance();
        const rawParams: string = await extractor._call(await this.getConversationContext(session));
        logger.info({ sessionId, rawParamsLength: rawParams.length }, "[LeadAgent] Raw params from extractor");

        const extractedParams: Partial<UserFriendlyParams> = extractor.safeExtractUserFriendlyParams(rawParams);
        logger.info({ sessionId, extractedKeys: Object.keys(extractedParams) }, "[LeadAgent] Extracted params");

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

        if (extractedParams.building_type && !session.state.userFriendlyParams.building_type) {
            extractedParams.building_type = extractedParams.building_type;
        } else if (session.state.userFriendlyParams.building_type) {
            extractedParams.building_type = session.state.userFriendlyParams.building_type;
        }

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

        const missingFields: (keyof UserFriendlyParams)[] = this.getMissingFields(
            session.state.userFriendlyParams
        );

        if (missingFields.length > 0) {
            const nextField: keyof UserFriendlyParams = missingFields[0];
            session.state.currentField = nextField;

            if (nextField === "building_type" && session.state.userFriendlyParams.building_type) {
                logger.info("[LeadAgent] Building type already set, skipping");
                const updatedMissingFields = this.getMissingFields(session.state.userFriendlyParams);

                if (updatedMissingFields.length === 0) {
                    return await this.calculateAndReturnPrice(session);
                } else {
                    const nextMissingField = updatedMissingFields[0];
                    return await this.askForField(session, nextMissingField);
                }
            }

            return await this.askForField(session, nextField);
        }

        return await this.calculateAndReturnPrice(session);
    }

    private async handleParameterUpdateAfterPrice(
        session: LeadAgentSessionMetadata,
        paramUpdate: ParameterUpdate
    ): Promise<UpdateResult> {
        const validationError = await this.validateParameterValue(paramUpdate.field, paramUpdate.value);
        if (validationError) {
            logger.warn({ field: paramUpdate.field }, "[LeadAgent] Validation failed");
            return {
                success: false,
                message: validationError
            };
        }

        if (paramUpdate.field === "roof_type") {
            if (!this.isClearRoofChoice(String(paramUpdate.value))) {
                const choice = await this.handleRoofTypeSelection(String(paramUpdate.value));
                paramUpdate.value = choice.selected;
                logger.info({ selected: choice.selected }, "[LeadAgent] ChoiceHandler selected roof");
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
        logger.info({ field }, "[LeadAgent] Asking for field");
        return promptMessage;
    }

    private async processParameterUpdates(
        session: LeadAgentSessionMetadata,
        paramUpdate: ParameterUpdate
    ): Promise<string | null> {
        const pendingUpdates = this.pendingUpdates;
        let allUpdateResults: UpdateResult[] = [];

        if (pendingUpdates.length > 0) {
            logger.info({ count: pendingUpdates.length }, "[LeadAgent] Processing pending updates");

            for (const update of pendingUpdates) {
                logger.debug({ field: update.field, value: update.value }, "[LeadAgent] Validating update");

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
            logger.info({ updateCount: allUpdateResults.length }, "[LeadAgent] Multi-param update completed");

            const missingFields = this.getMissingFields(session.state.userFriendlyParams);
            if (missingFields.length === 0) {
                return await this.calculateAndReturnPrice(session);
            } else {
                const nextField: keyof UserFriendlyParams = missingFields[0];
                return await this.askForField(session, nextField);
            }
        } else {
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
            logger.info({ updatedField: paramUpdate.field }, "[LeadAgent] Single parameter updated");

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

    public async endSession(sessionId: string): Promise<void> {
        if (this.sessionManager.endSession(sessionId)) {
            logger.info({ sessionId }, "[LeadAgent] Session ended");
        } else {
            logger.warn({ sessionId }, "[LeadAgent] Attempted to end non-existent session");
        }
    }

    public async reset(): Promise<void> {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] All sessions cleared and cleanup stopped");
    }

    // private async detectBuildingTypeFromInitialInput(input: string): Promise<string | null> {
    //     try {
    //         const lowerInput = input.toLowerCase();
    //
    //         const buildingPatterns = [
    //             { pattern: /\bgarage\b/i, type: "garage" },
    //             { pattern: /\bshed\b/i, type: "shed" },
    //             { pattern: /\bbarn\b/i, type: "barn" },
    //             { pattern: /\bmetallic? building\b/i, type: "garage" },
    //             { pattern: /\bstructure\b/i, type: "garage" },
    //         ];
    //
    //         for (const { pattern, type } of buildingPatterns) {
    //             if (pattern.test(lowerInput)) {
    //                 logger.info({ type }, "[LeadAgent] Detected building type from input");
    //                 return type;
    //             }
    //         }
    //
    //         return null;
    //     } catch (error) {
    //         logger.warn({ err: error }, "[LeadAgent] Error detecting building type");
    //         return null;
    //     }
    // }

    private detectResetIntent(input: string): boolean {
        const resetPatterns = [
            /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
            /\b(quit|exit|done with this)\b/i,
        ];
        return resetPatterns.some((p) => p.test(input));
    }

    private async detectIntentAndParametersWithAI(input: string): Promise<AIIntentResult> {
        try {
            const prompt = `You are an expert at understanding user requests for building quotes, even with typos or unclear wording.

Analyze this user message: "${input}"

Determine:
1. Does the user want a quote for a garage, shed, barn, or metal building? (even with typos)
2. If yes, extract ANY parameters mentioned (even with typos):
   - Building type (garage, shed, barn)
   - Number of cars (if mentioned, e.g., "2 casrs" = 2 cars)
   - Dimensions: width, length, height (in feet)
   - Roof type (vertical, regular/pitched, box)
   - State/location
   - Gauge (metal thickness)

IMPORTANT: Be forgiving of typos. Examples:
- "casrs" → "cars"
- "garae" → "garage"
- "20x30x12" → width:20, length:30, height:12

Respond ONLY with JSON (no markdown, no explanation):
{
  "hasIntent": true/false,
  "buildingType": "garage" | "shed" | "barn" | null,
  "numCars": 2 | null,
  "width": 20 | null,
  "length": 30 | null,
  "height": 12 | null,
  "roofType": "vertical" | "regular" | "box" | null,
  "state": "texas" | null,
  "gauge": 14 | null,
  "confidence": 0.95,
  "reasoning": "User wants a 2-car garage (detected 'casrs' as typo for 'cars')"
}`;

            logger.debug("[LeadAgent] Sending AI intent detection prompt");
            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

            // Clean response
            const cleanedResponse = response
                .replace(/^```json\s*/g, "")
                .replace(/^```\s*/g, "")
                .replace(/\s*```$/g, "")
                .trim();

            const result: AIIntentResult = JSON.parse(cleanedResponse);

            logger.info({
                hasIntent: result.hasIntent,
                confidence: result.confidence,
                extracted: {
                    buildingType: result.buildingType,
                    numCars: result.numCars,
                    dimensions: result.width ? `${result.width}x${result.length}x${result.height}` : null
                }
            }, "[LeadAgent] AI intent detection result");

            return result;
        } catch (error) {
            logger.warn({ err: error }, "[LeadAgent] AI intent detection failed, using fallback");
            return {
                hasIntent: this.detectGarageIntentFallback(input),
                confidence: 0.5
            };
        }
    }

    private applyAIExtractedParameters(
        session: LeadAgentSessionMetadata,
        aiResult: AIIntentResult
    ): void {
        if (aiResult.buildingType) {
            (session.state.userFriendlyParams as any).building_type = aiResult.buildingType;
            logger.info({ buildingType: aiResult.buildingType }, "[LeadAgent] Applied AI-extracted building_type");
        }

        if (aiResult.numCars && aiResult.numCars > 0) {
            const calculation = DynamicGarageDimensionCalculator.calculateDimensionsFromInput(
                `${aiResult.numCars} cars`
            );

            if (calculation.width && calculation.length) {
                (session.state.userFriendlyParams as any).width = calculation.width;
                (session.state.userFriendlyParams as any).length = calculation.length;
                (session.state.userFriendlyParams as any).height = calculation.height;
                (session.state.userFriendlyParams as any).garage_type = calculation.garageType;

                logger.info({
                    numCars: aiResult.numCars,
                    dimensions: `${calculation.width}x${calculation.length}x${calculation.height}`
                }, "[LeadAgent] Applied AI-extracted car count with dimensions");
            }
        }

        if (aiResult.width && !session.state.userFriendlyParams.width) {
            (session.state.userFriendlyParams as any).width = aiResult.width;
            logger.info({ width: aiResult.width }, "[LeadAgent] Applied AI-extracted width");
        }

        if (aiResult.length && !session.state.userFriendlyParams.length) {
            (session.state.userFriendlyParams as any).length = aiResult.length;
            logger.info({ length: aiResult.length }, "[LeadAgent] Applied AI-extracted length");
        }

        if (aiResult.height && !session.state.userFriendlyParams.height) {
            (session.state.userFriendlyParams as any).height = aiResult.height;
            logger.info({ height: aiResult.height }, "[LeadAgent] Applied AI-extracted height");
        }

        if (aiResult.roofType && !session.state.userFriendlyParams.roof_type) {
            (session.state.userFriendlyParams as any).roof_type = aiResult.roofType;
            logger.info({ roofType: aiResult.roofType }, "[LeadAgent] Applied AI-extracted roof_type");
        }

        if (aiResult.state && !session.state.userFriendlyParams.state_name) {
            (session.state.userFriendlyParams as any).state_name = aiResult.state;
            logger.info({ state: aiResult.state }, "[LeadAgent] Applied AI-extracted state");
        }

        if (aiResult.gauge && !session.state.userFriendlyParams.gauge) {
            (session.state.userFriendlyParams as any).gauge = aiResult.gauge;
            logger.info({ gauge: aiResult.gauge }, "[LeadAgent] Applied AI-extracted gauge");
        }
    }
}

function Enforce(): void {}

