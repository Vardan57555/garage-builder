import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { BaseMessage } from "@langchain/core/messages";
import {
    DimensionResult,
    ExtractionContext,
    ExtractionResult,
    ValidationResult
} from "@agents/tools/impl/io/IParameterExtraction";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import { IParameterExtractor } from "@agents/tools/io/IParameterExtractionNode";
import { ParameterValidator } from "../validators/ParameterValidator";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";
import {LLMResponseHandler} from "@agents/tools/impl/LLMResponseHandler";
import {FallbackExtractor} from "@agents/tools/impl/FallbackExtractor";
import {IPromptBuilder} from "@agents/tools/io/IVisualizationNode";
import {PromptBuilder} from "@agents/tools/impl/PromptBuilderNode";
const logger: pino.Logger = createLogger(module);

class ParameterExtractor implements IParameterExtractor
{
    private promptBuilder: IPromptBuilder;
    private llmHandler: LLMResponseHandler;
    private dimensionManager: DimensionManager;
    private fallbackExtractor: FallbackExtractor;
    private paramExtractor: PriceParamsExtractorTool;

    constructor()
    {
        this.promptBuilder = PromptBuilder.getInstance();
        this.llmHandler = new LLMResponseHandler();
        this.dimensionManager = new DimensionManager();
        this.fallbackExtractor = new FallbackExtractor();
        this.paramExtractor = PriceParamsExtractorTool.getInstance();
    }


    public async extract(state: LeadAgentStateType): Promise<ExtractionResult>
    {
        logger.info(`[ParameterExtractor] Session ${state.sessionId} - Extracting parameters`);

        const currentParams = { ...state.userFriendlyParams };
        const userInput = this.extractContextFromState(state);

        logger.info(`[ParameterExtractor] User input: "${userInput}"`);

        try
        {
            const context: ExtractionContext = {userInput, currentField: state.currentField, currentParams,};

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

            return {userFriendlyParams: mergedParams, nextStep: "check_missing_fields",};
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

            const fallbackResult: ExtractionResult = this.fallbackExtractor.extract(
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

    public async extractWithUnifiedPrompt(context: ExtractionContext): Promise<string>
    {
        logger.info(`[extractWithUnifiedPrompt] Processing context (${context.userInput.length} chars)`);
        logger.info(`[extractWithUnifiedPrompt] Current field: ${context.currentField}`);

        const calculation: DimensionResult = this.dimensionManager.calculateDimensions(context.userInput);

        const prompt: string = this.promptBuilder.buildUnifiedPrompt(context, calculation);

        return await this.llmHandler.extractLLMResponse(
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
