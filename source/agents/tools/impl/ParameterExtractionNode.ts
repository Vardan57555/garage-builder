import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { PriceParamsExtractorTool } from "@agents/tools/impl/PriceParamsExtractorTool";
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
import { detectParameterUpdateFromInput } from "@agents/tools/impl/DetectionHelpers";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {ChoiceServiceImpl} from "@agents/tools/impl/ChoiceServiceImpl";
const logger: pino.Logger = createLogger(module);

class ParameterExtractor implements IParameterExtractor {
    private promptBuilder: IPromptBuilder;
    // private choiceService: IChoiceService;
    private parameterExtractionStrategy: IParameterExtractionStrategy;
    private dimensionManager: IDimensionManager;
    private paramExtractor: PriceParamsExtractorTool;

    constructor() {
        this.parameterExtractionStrategy = ParameterExtractionStrategy.getInstance();
        this.promptBuilder = PromptBuilder.getInstance();
        // this.choiceService = ChoiceServiceImpl.getInstance();
        this.dimensionManager = DimensionManager.getInstance();
        this.paramExtractor = PriceParamsExtractorTool.getInstance();
    }

    /**
     * ✅ NEW: Extract single dimension using Ollama AI
     */
    private async extractSingleDimensionWithAI(userInput: string, field: 'width' | 'length' | 'height'): Promise<number | null> {
        try {
            logger.info(`[ParameterExtractor] AI extracting ${field} from: "${userInput}"`);

            const prompt = `Extract a single dimension value in feet from the user's response.
The user is being asked for: ${field}

Return ONLY JSON:
{
  "value": <number or null>,
  "found": <true if found, false otherwise>
}

Examples:
- "20" → {"value": 20, "found": true}
- "20 feet" → {"value": 20, "found": true}
- "about 30" → {"value": 30, "found": true}

User response: "${userInput}"

Return ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[ParameterExtractor] AI single dimension response: "${response}"`);

            const parsed = this.parseAIResponse(response);

            if (parsed && parsed.found && typeof parsed.value === 'number' && parsed.value > 0 && parsed.value <= 500) {
                logger.info(`[ParameterExtractor] ✅ AI extracted ${field}: ${parsed.value}`);
                return parsed.value;
            }

            return null;
        } catch (error) {
            logger.error(`[ParameterExtractor] AI extraction error:`, error);
            return null;
        }
    }


    public async extract(state: LeadAgentStateType): Promise<ExtractionResult> {
        logger.info(`[ParameterExtractor] Session ${state.sessionId} - Extracting parameters`);

        const currentParams = { ...state.userFriendlyParams };
        const userInput = this.extractContextFromState(state);

        if (!currentParams.building_type) {
            const buildingType = await this.extractBuildingTypeIfMissing(userInput, currentParams);
            if (buildingType) {
                currentParams.building_type = buildingType;
                logger.info(`[ParameterExtractor] ✅ Building type set to: ${buildingType}`);
            }
        }

        if (state._pendingConfirmation && state._pendingConfirmation.field) {
            logger.info(`[ParameterExtractor] Handling pending confirmation for ${state._pendingConfirmation.field}`);

            const { AIDrivenChoiceHandler } = await import("@agents/tools/impl/AIDrivenChoiceHandler");

            const confirmation = await AIDrivenChoiceHandler.confirmChoice(
                userInput,
                state._pendingConfirmation.matchedValue
            );

            if (confirmation.confirmed) {
                logger.info(`[ParameterExtractor] ✅ Confirmed: ${state._pendingConfirmation.matchedValue}`);

                const fieldKey = state._pendingConfirmation.field as keyof UserFriendlyParams;
                // @ts-ignore
                currentParams[fieldKey] = state._pendingConfirmation.matchedValue;

                return {
                    userFriendlyParams: currentParams,
                    currentField: null,
                    nextStep: "check_missing_fields",
                    response: `✅ Updated ${state._pendingConfirmation.field} to ${state._pendingConfirmation.matchedValue}`,
                    _pendingConfirmation: null,
                };
            } else {
                logger.info(`[ParameterExtractor] ❌ Rejected confirmation, re-asking`);

                const availableOptions = AIDrivenChoiceHandler.getAvailableOptions(state._pendingConfirmation.field);
                const prompt = await AIDrivenChoiceHandler.generateChoicePrompt(
                    state._pendingConfirmation.field,
                    availableOptions
                );

                return {
                    userFriendlyParams: currentParams,
                    currentField: state._pendingConfirmation.field as keyof UserFriendlyParams,
                    nextStep: "__end__",
                    response: `No problem! Let's try again.\n\n${prompt}`,
                    _pendingConfirmation: null,
                };
            }
        }

        if (state.currentField && typeof state.currentField === 'string') {
            logger.info(`[ParameterExtractor] In field mode: ${state.currentField}`);

            const fieldKey = state.currentField as keyof UserFriendlyParams;
            const isChoiceField = ["roof_type", "building_type", "gauge"].includes(state.currentField);
            const isDimensionField = ['width', 'length', 'height', 'utility_length'].includes(state.currentField);

            // ✅ DIMENSION FIELDS FIRST
            if (isDimensionField) {
                return await this.handleDimensionField(state, userInput, currentParams);
            }

            // ✅ CHOICE FIELDS
            if (isChoiceField) {
                logger.info(`[ParameterExtractor] Choice field: ${state.currentField}`);

                const { AIDrivenChoiceHandler } = await import("@agents/tools/impl/AIDrivenChoiceHandler");
                const availableOptions = AIDrivenChoiceHandler.getAvailableOptions(state.currentField);

                if (!availableOptions.length) {
                    return {
                        validationError: `No options for ${state.currentField}`,
                        response: `❌ Error processing ${state.currentField}`,
                        nextStep: "ask_for_field",
                        currentField: state.currentField,
                        userFriendlyParams: currentParams,
                    };
                }

                const result = await AIDrivenChoiceHandler.processUserChoice(
                    userInput,
                    state.currentField,
                    availableOptions
                );

                if (!result) {
                    const prompt = await AIDrivenChoiceHandler.generateChoicePrompt(
                        state.currentField,
                        availableOptions
                    );
                    return {
                        validationError: `Could not match "${userInput}"`,
                        response: `❌ I didn't understand that.\n\n${prompt}`,
                        nextStep: "ask_for_field",
                        currentField: state.currentField,
                        userFriendlyParams: currentParams,
                    };
                }

                if (result.confidence === "high" && !result.requiresConfirmation) {
                    // @ts-ignore
                    currentParams[fieldKey] = result.value;
                    const missing = LeadAgentHelpers.getMissingFields(currentParams);
                    return {
                        userFriendlyParams: currentParams,
                        currentField: null,
                        nextStep: missing.length > 0 ? "check_missing_fields" : "calculate_price",
                        response: `✅ Updated ${state.currentField} to ${result.value}`,
                        _pendingConfirmation: null,
                    };
                }

                return {
                    userFriendlyParams: currentParams,
                    currentField: state.currentField,
                    nextStep: "ask_for_field",
                    response: result.clarificationPrompt || `Did you mean "${result.value}"?`,
                    _pendingConfirmation: {
                        field: state.currentField,
                        matchedValue: result.value,
                    }
                };
            }

            // ✅ STATE NAME
            if (state.currentField === 'state_name') {
                const formatValidation = this.validateFieldInput(userInput, state.currentField);
                if (!formatValidation.isValid) {
                    return {
                        validationError: formatValidation.error,
                        response: `❌ ${formatValidation.error}`,
                        nextStep: "ask_for_field",
                        currentField: state.currentField,
                        userFriendlyParams: currentParams,
                    };
                }

                const { ParameterValidator } = await import("@agents/tools/validators/ParameterValidator");
                const dbValidation = await ParameterValidator.validateState(userInput, state.stateMapCache);

                if (!dbValidation.isValid) {
                    return {
                        validationError: dbValidation.error,
                        response: `❌ ${dbValidation.error}`,
                        nextStep: "ask_for_field",
                        currentField: state.currentField,
                        userFriendlyParams: currentParams,
                    };
                }

                // @ts-ignore
                currentParams[fieldKey] = dbValidation.normalizedValue;
                return {
                    userFriendlyParams: currentParams,
                    currentField: null,
                    nextStep: "check_missing_fields",
                };
            }

            // ✅ OTHER FIELDS
            const validation = this.validateFieldInput(userInput, state.currentField);
            if (!validation.isValid) {
                return {
                    validationError: validation.error,
                    response: `❌ ${validation.error}`,
                    nextStep: "ask_for_field",
                    currentField: state.currentField,
                    userFriendlyParams: currentParams,
                };
            }

            // @ts-ignore
            currentParams[fieldKey] = this.parseFieldValue(userInput, state.currentField);
            return {
                userFriendlyParams: currentParams,
                currentField: null,
                nextStep: "check_missing_fields",
            };
        }

        const buildingType = await this.extractBuildingTypeIfMissing(userInput, currentParams);
        if (buildingType) {
            currentParams.building_type = buildingType;
            logger.info(`[ParameterExtractor] ✅ Building type set to: ${buildingType}`);
        }

        const hasExplicitCarCount = /(\d+)\s*(?:car|cars?)\s*(?:garage)?/i.test(userInput);
        const hasExplicitDimensions = this.detectExplicitDimensions(userInput);

        logger.info(`[ParameterExtractor] Has explicit car count: ${hasExplicitCarCount}`);
        logger.info(`[ParameterExtractor] Has explicit dimensions: ${hasExplicitDimensions}`);

        // ✅ Car count handling
        if (hasExplicitCarCount && !hasExplicitDimensions) {
            logger.info(`[ParameterExtractor] ✅ Car count provided, calculating dimensions...`);

            const dimensionCalc = this.dimensionManager.calculateDimensions(userInput);

            if (dimensionCalc && dimensionCalc.width && dimensionCalc.length && dimensionCalc.height) {
                logger.info(`[ParameterExtractor] ✅ Dimensions calculated: ${dimensionCalc.width}×${dimensionCalc.length}×${dimensionCalc.height}`);

                currentParams.width = dimensionCalc.width;
                currentParams.length = dimensionCalc.length;
                currentParams.height = dimensionCalc.height;

                const carMatch = userInput.match(/(\d+)\s*(?:car|cars?)/i);
                if (carMatch) {
                    currentParams.garage_type = `${carMatch[1]}-car`;
                }

                return {
                    userFriendlyParams: currentParams,
                    currentField: null,
                    nextStep: "check_missing_fields",
                };
            }
        }

        if (!hasExplicitCarCount && !hasExplicitDimensions) {
            logger.info(`[ParameterExtractor] ⚠️ No car count or dimensions provided`);
            logger.info(`[ParameterExtractor] Will ask for parameters individually`);

            return {
                userFriendlyParams: {
                    ...currentParams,
                    building_type: buildingType || undefined,
                },
                currentField: null,
                nextStep: "check_missing_fields",
            };
        }

        const hasDimensions = !!(
            currentParams.width &&
            currentParams.length &&
            currentParams.height
        );

        if (hasDimensions) {
            logger.info(
                `[ParameterExtractor] ✅ Dimensions already complete, PROTECTING from overwrite`,
                {
                    width: currentParams.width,
                    length: currentParams.length,
                    height: currentParams.height,
                }
            );

            if (!this.isExplicitDimensionChange(userInput)) {
                return {
                    userFriendlyParams: currentParams,
                    nextStep: "check_missing_fields",
                };
            }
        }

        if (!hasExplicitDimensions && !hasDimensions) {
            logger.info(`[ParameterExtractor] No explicit dimensions in: "${userInput}"`);
            logger.info(`[ParameterExtractor] Will proceed to ask for dimensions individually`);
        }

        logger.info(`[ParameterExtractor] PRIORITY 0: Checking for batch dimension extraction...`);
        const batchResult = await this.tryBatchDimensionExtractionWithAI(userInput);
        if (batchResult && batchResult.width && batchResult.length && batchResult.height) {
            logger.info(`[ParameterExtractor] ✅ BATCH extraction successful: ${batchResult.width}x${batchResult.length}x${batchResult.height}`);
            return {
                userFriendlyParams: {
                    ...currentParams,
                    width: batchResult.width,
                    length: batchResult.length,
                    height: batchResult.height,
                },
                currentField: null,
                nextStep: "check_missing_fields",
            };
        }

        const parameterUpdate = await detectParameterUpdateFromInput(userInput, state.currentField);
        if (parameterUpdate) {
            logger.info(`[ParameterExtractor] ✅ Explicit parameter update detected: ${parameterUpdate.field} = ${parameterUpdate.value}`);

            // ✅ NEW: If garage_type was detected AND dimensions were calculated
            if (parameterUpdate.field === 'garage_type' && parameterUpdate.calculatedDimensions) {
                logger.info(`[ParameterExtractor] 🚗 Garage type with calculated dimensions detected`);
                logger.info(`[ParameterExtractor] Calculated: ${parameterUpdate.calculatedDimensions.width}x${parameterUpdate.calculatedDimensions.length}x${parameterUpdate.calculatedDimensions.height}`);

                return {
                    userFriendlyParams: {
                        ...currentParams,
                        garage_type: parameterUpdate.value,
                        width: parameterUpdate.calculatedDimensions.width,
                        length: parameterUpdate.calculatedDimensions.length,
                        height: parameterUpdate.calculatedDimensions.height,
                    },
                    currentField: null,
                    nextStep: "check_missing_fields",
                    response: `✅ Updated garage type to ${parameterUpdate.value} with dimensions: ${parameterUpdate.calculatedDimensions.width}ft × ${parameterUpdate.calculatedDimensions.length}ft × ${parameterUpdate.calculatedDimensions.height}ft`,
                };
            }

            // Standard parameter update (without dimensions)
            return {
                userFriendlyParams: {
                    ...currentParams,
                    [parameterUpdate.field]: parameterUpdate.value,
                },
                currentField: null,
                nextStep: "check_missing_fields",
            };
        }

        // ✅ PRIORITY 2: If in field mode with dimension field, handle with simple numeric or AI
        if (state.currentField && this.isDimensionField(state.currentField)) {
            logger.info(`[ParameterExtractor] Field mode: ${state.currentField}`);

            const simpleNumericResult = this.trySimpleNumericParse(userInput, state.currentField);
            if (simpleNumericResult) {
                logger.info(`[ParameterExtractor] Simple numeric matched`);
                return {
                    userFriendlyParams: {
                        ...state.userFriendlyParams,
                        [state.currentField]: simpleNumericResult,
                    },
                    currentField: null,
                    nextStep: "check_missing_fields",
                };
            }

            const aiExtracted = await this.extractSingleDimensionWithAI(
                userInput,
                state.currentField as 'width' | 'length' | 'height'
            );
            if (aiExtracted) {
                logger.info(`[ParameterExtractor] AI extracted ${state.currentField}: ${aiExtracted}`);
                return {
                    userFriendlyParams: {
                        ...state.userFriendlyParams,
                        [state.currentField]: aiExtracted,
                    },
                    currentField: null,
                    nextStep: "check_missing_fields",
                };
            }
        }

        logger.info(`[ParameterExtractor] User input: "${userInput}"`);
        logger.info(`[ParameterExtractor] Current field: ${state.currentField}`);

        try {
            // ✅ PRIORITY 3: Handle field mode (including choice fields)
            if (state.currentField && typeof state.currentField === 'string') {
                logger.info(`[ParameterExtractor] In field mode: ${state.currentField}`);

                const fieldKey = state.currentField as keyof UserFriendlyParams;
                const isChoiceField = ["roof_type", "building_type", "gauge"].includes(state.currentField);

                // In ParameterExtractionNode.ts - REPLACE the entire choice field handling section

                if (isChoiceField) {
                    logger.info(`[ParameterExtractor] Choice field detected (${state.currentField}), using AI choice handler`);

                    try {
                        // ✅ STEP 1: Get available options from choice service
                        const choiceService = ChoiceServiceImpl.getInstance();
                        let availableOptions: string[] = [];

                        try {
                            const options = choiceService.getOptions(state.currentField);
                            availableOptions = options.map(opt => opt.value);
                            logger.info(`[ParameterExtractor] Available options for ${state.currentField}:`, availableOptions);
                        } catch (error) {
                            logger.warn(`[ParameterExtractor] Could not get options from service, using fallback`);

                            // Fallback options
                            const fallbackOptions: Record<string, string[]> = {
                                "roof_type": ["vertical", "regular", "box"],
                                "gauge": ["14", "16", "18", "20"],
                                "building_type": ["garage", "shed", "barn"],
                            };

                            availableOptions = fallbackOptions[state.currentField] || [];
                        }

                        if (availableOptions.length === 0) {
                            logger.error(`[ParameterExtractor] No options available for ${state.currentField}`);
                            return {
                                validationError: `No options available for ${state.currentField}`,
                                response: `❌ Error: Cannot process ${state.currentField}`,
                                nextStep: "ask_for_field",
                                currentField: state.currentField,
                                userFriendlyParams: currentParams,
                            };
                        }

                        // ✅ STEP 2: Use AI-driven choice handler to match user input
                        const { AIDrivenChoiceHandler } = await import("@agents/tools/impl/AIDrivenChoiceHandler");

                        logger.info(`[ParameterExtractor] Processing choice with AI for ${state.currentField}: "${userInput}"`);

                        const matchResult = await AIDrivenChoiceHandler.processUserChoice(
                            userInput,
                            state.currentField,
                            availableOptions
                        );

                        // ✅ STEP 3: Handle no match
                        if (!matchResult) {
                            logger.warn(`[ParameterExtractor] Could not match "${userInput}" to any option`);

                            const prompt = await AIDrivenChoiceHandler.generateChoicePrompt(
                                state.currentField,
                                availableOptions,
                                `Please select one of the available ${state.currentField} options`
                            );

                            return {
                                validationError: `Could not understand "${userInput}" for ${state.currentField}`,
                                response: `❌ I didn't understand that.\n\n${prompt}`,
                                nextStep: "ask_for_field",
                                currentField: state.currentField,
                                userFriendlyParams: currentParams,
                            };
                        }

                        logger.info(`[ParameterExtractor] AI matched: "${userInput}" → "${matchResult.value}" (confidence: ${matchResult.confidence})`);

                        // ✅ STEP 4: HIGH CONFIDENCE - Accept immediately
                        if (matchResult.confidence === "high" && !matchResult.requiresConfirmation) {
                            logger.info(`[ParameterExtractor] ✅ High confidence: ${matchResult.value}`);

                            const fieldKey = state.currentField as keyof UserFriendlyParams;
                            // @ts-ignore
                            currentParams[fieldKey] = matchResult.value;

                            logger.info(`[ParameterExtractor] Updated ${state.currentField} to ${matchResult.value}`);

                            return {
                                userFriendlyParams: currentParams,
                                currentField: null,
                                nextStep: "check_missing_fields",
                                response: `✅ Updated ${state.currentField} to ${matchResult.value}`,
                            };
                        }

                        // ✅ STEP 5: MEDIUM/LOW CONFIDENCE - Ask for confirmation
                        logger.info(`[ParameterExtractor] Medium/low confidence (${matchResult.confidence}), asking for confirmation`);

                        return {
                            userFriendlyParams: currentParams,
                            currentField: state.currentField,
                            nextStep: "__end__",
                            response: matchResult.clarificationPrompt || `Did you mean "${matchResult.value}"? (yes/no)`,
                            _pendingConfirmation: {
                                field: state.currentField,
                                matchedValue: matchResult.value,
                            }
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

                // ✅ STATE NAME VALIDATION (existing logic)
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

                    } catch (error) {
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

                // ✅ OTHER FIELDS (existing validation logic)
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

            // If simple number, ask which dimension
            if (this.isSimpleNumber(userInput)) {
                logger.info(`[ParameterExtractor] Simple number detected: "${userInput}" - asking which dimension`);
                return {
                    userFriendlyParams: currentParams,
                    currentField: "width",
                    nextStep: "ask_for_field",
                    response: `I see you entered "${userInput}". Is this the width, length, or height in feet?\n\nPlease enter:\n• Width (front to back)\n• Length (side to side)\n• Height (top to bottom)\n\nOr provide all three like: 20x30x10 or 20, 30, 10 or width: 20, length: 30, height: 10`,
                };
            }

            // ✅ PROTECTION: Store dimensions before extraction
            const dimensionsBefore = {
                width: currentParams.width,
                length: currentParams.length,
                height: currentParams.height,
            };

            const context: ExtractionContext = {
                userInput,
                currentField: state.currentField,
                currentParams,
            };

            const rawParams: string = await this.extractWithUnifiedPrompt(context);
            const extractedParams: Partial<UserFriendlyParams> = this.paramExtractor.safeExtractUserFriendlyParams(rawParams);

            let mergedParams: Record<string, any> = this.mergeParameters(currentParams, extractedParams);

            await this.processDimensions(currentParams, extractedParams, mergedParams);

            // ✅ PROTECTION: Validate dimensions didn't change unexpectedly
            if (
                extractedParams.width === undefined &&
                extractedParams.length === undefined &&
                extractedParams.height === undefined
            ) {
                logger.info(`[ParameterExtractor] ✅ No dimension extraction attempted, preserving existing dimensions`);
                mergedParams.width = dimensionsBefore.width;
                mergedParams.length = dimensionsBefore.length;
                mergedParams.height = dimensionsBefore.height;
            }

            const validationError: ValidationResult = await this.validateParameters(mergedParams, state.stateMapCache);

            if (validationError) {
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
        } catch (error) {
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

            if (fallbackResult) {
                logger.info(`[ParameterExtractor] Fallback extraction succeeded`);
                return fallbackResult;
            }

            logger.warn(`[ParameterExtractor] Fallback extraction also failed`);

            return {
                response:
                    "I couldn't understand your request. Could you please provide your building dimensions? (e.g., '20x30x10' or '20, 30, 10' for width x length x height in feet)",
                nextStep: "ask_for_field",
                currentField: "width",
                userFriendlyParams: currentParams,
            };
        }
    }

    private trySimpleNumericParse(input: string, field: string): number | null {
        const trimmed = input.trim();
        const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(?:ft|feet)?$/i);

        if (!match) return null;

        const value = parseFloat(match[1]);

        if (value <= 0 || value > 500) return null;

        logger.info(`[ParameterExtractor] Simple numeric parse: ${field} = ${value}`);
        return value;
    }

    private isDimensionField(field: string): boolean {
        return ['width', 'length', 'height', 'utility_length'].includes(field);
    }

    private isSimpleNumber(input: string): boolean {
        return /^\d+(?:\.\d+)?$/.test(input.trim());
    }

    private isExplicitDimensionChange(input: string): boolean {
        const changeKeywords = [
            /change.*?(width|length|height|dimension)/i,
            /update.*?(width|length|height|dimension)/i,
            /make.*?(width|length|height|dimension)/i,
            /set.*?(width|length|height|dimension)/i,
        ];

        return changeKeywords.some(pattern => pattern.test(input));
    }

    private async extractBuildingTypeIfMissing(
        userInput: string,
        currentParams: Partial<UserFriendlyParams>
    ): Promise<string | null> {
        if (currentParams.building_type) {
            logger.info(`[ParameterExtractor] Building type already set: ${currentParams.building_type}`);
            return currentParams.building_type;
        }

        logger.info(`[ParameterExtractor] Attempting to extract building_type from: "${userInput}"`);

        const normalizedInput = userInput.toLowerCase().trim();

        // ✅ CRITICAL FIX: More aggressive pattern matching
        // These patterns will catch "garage" even with extra words around it
        const patterns = [
            // Direct mentions (HIGHEST PRIORITY)
            { regex: /\bgarage\b/i, type: "garage" },
            { regex: /\bshed\b/i, type: "shed" },
            { regex: /\bbarn\b/i, type: "barn" },

            // With verbs/prepositions
            { regex: /(?:want|need|looking for|get|build|for|have|create).*?garage/i, type: "garage" },
            { regex: /garage.*?(?:for|with)/i, type: "garage" },

            // Car-related (implies garage)
            { regex: /\d+\s*(?:car|cars?)\s*garage/i, type: "garage" },
            { regex: /garage\s+(?:for|to fit|to hold)\s+\d+\s*(?:car|cars?)/i, type: "garage" },
            { regex: /\d+\s*(?:car|cars?)(?!\s+(?:shed|barn))/i, type: "garage" }, // "2 cars" without shed/barn
        ];

        // ✅ STEP 1: Try pattern matching FIRST (faster and more reliable)
        for (const pattern of patterns) {
            if (pattern.regex.test(normalizedInput)) {
                logger.info(`[ParameterExtractor] ✅ Pattern match: building_type = ${pattern.type}`);
                logger.info(`[ParameterExtractor] Matched pattern: ${pattern.regex}`);
                return pattern.type;
            }
        }

        logger.info(`[ParameterExtractor] No pattern match, trying AI extraction...`);

        // ✅ STEP 2: If patterns fail, use AI with improved prompt
        try {
            const prompt = `Extract ONLY the building type from this text.

RULES:
1. Search for these EXACT words: "garage", "shed", "barn"
2. If ANY of these words appear → return that word
3. Ignore all numbers, dimensions, and other details
4. If NONE appear → return "null"

EXAMPLES:
✅ "I want a garage" → garage
✅ "i want garage width 20 length 20 height 10" → garage
✅ "garage for 2 cars" → garage
✅ "20x20x10 garage" → garage
✅ "2 car garage" → garage
✅ "need a shed" → shed
✅ "looking for barn" → barn
❌ "hello" → null
❌ "20x20x10" → null
❌ "what's up" → null

Text: "${userInput}"

Return ONLY: garage, shed, barn, or null
NO other text:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            const extracted = response.trim().toLowerCase();

            logger.info(`[ParameterExtractor] AI raw response: "${extracted}"`);

            if (extracted === 'null' || extracted === '') {
                logger.info(`[ParameterExtractor] AI: No building_type detected`);
                return null;
            }

            const validTypes = ['garage', 'shed', 'barn'];
            if (validTypes.includes(extracted)) {
                logger.info(`[ParameterExtractor] ✅ AI extracted building_type: ${extracted}`);
                return extracted;
            }

            logger.warn(`[ParameterExtractor] AI returned invalid building_type: ${extracted}`);
            return null;

        } catch (error) {
            logger.error(`[ParameterExtractor] Error extracting building_type:`, error);
            return null;
        }
    }


    private async tryBatchDimensionExtractionWithAI(userInput: string): Promise<Partial<UserFriendlyParams> | null> {
        if (!userInput) {
            logger.debug(`[tryBatchDimensionExtractionWithAI] Empty input`);
            return null;
        }

        try {
            logger.info(`[tryBatchDimensionExtractionWithAI] Starting batch extraction for: "${userInput}"`);

            // ✅ STEP 1: Try DimensionManager patterns first (fast path)
            logger.info(`[tryBatchDimensionExtractionWithAI] Attempting pattern matching...`);
            const calculation = this.dimensionManager.calculateDimensions(userInput);

            logger.debug(`[tryBatchDimensionExtractionWithAI] Pattern result:`, {
                width: calculation?.width,
                length: calculation?.length,
                height: calculation?.height,
            });

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(`[tryBatchDimensionExtractionWithAI] ✅ PATTERN MATCH SUCCESS: ${calculation.width}x${calculation.length}x${calculation.height}`);
                return {
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height,
                };
            }

            // ✅ STEP 2: If patterns fail, use AI to detect batch dimensions
            logger.info(`[tryBatchDimensionExtractionWithAI] Pattern match failed, attempting AI detection...`);
            const aiResult = await this.detectBatchDimensionsWithAI(userInput);

            logger.debug(`[tryBatchDimensionExtractionWithAI] AI result:`, {
                width: aiResult?.width,
                length: aiResult?.length,
                height: aiResult?.height,
            });

            if (aiResult && aiResult.width && aiResult.length && aiResult.height) {
                logger.info(`[tryBatchDimensionExtractionWithAI] ✅ AI DETECTION SUCCESS: ${aiResult.width}x${aiResult.length}x${aiResult.height}`);
                return aiResult;
            }

            logger.debug(`[tryBatchDimensionExtractionWithAI] ❌ No batch dimensions found`);
            return null;

        } catch (error) {
            logger.error(`[tryBatchDimensionExtractionWithAI] Exception:`, error);
            return null;
        }
    }

    private detectExplicitDimensions(input: string): boolean {
        const patterns = [
            /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i,
            /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,
            /width.*?(\d+).*?length.*?(\d+).*?height.*?(\d+)/i,
            /(\d+)\s*ft.*?(\d+)\s*ft.*?(\d+)\s*ft/i,
        ];

        return patterns.some(pattern => pattern.test(input));
    }

    private async detectBatchDimensionsWithAI(userInput: string): Promise<Partial<UserFriendlyParams> | null> {
        try {
            logger.info(`[detectBatchDimensionsWithAI] AI analyzing: "${userInput}"`);

            const prompt = `Analyze the user input and extract ALL THREE building dimensions if provided.

CRITICAL RULES:
1. User must provide ALL THREE dimensions (width, length, height) in feet
2. Dimensions can appear in any format or language pattern
3. If ANY dimension is missing → return found: false
4. Extract numbers ONLY - ignore "feet", "ft", "garage", etc.

Return ONLY JSON (no markdown, no explanation):
{
  "found": <true ONLY if all 3 present, false otherwise>,
  "width": <number or null>,
  "length": <number or null>,
  "height": <number or null>
}

Examples:
- "width 10 length 10 height 10" → {"found": true, "width": 10, "length": 10, "height": 10}
- "10x10x10" → {"found": true, "width": 10, "length": 10, "height": 10}
- "i want a garage width 10 length 10 height 10" → {"found": true, "width": 10, "length": 10, "height": 10}
- "width 10" → {"found": false, "width": null, "length": null, "height": null}

User input: "${userInput}"

ONLY valid JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            logger.debug(`[detectBatchDimensionsWithAI] AI response: "${response}"`);

            const parsed = this.parseAIResponse(response);

            logger.debug(`[detectBatchDimensionsWithAI] Parsed response:`, parsed);

            if (!parsed) {
                logger.warn(`[detectBatchDimensionsWithAI] Failed to parse response`);
                return null;
            }

            // ✅ STRICT: Only return if ALL three found
            if (parsed.found === true && parsed.width && parsed.length && parsed.height) {
                logger.info(`[detectBatchDimensionsWithAI] ✅ AI SUCCESS: ${parsed.width}x${parsed.length}x${parsed.height}`);
                return {
                    width: parsed.width,
                    length: parsed.length,
                    height: parsed.height,
                };
            }

            logger.debug(`[detectBatchDimensionsWithAI] AI: Not all dimensions found or found=false`, {
                found: parsed.found,
                width: parsed.width,
                length: parsed.length,
                height: parsed.height,
            });

            return null;

        } catch (error) {
            logger.error(`[detectBatchDimensionsWithAI] Exception:`, error);
            return null;
        }
    }

    private parseAIResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[parseAIResponse] No JSON in response: "${response}"`);
                return null;
            }

            return JSON.parse(jsonMatch[0]);
        } catch (error) {
            logger.error(`[parseAIResponse] Failed to parse response:`, error);
            return null;
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

    public async extractWithUnifiedPrompt(context: ExtractionContext): Promise<string> {
        logger.info(`[extractWithUnifiedPrompt] Processing context (${context.userInput.length} chars)`);
        logger.info(`[extractWithUnifiedPrompt] Current field: ${context.currentField}`);

        const calculation: DimensionResult = this.dimensionManager.calculateDimensions(context.userInput);

        const prompt: string = this.promptBuilder.buildUnifiedPrompt(context, calculation);

        return await this.parameterExtractionStrategy.extractLLMResponse(
            context.userInput,
            prompt
        );
    }

    private extractContextFromState(state: LeadAgentStateType): string {
        const lastMessage: BaseMessage = state.messages[state.messages.length - 1];

        if (!lastMessage) {
            return "";
        }

        if (typeof lastMessage.content === "string") {
            return lastMessage.content;
        }

        if (Array.isArray(lastMessage.content)) {
            return lastMessage.content
                .map((c) =>
                    typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)
                )
                .join(" ");
        }

        return "";
    }

    private mergeParameters(current: Record<string, any>, extracted: Record<string, any>): Record<string, any> {
        return { ...current, ...extracted };
    }

    private async processDimensions(
        current: Record<string, any>,
        extracted: Record<string, any>,
        merged: Record<string, any>
    ): Promise<void> {
        logger.info(`[ParameterExtractor] Processing dimensions...`);

        const hasExplicitDimensions = !!(
            extracted.width &&
            extracted.length &&
            extracted.height &&
            !extracted.garage_type
        );

        if (hasExplicitDimensions) {
            logger.info(`[ParameterExtractor] ✅ Explicit dimensions detected`);
            merged.width = extracted.width;
            merged.length = extracted.length;
            merged.height = extracted.height;
            delete merged.garage_type;
            return;
        }

        // ✅ CRITICAL: DON'T auto-calculate dimensions based on garage_type
        // Just preserve existing dimensions and let user provide them
        this.dimensionManager.preserveExistingDimensions(merged, current, extracted);

        logger.info(`[ParameterExtractor] Preserved dimensions: ${merged.width}×${merged.length}×${merged.height}`);
    }

    private async handleDimensionField(
        state: LeadAgentStateType,
        userInput: string,
        currentParams: any
    ): Promise<ExtractionResult> {
        const fieldKey = state.currentField as keyof UserFriendlyParams;
        logger.info(`[ParameterExtractor] Dimension field: ${state.currentField}`);

        // ✅ PRIORITY 1: Simple numeric (e.g., "20", "20 ft")
        const simple = this.trySimpleNumericParse(userInput, state.currentField);
        if (simple) {
            logger.info(`[ParameterExtractor] ✅ Simple numeric: ${simple}`);
            return {
                userFriendlyParams: { ...currentParams, [fieldKey]: simple },
                currentField: null,
                nextStep: "check_missing_fields",
                response: `✓ Set ${state.currentField} to ${simple}ft`,
            };
        }

        // ✅ PRIORITY 2: AI extraction
        const ai = await this.extractSingleDimensionWithAI(
            userInput,
            state.currentField as 'width' | 'length' | 'height'
        );
        if (ai) {
            logger.info(`[ParameterExtractor] ✅ AI extracted: ${ai}`);
            return {
                userFriendlyParams: { ...currentParams, [fieldKey]: ai },
                currentField: null,
                nextStep: "check_missing_fields",
                response: `✓ Set ${state.currentField} to ${ai}ft`,
            };
        }

        // ❌ Failed
        return {
            validationError: `Could not parse "${userInput}" as ${state.currentField}`,
            response: `❌ Please enter a number (e.g., "20" or "20 feet")`,
            nextStep: "ask_for_field",
            currentField: state.currentField,
            userFriendlyParams: currentParams,
        };
    }

    private async validateParameters(params: Record<string, any>, stateMapCache: any): Promise<ValidationResult | null> {
        if (params.state_name) {
            const result: ValidationResult = await ParameterValidator.validateState(
                params.state_name,
                stateMapCache
            );

            if (!result.isValid) {
                return result;
            }

            params.state_name = result.normalizedValue;
        }

        if (params.roof_type) {
            const result: ValidationResult = await ParameterValidator.validateRoofType(params.roof_type);

            if (!result.isValid) {
                return result;
            }

            params.roof_type = result.normalizedValue;
        }

        return null;
    }
}

const extractor = new ParameterExtractor();

export const extractParametersNode = async (state: LeadAgentStateType): Promise<ExtractionResult> => {
    return extractor.extract(state);
};
