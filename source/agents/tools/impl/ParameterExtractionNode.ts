import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { BaseMessage } from "@langchain/core/messages";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import { ParameterValidator } from "../validators/ParameterValidator";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";
import {PromptBuilder} from "@agents/tools/impl/PromptBuilderNode";
import {
    DimensionResult,
    ExtractionContext,
    ExtractionResult,
    ValidationResult
} from "@agents/tools/io/IParameterExtraction";
import {IDimensionManager, IParameterExtractor} from "@agents/tools/impl/io/IParameterExtractionNode";
import {IPromptBuilder} from "@agents/tools/impl/io/IVisualizationNode";
import {IParameterExtractionStrategy} from "@agents/tools/impl/io/IParameterExtractionStrategy";
import {ParameterExtractionStrategy} from "@agents/tools/impl/ParameterExtractionStrategy";
import {IChoiceService} from "@agents/tools/impl/io/IChoiceHandler";
import {ChoiceServiceImpl} from "@agents/tools/impl/ChoiceServiceImpl";
const logger: pino.Logger = createLogger(module);

class ParameterExtractor implements IParameterExtractor
{
    private promptBuilder: IPromptBuilder;
    private choiceService: IChoiceService;
    private parameterExtractionStrategy: IParameterExtractionStrategy;
    private dimensionManager: IDimensionManager;
    private paramExtractor: PriceParamsExtractorTool;

    constructor()
    {
        this.parameterExtractionStrategy = ParameterExtractionStrategy.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
        this.choiceService = ChoiceServiceImpl.getInstance();
        this.dimensionManager = DimensionManager.getInstance();
        this.paramExtractor = PriceParamsExtractorTool.getInstance();
    }

    public async extract(state: LeadAgentStateType): Promise<ExtractionResult>
    {
        logger.info(`[ParameterExtractor] Session ${state.sessionId} - Extracting parameters`);

        const currentParams = { ...state.userFriendlyParams };
        const userInput = this.extractContextFromState(state);

        logger.info(`[ParameterExtractor] User input: "${userInput}"`);
        logger.info(`[ParameterExtractor] Current field: ${state.currentField}`);

        try
        {
            if (state.currentField && typeof state.currentField === 'string') {
                logger.info(`[ParameterExtractor] In field mode: ${state.currentField}`);

                const fieldKey = state.currentField as keyof UserFriendlyParams;

                const isChoiceField = ["roof_type", "building_type", "gauge"].includes(state.currentField);

                if (isChoiceField) {
                    logger.info(`[ParameterExtractor] Choice field detected (${state.currentField}), passing to choice service`);

                    try {
                        const result = await this.choiceService.handleChoice(
                            state.currentField,
                            userInput
                        );

                        if (!result || result.confidence === "low") {
                            return {
                                validationError: `Could not understand "${userInput}" for ${state.currentField}`,
                                response: `❌ Invalid ${state.currentField}. Please try again.`,
                                nextStep: "ask_for_field",
                                currentField: state.currentField,
                                userFriendlyParams: currentParams,
                            };
                        }

                        // @ts-ignore
                        currentParams[fieldKey] = result.selected;
                        logger.info(`[ParameterExtractor] Choice field resolved: ${state.currentField} = ${result.selected}`);

                        return {
                            userFriendlyParams: currentParams,
                            currentField: null,
                            nextStep: "check_missing_fields",
                        };
                    } catch (error) {
                        logger.error(`[ParameterExtractor] Error resolving choice:`, error);
                        return {
                            validationError: `Error processing ${state.currentField}`,
                            response: `❌ Error processing your selection. Please try again.`,
                            nextStep: "ask_for_field",
                            currentField: state.currentField,
                            userFriendlyParams: currentParams,
                        };
                    }
                }

                if (state.currentField === 'state_name') {
                    logger.info(`[ParameterExtractor] Validating state name against database`);

                    const formatValidation = this.validateFieldInput(userInput, state.currentField);
                    if (!formatValidation.isValid) {
                        logger.warn(`[ParameterExtractor] Invalid format for state_name: "${userInput}"`);
                        return {
                            validationError: formatValidation.error,
                            response: `❌ ${formatValidation.error}\n\nPlease provide a valid US state name.`,
                            nextStep: "ask_for_field",
                            currentField: state.currentField,
                            userFriendlyParams: currentParams,
                        };
                    }

                    try {
                        const { ParameterValidator } = await import("@agents/tools/validators/ParameterValidator");

                        const dbValidation = await ParameterValidator.validateState(
                            userInput,
                            state.stateMapCache
                        );

                        if (!dbValidation.isValid) {
                            logger.warn(`[ParameterExtractor] State not found in database: "${userInput}"`);
                            return {
                                validationError: dbValidation.error,
                                response: `❌ ${dbValidation.error}\n\nPlease provide a valid US state name (e.g., Texas, California, Florida).`,
                                nextStep: "ask_for_field",
                                currentField: state.currentField,
                                userFriendlyParams: currentParams,
                            };
                        }

                        // @ts-ignore
                        currentParams[fieldKey] = dbValidation.normalizedValue;
                        logger.info(`[ParameterExtractor] State validated: ${userInput} → ${dbValidation.normalizedValue}`);

                        return {
                            userFriendlyParams: currentParams,
                            currentField: null,
                            nextStep: "check_missing_fields",
                        };

                    }
                    catch (error) {
                        logger.error(`[ParameterExtractor] Error validating state:`, error);
                        return {
                            validationError: `Error validating state name`,
                            response: `❌ Error validating state. Please try again.`,
                            nextStep: "ask_for_field",
                            currentField: state.currentField,
                            userFriendlyParams: currentParams,
                        };
                    }
                }

                const validation = this.validateFieldInput(userInput, state.currentField);

                if (!validation.isValid) {
                    logger.warn(`[ParameterExtractor] Invalid input for ${state.currentField}: "${userInput}"`);
                    return {
                        validationError: validation.error,
                        response: `❌ ${validation.error}\n\nPlease provide a valid ${state.currentField}.`,
                        nextStep: "ask_for_field",
                        currentField: fieldKey,
                        userFriendlyParams: currentParams,
                    };
                }

                const parsedValue = this.parseFieldValue(userInput, state.currentField);

                // @ts-ignore
                currentParams[fieldKey] = parsedValue;

                logger.info(`[ParameterExtractor] Field accepted: ${state.currentField} = ${parsedValue}`);

                return {
                    userFriendlyParams: currentParams,
                    nextStep: "check_missing_fields",
                };
            }

            const context: ExtractionContext = {
                userInput,
                currentField: state.currentField,
                currentParams,
            };

            const rawParams: string = await this.extractWithUnifiedPrompt(context);
            const extractedParams: Partial<UserFriendlyParams> = this.paramExtractor.safeExtractUserFriendlyParams(rawParams);

            let mergedParams: Record<string, any> = this.mergeParameters(currentParams, extractedParams);

            await this.processDimensions(currentParams, extractedParams, mergedParams);

            const validationError: ValidationResult = await this.validateParameters(mergedParams, state.stateMapCache);

            if (validationError)
            {
                const fieldName = mergedParams.state_name ? "state_name" : "roof_type";
                return {
                    validationError: validationError.error,
                    response: `❌ ${validationError.error}\n\nPlease specify your ${fieldName}.`,
                    nextStep: "ask_for_field",
                    currentField: fieldName,
                    userFriendlyParams: mergedParams,
                };
            }

            return {
                userFriendlyParams: mergedParams,
                nextStep: "check_missing_fields",
            };
        }
        catch (error)
        {
            logger.error(`[ParameterExtractor] LLM extraction failed, attempting fallback`, error);

            const fullContext: string = state.messages
                .map((msg) => {
                    if (typeof msg.content === "string") return msg.content;
                    if (Array.isArray(msg.content)) {
                        return msg.content
                            .map((c) =>
                                typeof c === "string"
                                    ? c
                                    : "text" in c
                                        ? c.text
                                        : JSON.stringify(c)
                            )
                            .join(" ");
                    }
                    return "";
                })
                .join("\n");

            const fallbackResult: ExtractionResult = this.parameterExtractionStrategy.extract(
                fullContext,
                currentParams
            );

            if (fallbackResult)
            {
                logger.info(`[ParameterExtractor] Fallback extraction succeeded`);
                return fallbackResult;
            }

            logger.warn(`[ParameterExtractor] Fallback extraction also failed`);

            return {
                response:
                    "I couldn't understand your request. Could you please provide your building dimensions? (e.g., '20x20x10' for width x length x height in feet)",
                nextStep: "ask_for_field",
                currentField: "width",
                userFriendlyParams: currentParams,
            };
        }
    }

    private validateFieldInput(input: string, field: string): { isValid: boolean; error?: string } {
        const trimmed = input.trim();

        if (!trimmed || trimmed.length === 0) {
            return { isValid: false, error: `Cannot be empty` };
        }

        const indifferenceKeywords = ["any", "whatever", "idk", "i don't know", "doesn't matter", "don't care"];
        if (indifferenceKeywords.includes(trimmed.toLowerCase())) {
            return { isValid: true };
        }

        switch (field) {
            case "width":
            case "length":
            case "height":
            case "utility_length":
                return this.validateNumericInput(trimmed, field);

            case "gauge":
                if (trimmed.match(/^\d+$/)) {
                    const value = parseInt(trimmed);
                    if ([14, 16, 18, 20].includes(value)) {
                        return { isValid: true };
                    }
                    return { isValid: false, error: `Gauge must be 14, 16, 18, or 20` };
                }
                return { isValid: false, error: `Gauge must be 14, 16, 18, or 20, or say "any" for default` };

            case "state_name":
                return this.validateStateInput(trimmed);

            case "roof_type":
                return this.validateRoofTypeInput(trimmed);

            case "building_type":
                return this.validateBuildingTypeInput(trimmed);

            default:
                return { isValid: true };
        }
    }

    private validateNumericInput(input: string, field: string): { isValid: boolean; error?: string } {
        const numMatch = input.match(/^\d+(?:\.\d+)?$/);

        if (!numMatch) {
            return { isValid: false, error: `${field} must be a number (e.g., 20, 30.5)` };
        }

        const value = parseFloat(input);

        if (value <= 0) {
            return { isValid: false, error: `${field} must be greater than 0` };
        }

        if (value > 500) {
            return { isValid: false, error: `${field} seems too large (max 500 feet)` };
        }

        return { isValid: true };
    }

    private validateStateInput(input: string): { isValid: boolean; error?: string } {
        const stateMatch = input.match(/^[a-zA-Z\s\-]{2,50}$/);

        if (!stateMatch) {
            return { isValid: false, error: `State name should only contain letters, spaces, or hyphens` };
        }

        return { isValid: true };
    }

    private validateRoofTypeInput(input: string): { isValid: boolean; error?: string } {
        const validRoofs = ["vertical", "regular", "box", "a-frame"];
        const normalized = input.toLowerCase().trim();

        if (!validRoofs.includes(normalized)) {
            return {
                isValid: false,
                error: `Roof type must be one of: ${validRoofs.join(", ")}`
            };
        }

        return { isValid: true };
    }

    private validateBuildingTypeInput(input: string): { isValid: boolean; error?: string } {
        const validTypes = ["garage", "shed", "barn"];
        const normalized = input.toLowerCase().trim();

        if (!validTypes.includes(normalized)) {
            return {
                isValid: false,
                error: `Building type must be one of: ${validTypes.join(", ")}`
            };
        }

        return { isValid: true };
    }

    private parseFieldValue(input: string, field: string): any {
        switch (field) {
            case "width":
            case "length":
            case "height":
            case "gauge":
            case "utility_length":
                return parseFloat(input);

            case "state_name":
            case "building_type":
            case "roof_type":
                return input.toLowerCase().trim();

            default:
                return input.trim();
        }
    }

    public async extractWithUnifiedPrompt(context: ExtractionContext): Promise<string>
    {
        logger.info(`[extractWithUnifiedPrompt] Processing context (${context.userInput.length} chars)`);
        logger.info(`[extractWithUnifiedPrompt] Current field: ${context.currentField}`);

        const calculation: DimensionResult = this.dimensionManager.calculateDimensions(context.userInput);

        const prompt: string = this.promptBuilder.buildUnifiedPrompt(context, calculation);

        return await this.parameterExtractionStrategy.extractLLMResponse(
            context.userInput,
            prompt
        );
    }

    private extractContextFromState(state: LeadAgentStateType): string
    {
        const lastMessage: BaseMessage = state.messages[state.messages.length - 1];

        if (!lastMessage)
        {
            return "";
        }

        if (typeof lastMessage.content === "string") {
            return lastMessage.content;
        }

        if (Array.isArray(lastMessage.content))
        {
            return lastMessage.content
                .map((c) =>
                    typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)
                )
                .join(" ");
        }

        return "";
    }

    private mergeParameters(current: Record<string, any>, extracted: Record<string, any>): Record<string, any>
    {
        return { ...current, ...extracted };
    }

    private async processDimensions(current: Record<string, any>, extracted: Record<string, any>, merged: Record<string, any>): Promise<void>
    {
        const garageTypeChanged: boolean = this.dimensionManager.isGarageTypeChanged(extracted.garage_type, current.garage_type);

        if (garageTypeChanged)
        {
            logger.info(`[ParameterExtractor] Garage type changed from "${current.garage_type}" to "${extracted.garage_type}"`);

            this.dimensionManager.clearDimensions(merged);

            const calc: DimensionResult = this.dimensionManager.calculateDimensions(extracted.garage_type!);

            if (!this.dimensionManager.applyDimensions(merged, calc))
            {
                logger.warn(`[ParameterExtractor] Failed to calculate dimensions`);
            }
        }
        else
        {
            this.dimensionManager.preserveExistingDimensions(merged, current, extracted);
        }

        if (merged.garage_type && !merged.width)
        {
            const calc: DimensionResult = this.dimensionManager.calculateDimensions(merged.garage_type);

            if (!this.dimensionManager.applyDimensions(merged, calc))
            {
                logger.warn(`[ParameterExtractor] Failed to calculate dimensions`);
            }
        }
    }

    private async validateParameters(params: Record<string, any>, stateMapCache: any): Promise<ValidationResult | null>
    {
        if (params.state_name)
        {
            const result: ValidationResult = await ParameterValidator.validateState(
                params.state_name,
                stateMapCache
            );

            if (!result.isValid)
            {
                return result;
            }

            params.state_name = result.normalizedValue;
        }

        if (params.roof_type)
        {
            const result: ValidationResult = await ParameterValidator.validateRoofType(params.roof_type);

            if (!result.isValid)
            {
                return result;
            }

            params.roof_type = result.normalizedValue;
        }

        return null;
    }
}

const extractor = new ParameterExtractor();

export const extractParametersNode = async (state: LeadAgentStateType): Promise<ExtractionResult> =>
{
    return extractor.extract(state);
};
