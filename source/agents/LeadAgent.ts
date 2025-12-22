import pino from "pino";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { leadAgentGraph } from "@agents/LeadAgentGraph";
import { detectParameterUpdateFromInput, IntentDetector } from "@agents/tools/impl/DetectionHelpers";
import { SessionManager } from "@utils/session/SessionManager";
import { InstantiationError } from "@errors/InstantiationError";
import { ColorOption } from "@agents/tools/io/IColorChoice";
import { ColorService } from "@agents/tools/impl/io/ColorService";
import { ColorServiceImpl } from "@agents/tools/impl/ColorServiceImpl";
import { AddonService } from "@agents/tools/impl/io/AddonService";
import { AddonServiceImpl } from "@agents/tools/impl/AddonServiceImpl";
import {AddonFromDB} from "@agents/tools/io/IAddonDatabase";
import { calculatePriceNode } from "@agents/tools/impl/PriceCalculationNode";
import { showAddonsNode } from "@agents/tools/impl/AddonServiceImpl";
import { generateGarageVisualizationNode } from "@agents/tools/impl/VisualizationNode";
import { ParameterUpdateServiceImpl } from "@agents/tools/impl/ParameterUpdateServiceImpl";
import  { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import { askForFieldNode } from "@agents/tools/impl/AskForFieldNode";
import {DimensionManager} from "@agents/tools/impl/DimensionManager";
import {ColorChangeHandler} from "@agents/tools/impl/ColorChangeHandler";
import {ParameterUpdateDetector} from "@agents/tools/impl/ParameterUpdateDetector";
import {fuzzyMatcher} from "@agents/tools/impl/FuzzyIntentMatcher";
import { aiDimensionDetector } from "./tools/impl/AIDimensionDetector";
import {garageDimensionHandler} from "@agents/tools/impl/GarageDimensionHandler";
import {fuzzyChoiceMatcher} from "@agents/tools/impl/FuzzyChoiceMatcher";
import { createLogger } from "@utils/logger/Log";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
const logger: pino.Logger = createLogger(module);

export class LeadAgent
{
    private static instance: LeadAgent;
    private sessionManager: SessionManager;
    private readonly addonManagerInstance: AddonService = AddonServiceImpl.getInstance();
    private readonly colorService: ColorService = ColorServiceImpl.getInstance();

    private constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        this.sessionManager = SessionManager.getInstance({
            SESSION_TIMEOUT: 30 * 60 * 1000,
            CLEANUP_INTERVAL: 5 * 60 * 1000,
            WARNING_THRESHOLD: 5 * 60 * 1000,
        });
    }

    public static async getInstance(): Promise<LeadAgent>
    {
        if (!LeadAgent.instance)
        {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }

    public async endSession(sessionId: string): Promise<void>
    {
        if (this.sessionManager.endSession(sessionId))
        {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
    }

    public async reset(): Promise<void>
    {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] Full reset complete");
    }

    public async run(sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] Session ${sessionId} - Input: ${input}`);

        try {
            const session = this.getOrCreateSession(sessionId);
            await session.memory.chatHistory.addUserMessage(input);

            if (session.state._pendingCustomizationDecision) {
                logger.info(`[LeadAgent] ⏳ Waiting for customization decision`);
                return await this.handleCustomizationDecision(session, sessionId, input);
            }

            const inputContext = this.analyzeInputContext(input, session.state.currentField);
            logger.info(`[LeadAgent] Input context:`, {
                isSimpleNumber: inputContext.isSimpleNumber,
                currentField: session.state.currentField,
                isChoiceField: inputContext.isChoiceField,
                shouldSkipGarageDetection: inputContext.shouldSkipGarageDetection,
            });

            if (!inputContext.shouldSkipGarageDetection && !session.state.currentField) {
                logger.info(`[LeadAgent] 🔍 STEP 1: Attempting FAST regex batch dimension detection...`);
                const batchDimensions = await this.detectBatchDimensionsRegexOnly(input);

                if (batchDimensions && batchDimensions.width && batchDimensions.length && batchDimensions.height) {
                    logger.info(`[LeadAgent] ✅ REGEX BATCH DIMENSIONS DETECTED: ${batchDimensions.width}×${batchDimensions.length}×${batchDimensions.height}`);

                    session.state.userFriendlyParams.width = batchDimensions.width;
                    session.state.userFriendlyParams.length = batchDimensions.length;
                    session.state.userFriendlyParams.height = batchDimensions.height;
                    session.state.hasGarageIntent = true;

                    const response = `✓ Got it! Building dimensions: ${batchDimensions.width}ft wide × ${batchDimensions.length}ft long × ${batchDimensions.height}ft tall`;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    const detectedBuildingType = await this.detectBuildingTypeFromInput(input);
                    if (detectedBuildingType) {
                        logger.info(`[LeadAgent] ✅ Auto-detected building_type: ${detectedBuildingType}`);
                        session.state.userFriendlyParams.building_type = detectedBuildingType;
                    }

                    return await this.handlePostGarageIntent(session, sessionId, input);
                }
                logger.info(`[LeadAgent] Regex batch detection failed, continuing to STEP 2...`);
            }

            if (!inputContext.shouldSkipGarageDetection) {
                logger.info(`[LeadAgent] 🔍 STEP 2: Checking garage intent (2-car, 3-car, etc.)...`);
                const garageResponse = await this.handleGarageIntent(session, sessionId, input);
                if (garageResponse) {
                    const hasAllDimensions = session.state.userFriendlyParams.width &&
                        session.state.userFriendlyParams.length &&
                        session.state.userFriendlyParams.height;

                    if (hasAllDimensions && !session.state._pendingCustomizationDecision) {
                        logger.info(`[LeadAgent] ✅ All dimensions obtained from garage intent, asking about customization`);
                        return await this.handlePostGarageIntent(session, sessionId, input);
                    }

                    return garageResponse;
                }
                logger.info(`[LeadAgent] Garage intent not detected, continuing to STEP 3...`);
            }

            logger.info(`[LeadAgent] 🔍 STEP 3: AI dimension detection (fallback with 30s timeout)...`);
            const aiDimensionResponse = await this.handleAIDimensionDetection(session, sessionId, input);

            if (aiDimensionResponse) {
                const hasAllDimensions = session.state.userFriendlyParams.width &&
                    session.state.userFriendlyParams.length &&
                    session.state.userFriendlyParams.height;

                if (hasAllDimensions && !session.state._pendingCustomizationDecision) {
                    logger.info(`[LeadAgent] ✅ All dimensions obtained via AI, asking about customization`);
                    return await this.handlePostGarageIntent(session, sessionId, input);
                }

                return aiDimensionResponse;
            }

            const dimensionState = this.checkDimensionState(session);

            if (dimensionState.isInDimensionFieldMode) {
                return await this.runDimensionFieldMode(session, sessionId, input);
            }

            if (dimensionState.isInChoiceFieldMode) {
                return await this.runChoiceFieldMode(session, sessionId, input);
            }

            if (dimensionState.isInDimensionFieldMode) {
                const batchResponse = await this.handleBatchDimensions(session, sessionId, input, "in-field");
                if (batchResponse) return batchResponse;
            }

            if (!dimensionState.hasDimensions && !session.state.currentField) {
                const batchResponse = await this.handleBatchDimensions(session, sessionId, input, "explicit");
                if (batchResponse) return batchResponse;
            } else if (dimensionState.hasDimensions) {
                logger.info(`[LeadAgent] ✅ Dimensions already complete, SKIPPING batch detection`);
            }

            if (IntentDetector.detectReset(input)) {
                return await this.handleReset(session, sessionId, input);
            }

            const batchResponse = await this.handleBatchDimensions(session, sessionId, input, "main");
            if (batchResponse) return batchResponse;

            if (session.state.currentField === "color" && !session.state.color && !session.state.priceCalculated) {
                return await this.runColorPhase(session, sessionId, input);
            }

            if (session.state.priceCalculated) {
                return await this.runPostPricePhase(session, sessionId, input);
            }

            logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

            const shouldSkipGarageDetection = await this.shouldSkipGarageDetectionForState(input, session.state.currentField);
            const update = (!dimensionState.isInChoiceFieldMode && !shouldSkipGarageDetection)
                ? await detectParameterUpdateFromInput(input, session.state.currentField || undefined)
                : null;

            if (update && session.state.currentField) {
                return await this.handleParameterUpdate(session, sessionId, update, input);
            }

            return await this.invokeLeadAgentGraph(session, sessionId, input, update);

        } catch (error) {
            logger.error(`[LeadAgent] Error:`, error);
            return "An error occurred. Please try again.";
        }
    }

    private async invokeLeadAgentGraph(session: any, sessionId: string, input: string, update: any): Promise<string>
    {
        const result = await leadAgentGraph.invoke({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
            hasGarageIntent: session.state.hasGarageIntent,
            priceCalculated: session.state.priceCalculated || false,
            currentField: (session.state.currentField as keyof UserFriendlyParams) || null,
            validationError: null,
            response: "",
            nextStep: update ? "handle_update" : null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: update ? [update] : [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
        });

        const response = result.response;
        await session.memory.chatHistory.addAIChatMessage(response);

        session.state.userFriendlyParams = result.userFriendlyParams;
        session.state.hasGarageIntent = result.hasGarageIntent;
        session.state.priceCalculated = result.priceCalculated || false;
        session.state.currentField = result.currentField;
        session.state.color = result.color;
        session.state.colorCost = result.colorCost;
        session.stateMapCache = result.stateMapCache;
        session.roofMapCache = result.roofMapCache;

        if (result.priceCalculated && result.pricingData) {
            session.state.pricingData = result.pricingData;
            session.state.basePrice = result.basePrice || 0;
            session.state.selectedAddons = result.selectedAddons || [];
            session.state.finalPrice = result.finalPrice || 0;
        }

        return response;
    }

    private async runColorPhase(session: any, sessionId: string, input: string): Promise<string>
    {
        const userInputLower = input.toLowerCase().trim();
        const trimmedInput = input.trim();
        const isSimpleNumber = /^\d+$/.test(trimmedInput);
        const isLikelyColorSelection = isSimpleNumber && parseInt(trimmedInput) >= 1 && parseInt(trimmedInput) <= 10;

        if (isLikelyColorSelection) {
            return await this.handleColorSelection(session, sessionId, input);
        }

        try {
            const paramUpdate = await ParameterUpdateDetector.getInstance().detectParameterUpdate(userInputLower);
            if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                return await this.handleParameterUpdateDuringColor(session, sessionId, paramUpdate);
            }
        } catch (error) {
            logger.error(`[LeadAgent] Error detecting parameter update during color phase:`, error);
        }

        if (/^(add|get|want|need)\s+\d+\s+(window|door|brace|cupola|sectional)/i.test(input)) {
            return await this.handleAddonRequestDuringColor(session, sessionId);
        }

        return await this.handleColorSelection(session, sessionId, input);
    }

    private async runPostPricePhase(session: any, sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);

        const userInput = input.toLowerCase().trim();

        const skipResult = await fuzzyMatcher.isSkipIntent(userInput);
        if (skipResult.isSkip && skipResult.confidence !== 'low') {
            return await this.handleUserDeclinesAddons(session, sessionId);
        }

        if (!input?.trim()) {
            return await this.handleEmptyInputAfterPrice(session, sessionId);
        }

        try {
            const paramUpdate = await ParameterUpdateDetector.getInstance().detectParameterUpdate(userInput);
            if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                return await this.handleParameterUpdateAfterPrice(session, sessionId, paramUpdate, userInput);
            }
        } catch (error) {
            logger.error(`[LeadAgent] Error detecting parameter update:`, error);
        }

        const explicitDimensionUpdate = this.detectExplicitDimensionUpdate(userInput);
        if (explicitDimensionUpdate) {
            logger.info(`[LeadAgent] 🔄 Explicit dimension update detected: ${explicitDimensionUpdate.field} = ${explicitDimensionUpdate.value}`);
            return await this.handleParameterUpdateAfterPrice(session, sessionId, explicitDimensionUpdate, input);
        }

        try {
            const colorIntent = await ColorChangeHandler.getInstance().extractColorIntent(userInput);
            if (colorIntent.isColorChangeRequest) {
                return await this.handleColorChangeRequest(session, sessionId, userInput);
            }
        } catch (error) {
            logger.error(`[LeadAgent] Error checking color intent:`, error);
        }

        if (this.detectAddonRequest(userInput)) {
            return await this.handleAddonRequestAfterPrice(session, sessionId, userInput);
        }

        return await this.handleEmptyInputAfterPrice(session, sessionId);
    }

    private async handleReset(session: any, sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] Reset intent detected`);

        const result = await leadAgentGraph.invoke({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: {},
            hasGarageIntent: false,
            priceCalculated: false,
            currentField: null,
            validationError: null,
            response: "",
            nextStep: "handle_reset",
            stateMapCache: new Map(),
            roofMapCache: new Map(),
            pendingUpdates: [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
        });

        const response = result.response;
        await session.memory.chatHistory.addAIChatMessage(response);

        session.state = {
            userFriendlyParams: {},
            hasGarageIntent: false,
            priceCalculated: false,
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
        };

        return response;
    }

    private async createFieldResult(session: any, sessionId: string, nextField: keyof UserFriendlyParams): Promise<any>
    {
        return await askForFieldNode({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams,
            hasGarageIntent: true,
            priceCalculated: false,
            currentField: nextField,
            validationError: null,
            response: "",
            nextStep: null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
            generatedImageUrl: "",
            _pendingConfirmation: null
        });
    }

    private async handleParameterUpdateDuringColor(session: any, sessionId: string, paramUpdate: any): Promise<string>
    {
        logger.info(`[LeadAgent] 🔄 Parameter update detected during color phase: ${paramUpdate.field} = ${paramUpdate.value}`);

        try {
            const fieldKey = paramUpdate.field as keyof UserFriendlyParams;
            let parsedValue: any = paramUpdate.value;

            if (["width", "length", "height", "utility_length"].includes(paramUpdate.field)) {
                parsedValue = parseInt(paramUpdate.value, 10);
                if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue > 500) {
                    return `Invalid value for ${paramUpdate.field}. Please provide a number between 1 and 500.`;
                }
            }

            session.state.userFriendlyParams[fieldKey] = parsedValue;
            logger.info(`[LeadAgent] ✅ Updated ${paramUpdate.field} to ${parsedValue}`);

            const updateMessage = `✅ Updated ${paramUpdate.field} to ${parsedValue}\n\n`;
            const continueMessage = `Let's continue. ${this.getColorSelectionPrompt()}`;

            const fullResponse = updateMessage + continueMessage;
            await session.memory.chatHistory.addAIChatMessage(fullResponse);

            return fullResponse;
        } catch (error) {
            logger.error(`[LeadAgent] Error updating parameter during color phase:`, error);
            return `Error updating ${paramUpdate.field}. Please try again.`;
        }
    }

    private async handleAddonRequestDuringColor(session: any, sessionId: string): Promise<string>
    {
        logger.info(`[LeadAgent] ⚠️ User requesting addons during color phase`);
        logger.info(`[LeadAgent] Setting default color (White) and proceeding to price calculation`);

        try {
            session.state.color = "White";
            session.state.userFriendlyParams.color = "White";

            const originalDimensions = {
                width: session.state.userFriendlyParams.width,
                length: session.state.userFriendlyParams.length,
                height: session.state.userFriendlyParams.height,
            };

            const priceResult = await calculatePriceNode({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                hasGarageIntent: true,
                priceCalculated: false,
                currentField: null,
                validationError: null,
                response: "",
                nextStep: null,
                stateMapCache: session.stateMapCache || new Map(),
                roofMapCache: session.roofMapCache || new Map(),
                pendingUpdates: [],
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
                color: "White",
                colorCost: 0,
                generatedImageUrl: "",
                _pendingConfirmation: null
            });

            this.restoreDimensionsIfCorrupted(session, originalDimensions);
            this.updateSessionWithPrice(session, priceResult, "White");

            logger.info(`[LeadAgent] 🎨 Price calculated, showing addon menu`);

            const addonsState = await this.createAddonsState(session, sessionId);
            const addonsResponse = await showAddonsNode(addonsState);

            const response = `${priceResult.response}\n\n${addonsResponse.response}`;
            await session.memory.chatHistory.addAIChatMessage(response);

            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error handling addon request during color phase:`, error);
            return `Error processing your request. Please try again.`;
        }
    }

    private async runDimensionFieldMode(session: any, sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🎯 DIMENSION FIELD MODE: ${session.state.currentField}`);
        logger.info(`[LeadAgent] User input: "${input}"`);

        try {
            const dimensionResult = await fuzzyMatcher.extractDimensionWithValue(
                input,
                session.state.currentField as 'width' | 'length' | 'height'
            );

            logger.info(`[LeadAgent] Fuzzy matcher returned:`, JSON.stringify(dimensionResult));

            if (!dimensionResult.value || dimensionResult.confidence === 'low') {
                logger.warn(`[LeadAgent] Fuzzy matcher failed or low confidence`);

                let errorMsg = `I couldn't understand "${input}" as a dimension.\n\n`;
                if (dimensionResult.reasoning) {
                    errorMsg += `Reason: ${dimensionResult.reasoning}\n\n`;
                }

                errorMsg += `💡 Try:\n`;
                errorMsg += `• Just the number: "20"\n`;
                errorMsg += `• With units: "20 feet" or "20ft"\n`;
                errorMsg += `• Even with typos: "widt 20" works!\n\n`;
                errorMsg += `Asking for: **${session.state.currentField}**`;

                await session.memory.chatHistory.addAIChatMessage(errorMsg);
                return errorMsg;
            }

            const newValue = dimensionResult.value;
            if (newValue <= 0 || newValue > 500) {
                const rangeError = `${newValue}ft is outside the valid range.\n\nPlease enter a dimension between 1 and 500 feet.`;
                await session.memory.chatHistory.addAIChatMessage(rangeError);
                return rangeError;
            }

            const fieldKey = session.state.currentField as keyof UserFriendlyParams;
            session.state.userFriendlyParams[fieldKey] = newValue;
            session.state.currentField = null;

            let response = `✓ Got it! Set ${fieldKey} to ${newValue}ft`;
            if (dimensionResult.reasoning && dimensionResult.reasoning.toLowerCase().includes('typo')) {
                response = `✓ I understood "${input}" as ${fieldKey}: ${newValue}ft`;
            }

            await session.memory.chatHistory.addAIChatMessage(response);

            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
            logger.info(`[LeadAgent] Missing fields after update:`, missingFields);

            if (missingFields.length > 0) {
                const nextField = missingFields[0];
                session.state.currentField = nextField as keyof UserFriendlyParams;

                const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
                const fullResponse = `${response}\n\n${fieldResult.response}`;
                await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                return fullResponse;
            }

            logger.info(`[LeadAgent] ✅ All dimensions complete!`);
            return response + "\n\nGreat! Let me calculate your quote...";
        } catch (error) {
            logger.error(`[LeadAgent] ERROR in dimension field mode:`, error);
            const errorMsg = `Sorry, something went wrong processing that dimension.\n\nPlease try again with a simple number like "20"`;
            await session.memory.chatHistory.addAIChatMessage(errorMsg);
            return errorMsg;
        }
    }

    /**
     * Run choice field mode - handles user selection of roof type, gauge, or building type
     */
    private async runChoiceFieldMode(session: any, sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🎯 In CHOICE field mode (${session.state.currentField})`);

        try {
            const trimmedInput = input.trim().toLowerCase();
            const isSimpleNumber = /^\d+$/.test(trimmedInput);

            logger.info(`[LeadAgent] 🔍 Checking for parameter updates during choice field mode...`);

            if (isSimpleNumber) {
                logger.info(`[LeadAgent] ⚠️ Input "${trimmedInput}" is a simple number, treating as choice selection (SKIPPING parameter detection)`);
            } else {
                logger.info(`[LeadAgent] Input is NOT a simple number, checking for parameter updates...`);

                try {
                    const paramDetector = ParameterUpdateDetector.getInstance();
                    const paramUpdate = await paramDetector.detectParameterUpdate(input);

                    if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                        logger.info(`[LeadAgent] ✅ PARAMETER UPDATE DETECTED DURING CHOICE MODE: ${paramUpdate.field} = ${paramUpdate.value} (confidence: ${paramUpdate.confidence})`);
                        return await this.handleParameterUpdate(session, sessionId, paramUpdate, input);
                    } else {
                        logger.info(`[LeadAgent] No parameter update detected (confidence: ${paramUpdate.confidence})`);
                    }
                } catch (error) {
                    logger.error(`[LeadAgent] Error detecting parameter update during choice field:`, error);
                }
            }

            logger.info(`[LeadAgent] 🔍 Checking for dimension updates during choice field mode...`);

            const dimensionDetection = await aiDimensionDetector.detectDimensionAwareOfContext(
                input,
                session.state.currentField as keyof UserFriendlyParams | null
            );

            if (dimensionDetection.isDimension && dimensionDetection.confidence !== 'low') {
                logger.info(`[LeadAgent] ✅ DIMENSION UPDATE DETECTED: ${dimensionDetection.field} = ${dimensionDetection.value}ft`);
                const fieldKey = dimensionDetection.field as keyof UserFriendlyParams;
                session.state.userFriendlyParams[fieldKey] = dimensionDetection.value;

                const response = `✓ Got it! Updated ${fieldKey} to ${dimensionDetection.value}ft\n\nNow, back to the question:\n`;

                const fieldResult = await this.createFieldResult(session, sessionId, session.state.currentField as keyof UserFriendlyParams);
                const fullResponse = `${response}${fieldResult.response}`;
                await session.memory.chatHistory.addAIChatMessage(fullResponse);
                return fullResponse;
            }

            if (session.state.priceCalculated && session.state.currentField !== "color") {
                logger.info(`[LeadAgent] 🎨 Price already calculated, checking for color change request...`);
                try {
                    const colorIntent = await ColorChangeHandler.getInstance().extractColorIntent(input);
                    if (colorIntent.isColorChangeRequest) {
                        return await this.handleColorChangeRequest(session, sessionId, input);
                    }
                } catch (error) {
                    logger.error(`[LeadAgent] Error checking color intent during field mode:`, error);
                }
            }

            return await this.runFuzzyChoiceMatch(session, sessionId, input);

        } catch (error) {
            logger.error(`[LeadAgent] ERROR in choice field mode:`, error);
            session.state.currentField = null;
            return `Error processing your input. Let's try again.`;
        }
    }

    /**
     * Run fuzzy matching for choice fields (roof_type, gauge, building_type, color)
     */
    private async runFuzzyChoiceMatch(session: any, sessionId: string, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🎯 NOW USING FUZZY MATCHER for field: ${session.state.currentField}`);
        logger.info(`[LeadAgent] Input: "${input}"`);

        const currentField = session.state.currentField as keyof UserFriendlyParams;
        let choiceResult: any = null;
        let matchedValue: string | null = null;

        const choiceSuggestions: { [key: string]: string } = {
            roof_type: "Try: Vertical, Regular, or Box",
            gauge: "Try: 14 Gauge or 16 Gauge",
            building_type: "Try: Garage, Shed, Barn, or Workshop",
        };

        switch (currentField) {
            case 'roof_type':
                logger.info(`[LeadAgent] 🏠 Matching roof type for input: "${input}"`);
                choiceResult = await fuzzyChoiceMatcher.matchRoofType(input);
                if (choiceResult.matched) {
                    matchedValue = choiceResult.roofType;
                    logger.info(`[LeadAgent] ✅ Roof type matched: ${matchedValue} (confidence: ${choiceResult.confidence})`);
                    session.state.userFriendlyParams.roof_type = choiceResult.roofType;
                } else {
                    logger.warn(`[LeadAgent] Could not match roof type (confidence: ${choiceResult.confidence})`);
                }
                break;

            case 'gauge':
                logger.info(`[LeadAgent] 📏 Matching gauge for input: "${input}"`);
                choiceResult = await fuzzyChoiceMatcher.matchGauge(input);
                if (choiceResult.matched) {
                    matchedValue = choiceResult.gauge;
                    logger.info(`[LeadAgent] ✅ Gauge matched: ${matchedValue} (confidence: ${choiceResult.confidence})`);
                    session.state.userFriendlyParams.gauge = choiceResult.gauge;
                } else {
                    logger.warn(`[LeadAgent] Could not match gauge (confidence: ${choiceResult.confidence})`);
                }
                break;

            case 'building_type':
                logger.info(`[LeadAgent] 🏢 Matching building type for input: "${input}"`);
                choiceResult = await fuzzyChoiceMatcher.matchBuildingType(input);
                if (choiceResult.matched) {
                    matchedValue = choiceResult.buildingType;
                    logger.info(`[LeadAgent] ✅ Building type matched: ${matchedValue} (confidence: ${choiceResult.confidence})`);
                    session.state.userFriendlyParams.building_type = choiceResult.buildingType;
                } else {
                    logger.warn(`[LeadAgent] Could not match building type (confidence: ${choiceResult.confidence})`);
                }
                break;

            case 'color':
                logger.info(`[LeadAgent] 🎨 Matching color for input: "${input}"`);
                const allColors: ColorOption[] = await this.colorService.get();

                if (!allColors || allColors.length === 0) {
                    logger.error(`[LeadAgent] NO COLORS IN DATABASE!`);
                    return `Error: No colors available. Please try again.`;
                }

                const colorMatch = await fuzzyChoiceMatcher.matchColor(input, allColors);
                if (colorMatch.matched && colorMatch.color) {
                    const fullColorOption = allColors.find(c => c.name.toLowerCase() === colorMatch.color!.name.toLowerCase());
                    if (fullColorOption) {
                        return await this.applyColorAndCalculatePrice(session, sessionId, fullColorOption);
                    } else {
                        logger.error(`[LeadAgent] Could not find full color object for: ${colorMatch.color.name}`);
                        return `Error: Color not found in database.`;
                    }
                } else {
                    const suggestions = allColors.slice(0, 3).map(c => c.name).join(", ");
                    return `I didn't find that color. Try: ${suggestions} or "any" for White`;
                }

            default:
                logger.warn(`[LeadAgent] ⚠️ Unknown choice field: ${currentField}`);
                return `Unknown field. Please contact support.`;
        }

        if (!choiceResult) {
            logger.error(`[LeadAgent] choiceResult is null for ${currentField}`);
            return `Error processing choice. Please try again.`;
        }

        if (choiceResult.matched) {
            logger.info(`[LeadAgent] ✅ FUZZY MATCH SUCCESS: ${currentField} = ${matchedValue}`);

            const response = `✓ Got it! ${currentField}: ${matchedValue}`;
            await session.memory.chatHistory.addAIChatMessage(response);

            session.state.currentField = null;

            const allFieldsComplete = this.areAllFieldsComplete(session.state.userFriendlyParams);
            logger.info(`[LeadAgent] All fields complete: ${allFieldsComplete}`);

            if (allFieldsComplete) {
                logger.info(`[LeadAgent] ✅ ALL REQUIRED FIELDS COMPLETE!`);
                session.state.currentField = "color";

                const fieldResult = await this.createFieldResult(session, sessionId, "color" as keyof UserFriendlyParams);
                const fullResponse = `${response}\n\n${fieldResult.response}`;
                await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                return fullResponse;
            }

            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
            if (missingFields.length > 0) {
                const nextField = missingFields[0];
                session.state.currentField = nextField as keyof UserFriendlyParams;

                const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
                const fullResponse = `${response}\n\n${fieldResult.response}`;
                await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                return fullResponse;
            }

            return response;
        }

        if (choiceResult.confidence === 'medium') {
            logger.info(`[LeadAgent] ⚠️ MEDIUM CONFIDENCE: ${currentField} = ${matchedValue}`);
            const confirmMsg = `Did you mean ${matchedValue}? Say "yes" to confirm or try again.`;
            await session.memory.chatHistory.addAIChatMessage(confirmMsg);
            return confirmMsg;
        }

        logger.info(`[LeadAgent] LOW CONFIDENCE: Could not match ${currentField}`);
        const suggestions = choiceSuggestions[currentField as string] || "Please try again.";
        const retryMsg = `I didn't understand that. ${suggestions}`;
        await session.memory.chatHistory.addAIChatMessage(retryMsg);
        return retryMsg;
    }

    private areAllFieldsComplete(params: Partial<UserFriendlyParams>): boolean
    {
        const required = [
            'width', 'length', 'height',
            'state_name', 'roof_type', 'gauge', 'building_type'
        ];

        for (const field of required)
        {
            if (!params[field as keyof UserFriendlyParams]) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get color selection prompt message
     */
    private getColorSelectionPrompt(): string
    {
        return `Now, which color would you prefer for your building? (You can say "any" for default White, or choose from available colors)`;
    }

    private checkDimensionState(session: any): { hasDimensions: boolean; isInDimensionFieldMode: boolean; isInChoiceFieldMode: boolean; originalDimensions: { width?: number; length?: number; height?: number }; }
    {
        const originalDimensions = {
            width: session.state.userFriendlyParams.width,
            length: session.state.userFriendlyParams.length,
            height: session.state.userFriendlyParams.height,
        };

        const hasDimensions = !!(originalDimensions.width && originalDimensions.length && originalDimensions.height);
        const isInFieldMode = !!session.state.currentField;
        const isInChoiceFieldMode = isInFieldMode && ["roof_type", "gauge", "building_type"].includes(session.state.currentField);
        const isInDimensionFieldMode = isInFieldMode && ['width', 'length', 'height', 'utility_length'].includes(session.state.currentField);

        return { hasDimensions, isInDimensionFieldMode, isInChoiceFieldMode, originalDimensions };
    }

    private async handleGarageIntent(session: any, sessionId: string, input: string): Promise<string | null>
    {
        logger.info(`[LeadAgent] 🚗 Checking for garage intent...`);

        const garageResult = await garageDimensionHandler.processGarageIntentSafely(input);

        if (!garageResult.handled) return null;

        logger.info(`[LeadAgent] ✅ GARAGE INTENT HANDLED SAFELY`);
        logger.info(`[LeadAgent] Garage type: ${garageResult.garageType}`);

        session.state.userFriendlyParams = { ...session.state.userFriendlyParams, ...garageResult.updatedParams };
        session.state.hasGarageIntent = true;
        session.state.currentField = null;

        await session.memory.chatHistory.addAIChatMessage(garageResult.response);

        logger.info(`[LeadAgent] 🏢 Attempting to auto-detect building_type...`);
        const detectedBuildingType = await this.detectBuildingTypeFromInput(input);

        if (detectedBuildingType) {
            logger.info(`[LeadAgent] ✅ Auto-detected building_type: ${detectedBuildingType}`);
            session.state.userFriendlyParams.building_type = detectedBuildingType;
        } else {
            logger.info(`[LeadAgent] Could not auto-detect building_type, will ask later`);
        }

        const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
        logger.info(`[LeadAgent] Missing fields after garage: ${missingFields.length}`, missingFields);

        if (missingFields.length === 0) {
            return garageResult.response + "\n\nMoving to price calculation...";
        }

        const nextField = missingFields[0];
        session.state.currentField = nextField as keyof UserFriendlyParams;

        const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
        const fullResponse = `${garageResult.response}\n\n${fieldResult.response}`;
        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);

        return fullResponse;
    }

    private async detectBuildingTypeFromInput(input: string): Promise<string | null>
    {
        logger.info(`[LeadAgent] 🔍 Detecting building type from: "${input}"`);

        try {
            const inputLower = input.toLowerCase();

            if (/\b(garage|car|cars|vehicle)\b/i.test(inputLower)) {
                logger.info(`[LeadAgent] ✅ Detected: Garage`);
                return "Garage";
            }

            if (/\b(shed|storage|tool)\b/i.test(inputLower)) {
                logger.info(`[LeadAgent] ✅ Detected: Shed`);
                return "Shed";
            }

            if (/\b(barn|farm|agricultural)\b/i.test(inputLower)) {
                logger.info(`[LeadAgent] ✅ Detected: Barn`);
                return "Barn";
            }

            if (/\b(workshop|work shop|metal work|fabrication)\b/i.test(inputLower)) {
                logger.info(`[LeadAgent] ✅ Detected: Workshop`);
                return "Workshop";
            }

            logger.info(`[LeadAgent] 🤖 Using AI to detect building type...`);

            const prompt = `Detect the building type from this user input. 

User input: "${input}"

Building types available:
- Garage (car garage, garage for cars, 2-car, 3-car, etc)
- Shed (storage shed, tool shed, storage building)
- Barn (farm barn, agricultural building)
- Workshop (metal workshop, fabrication, work area)

Return ONLY JSON (no markdown):
{
  "detectedType": "Garage" | "Shed" | "Barn" | "Workshop" | null,
  "confidence": "high" | "medium" | "low",
  "reason": "brief explanation"
}

If you cannot confidently detect a building type, return null for detectedType.`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const result = this.parseDetectionResponse(response);

            if (result && result.detectedType && result.confidence !== 'low') {
                logger.info(`[LeadAgent] ✅ AI Detected: ${result.detectedType} (confidence: ${result.confidence})`);
                return result.detectedType;
            }

            logger.info(`[LeadAgent] AI could not detect building type`);
            return null;

        } catch (error) {
            logger.error(`[LeadAgent] Error detecting building type:`, error);
            return null;
        }
    }

    private parseDetectionResponse(response: string): any
    {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[LeadAgent] No JSON found in detection response`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);
            return parsed;
        } catch (error) {
            logger.error(`[LeadAgent] Parse error in detection response:`, error);
            return null;
        }
    }

    private async handlePostGarageIntent(session: any, sessionId: string, input: string): Promise<string> {
        logger.info(`[LeadAgent] 🎯 POST-GARAGE INTENT: Asking about parameter customization`);

        try {
            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);

            logger.info(`[LeadAgent] Current params:`, {
                width: session.state.userFriendlyParams.width,
                length: session.state.userFriendlyParams.length,
                height: session.state.userFriendlyParams.height,
                state_name: session.state.userFriendlyParams.state_name,
                roof_type: session.state.userFriendlyParams.roof_type,
                gauge: session.state.userFriendlyParams.gauge,
                building_type: session.state.userFriendlyParams.building_type,
            });

            logger.info(`[LeadAgent] Missing fields:`, missingFields);

            const customizationPrompt = `
Your garage size is set: ${session.state.userFriendlyParams.width}ft × ${session.state.userFriendlyParams.length}ft × ${session.state.userFriendlyParams.height}ft tall

Would you like to customize anything, or should I generate your quote with defaults?

You can customize:
**Optional customizations:**
• **State**
• **Roof type**
• **Gauge**
• **Building type**
        `;

            const response = customizationPrompt.trim();
            await session.memory.chatHistory.addAIChatMessage(response);

            session.state._pendingCustomizationDecision = true;
            session.state.currentField = null;

            return response;

        } catch (error) {
            logger.error(`[LeadAgent] Error in post-garage intent:`, error);
            return `Error processing request. Please try again.`;
        }
    }

    private async handleCustomizationDecision(session: any, sessionId: string, input: string): Promise<string> {
        logger.info(`[LeadAgent] 🤔 Handling customization decision: "${input}"`);

        try {
            const userInputLower = input.toLowerCase().trim();

            const wantCustomizeKeywords = /^(yes|customize|custom|ok|sure|absolutely|definitely|let's|let me|please)$/i;
            const skipKeywords = /^(no|skip|nope|nah|don't|dont|pass|later)$/i;

            let wantsToCustomize = false;

            if (wantCustomizeKeywords.test(userInputLower)) {
                wantsToCustomize = true;
                logger.info(`[LeadAgent] ✅ Direct keyword match: User wants to CUSTOMIZE`);
            } else if (skipKeywords.test(userInputLower)) {
                wantsToCustomize = false;
                logger.info(`[LeadAgent] ✅ Direct keyword match: User wants to SKIP`);
            } else {
                const skipResult = await fuzzyMatcher.isSkipIntent(userInputLower);
                wantsToCustomize = !skipResult.isSkip || skipResult.confidence === 'low';
                logger.info(`[LeadAgent] Fuzzy matcher: Skip intent = ${skipResult.isSkip}, confidence = ${skipResult.confidence}`);
                logger.info(`[LeadAgent] User wants to customize: ${wantsToCustomize}`);
            }

            session.state._pendingCustomizationDecision = false;

            if (!wantsToCustomize) {
                logger.info(`[LeadAgent] ✅ User declined customization - generating quote with DEFAULTS`);
                return await this.generateQuoteWithDefaults(session, sessionId);
            }

            logger.info(`[LeadAgent] ✅ User wants to customize - collecting parameters`);

            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
            logger.info(`[LeadAgent] Missing fields for customization:`, missingFields);

            if (missingFields.length === 0) {
                logger.info(`[LeadAgent] ⚠️ All fields already complete! Calculating price`);
                return await this.calculatePriceAfterUpdate(session, sessionId);
            }

            const nextField = missingFields[0];
            session.state.currentField = nextField as keyof UserFriendlyParams;

            logger.info(`[LeadAgent] 🎯 Asking for first customization field: ${nextField}`);

            const fieldResult = await this.createFieldResult(
                session,
                sessionId,
                nextField as keyof UserFriendlyParams
            );

            const response = `✅ Great! Let me collect some details to customize your quote.\n\n${fieldResult.response}`;
            await session.memory.chatHistory.addAIChatMessage(response);

            logger.info(`[LeadAgent] ✅ Customization field request sent: ${nextField}`);

            return response;

        } catch (error) {
            logger.error(`[LeadAgent] Error handling customization decision:`, error);
            session.state._pendingCustomizationDecision = false;
            return `Error processing your response. Please say "customize"/"yes" or "skip"/"no"`;
        }
    }

    private async generateQuoteWithDefaults(session: any, sessionId: string): Promise<string> {
        logger.info(`[LeadAgent] 🎨 Generating quote with DEFAULT parameters - NO ADDONS MENU`);

        try {
            const defaults = {
                state_name: "Default",
                roof_type: "Regular",
                gauge: "16 Gauge",
                building_type: session.state.userFriendlyParams.building_type || "Garage",
                color: "White",
            };

            session.state.userFriendlyParams = {
                ...session.state.userFriendlyParams,
                ...defaults,
            };

            logger.info(`[LeadAgent] Applied defaults:`, defaults);
            logger.info(`[LeadAgent] Final params:`, session.state.userFriendlyParams);

            const priceResult = await calculatePriceNode({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                hasGarageIntent: true,
                priceCalculated: false,
                currentField: null,
                validationError: null,
                response: "",
                nextStep: null,
                stateMapCache: session.stateMapCache || new Map(),
                roofMapCache: session.roofMapCache || new Map(),
                pendingUpdates: [],
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
                color: "White",
                colorCost: 0,
                generatedImageUrl: "",
                _pendingConfirmation: null,
            });

            this.updateSessionWithPrice(session, priceResult, "White");

            const finalTotal = this.calculateAndLogFinalPrice(session, []);
            const visualizationState = await this.createVisualizationState(
                session,
                sessionId,
                [],
                finalTotal
            );

            logger.info(`[LeadAgent] 🎨 GENERATING IMAGE with defaults: Final=${finalTotal}`);

            const visualizationResult = await generateGarageVisualizationNode(visualizationState);

            await session.memory.chatHistory.addAIChatMessage(visualizationResult.response);

            session.state.priceCalculated = true;
            session.state.finalPrice = finalTotal;
            session.state.selectedAddons = [];
            session.state.generatedImageUrl = visualizationResult.generatedImageUrl || "";

            return visualizationResult.response;

        } catch (error) {
            logger.error(`[LeadAgent] Error generating quote with defaults:`, error);
            return `Error calculating price. Please try again or specify parameters.`;
        }
    }

    private async handleAIDimensionDetection(session: any, sessionId: string, input: string): Promise<string | null>
    {
        logger.info(`[LeadAgent] 🤖 Running AI dimension detection with 30s timeout...`);

        if (session.state.currentField && ['roof_type', 'gauge', 'building_type', 'color', 'state_name'].includes(session.state.currentField)) {
            logger.info(`[LeadAgent] ⏭️ In choice field mode (${session.state.currentField}), SKIPPING AI dimension detection`);
            return null;
        }

        try {
            const timeoutPromise = new Promise<null>((resolve) => {
                setTimeout(() => {
                    logger.warn(`[LeadAgent] ⚠️ AI dimension detection timed out after 30s`);
                    resolve(null);
                }, 30000);
            });

            const batchDimensionsPromise = aiDimensionDetector.detectMultipleDimensions(input);
            const batchDimensions = await Promise.race([batchDimensionsPromise, timeoutPromise]);

            if (!batchDimensions || batchDimensions.length !== 3) {
                logger.warn(`[LeadAgent] ⚠️ AI batch detection failed or returned incomplete data`);

                const dimensionDetection = await Promise.race([
                    aiDimensionDetector.detectDimensionAwareOfContext(
                        input,
                        session.state.currentField as keyof UserFriendlyParams | null
                    ),
                    timeoutPromise
                ]);

                if (dimensionDetection && dimensionDetection.isDimension && dimensionDetection.confidence !== 'low') {
                    const fieldKey = dimensionDetection.field as keyof UserFriendlyParams;
                    session.state.userFriendlyParams[fieldKey] = dimensionDetection.value;

                    let response = `✓ Got it! Updated ${fieldKey} to ${dimensionDetection.value}ft`;
                    if (dimensionDetection.reasoning.toLowerCase().includes('typo')) {
                        response = `✓ I understood "${input}" as ${fieldKey}: ${dimensionDetection.value}ft`;
                    }

                    await session.memory.chatHistory.addAIChatMessage(response);

                    const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                    if (missingFields.length === 0) {
                        return response + "\n\nAll set! Let me calculate your quote...";
                    }

                    const nextField = missingFields[0];
                    session.state.currentField = nextField as keyof UserFriendlyParams;
                    const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
                    const fullResponse = `${response}\n\n${fieldResult.response}`;
                    await session.memory.chatHistory.addAIChatMessage(fieldResult.response);

                    return fullResponse;
                }

                return null;
            }

            const widthDim = batchDimensions.find(d => d.field === 'width');
            const lengthDim = batchDimensions.find(d => d.field === 'length');
            const heightDim = batchDimensions.find(d => d.field === 'height');

            if (widthDim && lengthDim && heightDim) {
                logger.info(`[LeadAgent] ✅ ALL 3 DIMENSIONS DETECTED from AI:`);
                logger.info(`  Width: ${widthDim.value}ft, Length: ${lengthDim.value}ft, Height: ${heightDim.value}ft`);

                session.state.userFriendlyParams.width = widthDim.value;
                session.state.userFriendlyParams.length = lengthDim.value;
                session.state.userFriendlyParams.height = heightDim.value;
                session.state.hasGarageIntent = true;

                let response = `✓ Got it! Building dimensions: ${widthDim.value}ft wide × ${lengthDim.value}ft long × ${heightDim.value}ft tall`;
                await session.memory.chatHistory.addAIChatMessage(response);

                const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                logger.info(`[LeadAgent] Missing fields after AI batch dimensions:`, missingFields);

                if (missingFields.length === 0) {
                    return response + "\n\nMoving to price calculation...";
                }

                const nextField = missingFields[0];
                session.state.currentField = nextField as keyof UserFriendlyParams;
                const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
                const fullResponse = `${response}\n\n${fieldResult.response}`;
                await session.memory.chatHistory.addAIChatMessage(fieldResult.response);

                return fullResponse;
            }

            return null;

        } catch (error) {
            logger.error(`[LeadAgent] ERROR in AI dimension detection:`, error);
            return null;
        }
    }

    private analyzeInputContext(
        input: string,
        currentField: string | null | undefined
    ): {
        isSimpleNumber: boolean;
        isChoiceField: boolean;
        shouldSkipGarageDetection: boolean;
        inputType: 'choice_selection' | 'garage_intent' | 'dimension' | 'unknown';
    } {
        const trimmedInput = input.trim();
        const isSimpleNumber = /^\d+$/.test(trimmedInput);
        const numValue = isSimpleNumber ? parseInt(trimmedInput, 10) : null;

        const choiceFields = new Set(['roof_type', 'gauge', 'building_type', 'color']);
        const isChoiceField = currentField ? choiceFields.has(currentField) : false;

        const dimensionFields = new Set(['width', 'length', 'height', 'utility_length']);
        const isDimensionField = currentField ? dimensionFields.has(currentField) : false;

        logger.info(`[LeadAgent] analyzeInputContext: "${trimmedInput}"`, {
            isSimpleNumber,
            currentField,
            isChoiceField,
            isDimensionField,
            numValue,
        });

        if (isChoiceField && isSimpleNumber) {
            logger.info(`[LeadAgent] Context: CHOICE FIELD - treating "${trimmedInput}" as position selection`);
            return {
                isSimpleNumber,
                isChoiceField: true,
                shouldSkipGarageDetection: true,
                inputType: 'choice_selection',
            };
        }

        if (isDimensionField && isSimpleNumber) {
            logger.info(`[LeadAgent] Context: DIMENSION FIELD - treating "${trimmedInput}" as dimension value`);
            return {
                isSimpleNumber,
                isChoiceField: false,
                shouldSkipGarageDetection: true,
                inputType: 'dimension',
            };
        }

        if (!currentField && isSimpleNumber) {
            logger.info(`[LeadAgent] Context: INITIAL FLOW - "${trimmedInput}" could be garage (2-car, 3-car) or dimension`);
            logger.info(`[LeadAgent] Will let garage handler process with strict validation`);
            return {
                isSimpleNumber,
                isChoiceField: false,
                shouldSkipGarageDetection: false,
                inputType: 'garage_intent',
            };
        }

        return {
            isSimpleNumber: false,
            isChoiceField: false,
            shouldSkipGarageDetection: false,
            inputType: 'unknown',
        };
    }

    private async handleBatchDimensions(session: any, sessionId: string, input: string, context: string): Promise<string | null>
    {
        const batchDimensions = await this.detectBatchDimensions(input);

        if (!batchDimensions || !batchDimensions.width || !batchDimensions.length || !batchDimensions.height) {
            return null;
        }

        logger.info(`[LeadAgent] ✅ BATCH DIMENSIONS (${context}): ${batchDimensions.width}x${batchDimensions.length}x${batchDimensions.height}`);

        session.state.userFriendlyParams.width = batchDimensions.width;
        session.state.userFriendlyParams.length = batchDimensions.length;
        session.state.userFriendlyParams.height = batchDimensions.height;
        session.state.hasGarageIntent = true;

        const response = `✓ Got it! Building dimensions: ${batchDimensions.width}ft wide × ${batchDimensions.length}ft long × ${batchDimensions.height}ft tall`;
        await session.memory.chatHistory.addAIChatMessage(response);

        const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);

        if (missingFields.length === 0) {
            session.state.currentField = null;
            return response + "\n\nMoving to price calculation...";
        }

        const nextField = missingFields[0];
        session.state.currentField = nextField as keyof UserFriendlyParams;
        const fieldResult = await this.createFieldResult(session, sessionId, nextField as keyof UserFriendlyParams);
        const fullResponse = `${response}\n\n${fieldResult.response}`;
        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);

        return fullResponse;
    }

    private async handleParameterUpdateAfterPrice(session: any, sessionId: string, update: any, userInput: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🔄 Handling parameter update after price: ${update.field} = ${update.value}`);

        try
        {
            const fieldKey = update.field as keyof UserFriendlyParams;

            let parsedValue: any = update.value;

            if (["width", "length", "height", "utility_length", "gauge"].includes(update.field))
            {
                parsedValue = parseInt(update.value, 10);
                if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue > 500)
                {
                    return `Invalid value for ${update.field}. Please provide a number between 1 and 500.`;
                }
            }
            else if (update.field === "roof_type")
            {
                const roofChoices = ["Vertical", "Regular", "Box", "A-Frame"];
                const roofMatch = await fuzzyChoiceMatcher.matchChoice(update.value, roofChoices);

                if (roofMatch.matched && roofMatch.choice) {
                    parsedValue = roofMatch.choice;
                    logger.info(`[LeadAgent] 🔄 Fuzzy matched roof_type: "${update.value}" → "${parsedValue}"`);
                } else {
                    logger.warn(`[LeadAgent] Could not match roof_type: "${update.value}"`);
                    return `Could not match roof type "${update.value}". Please use: Vertical, Regular, Box, or A-Frame`;
                }
            }
            else if (update.field === "building_type")
            {
                const buildingChoices = ["Garage", "Shed", "Barn", "Workshop"];
                const buildingMatch = await fuzzyChoiceMatcher.matchChoice(update.value, buildingChoices);

                if (buildingMatch.matched && buildingMatch.choice) {
                    parsedValue = buildingMatch.choice;
                    logger.info(`[LeadAgent] 🔄 Fuzzy matched building_type: "${update.value}" → "${parsedValue}"`);
                } else {
                    logger.warn(`[LeadAgent] Could not match building_type: "${update.value}"`);
                    return `Could not match building type "${update.value}". Please use: Garage, Shed, Barn, or Workshop`;
                }
            }
            else if (update.field === "state_name")
            {
                parsedValue = update.value.trim();
                parsedValue = parsedValue.split(' ')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
                logger.info(`[LeadAgent] 🔄 Parsed state_name: "${update.value}" → "${parsedValue}"`);
            }

            session.state.userFriendlyParams[fieldKey] = parsedValue;
            logger.info(`[LeadAgent] ✅ Updated ${update.field} to ${parsedValue}`);

            const originalDimensions = {
                width: session.state.userFriendlyParams.width,
                length: session.state.userFriendlyParams.length,
                height: session.state.userFriendlyParams.height,
            };

            logger.info(`[LeadAgent] 🔄 Recalculating price with updated parameters...`);

            const priceResult = await calculatePriceNode({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                hasGarageIntent: true,
                priceCalculated: false,
                currentField: null,
                validationError: null,
                response: "",
                nextStep: null,
                stateMapCache: session.stateMapCache || new Map(),
                roofMapCache: session.roofMapCache || new Map(),
                pendingUpdates: [],
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
                color: session.state.color,
                colorCost: session.state.colorCost || 0,
                generatedImageUrl: "",
                _pendingConfirmation: null,
            });

            this.restoreDimensionsIfCorrupted(session, originalDimensions);

            this.updateSessionWithPrice(session, priceResult, session.state.color);

            logger.info(`[LeadAgent] 🎨 Generating updated visualization...`);

            const finalTotal = this.calculateAndLogFinalPrice(
                session,
                session.state.selectedAddons || []
            );

            const visualizationState = await this.createVisualizationState(
                session,
                sessionId,
                session.state.selectedAddons || [],
                finalTotal
            );

            logger.info(`[LeadAgent] 🎨 VISUALIZATION with updated ${update.field}: Final=$${finalTotal}`);

            const visualizationResult = await generateGarageVisualizationNode(visualizationState);

            const updateMessage = `✅ Updated ${update.field} to ${parsedValue}`;
            const priceMessage = priceResult.response;
            const visualizationMessage = visualizationResult.response;

            const fullResponse = `${updateMessage}\n\n${priceMessage}\n\n${visualizationMessage}`;

            await session.memory.chatHistory.addAIChatMessage(fullResponse);

            session.state.finalPrice = finalTotal;
            session.state.generatedImageUrl = visualizationResult.generatedImageUrl || "";

            logger.info(`[LeadAgent] ✅ Parameter update complete with visualization`);

            return fullResponse;

        }
        catch (error)
        {
            logger.error(`[LeadAgent] Error updating parameter after price:`, error);
            return `Error updating ${update.field}. Please try again.`;
        }
    }

    private calculateFinalPrice(basePrice: number, colorCost: number, selectedAddons: any[], sqft: number): number
    {
        const laborCost: number = basePrice * 0.5;
        const foundationCost: number = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const contingency: number = (basePrice + colorCost + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;

        return (basePrice + colorCost + laborCost + foundationCost + deliveryCost + contingency + addonTotal);
    }

    private detectAddonRequest(input: string): boolean
    {
        const addonPatterns: RegExp[] = [
            /\b(add|also|and|get|want|need)\s+(\d+\s+)?[\w_]+/i,
            /\b(\d+)\s+[\w_]+/i,
            /\b(window|door|garage|walk.?in|brace|anchor|cupola|truss|sectional)/i,
        ];

        const isAddon: boolean = addonPatterns.some((pattern: RegExp) => pattern.test(input));
        const isCarRelated: boolean = /\b\d+\s*(?:car|cars)\s*(?:garage)?\b/i.test(input);

        return isAddon && !isCarRelated;
    }

    private async getAddonsMenuFromDatabase(): Promise<any[]>
    {
        const allAddons: AddonFromDB[] = await this.addonManagerInstance.getAddonsWithCache();
        const limited: AddonFromDB[] = this.addonManagerInstance.getLimitedAddonsByType(allAddons, 10);
        return limited.map((addon) => ({
            id: addon.id,
            label: addon.label,
            type: addon.type,
            cost: addon.cost,
            description: addon.description || "",
        }));
    }

    private restoreDimensionsIfCorrupted(session: any, originalDimensions: { width?: number; length?: number; height?: number }): void
    {
        const currentDimensions = {
            width: session.state.userFriendlyParams.width,
            length: session.state.userFriendlyParams.length,
            height: session.state.userFriendlyParams.height,
        };

        const dimensionChanged =
            currentDimensions.width !== originalDimensions.width ||
            currentDimensions.length !== originalDimensions.length ||
            currentDimensions.height !== originalDimensions.height;

        if (dimensionChanged && originalDimensions.width && originalDimensions.length && originalDimensions.height)
        {
            logger.error(
                `[DIMENSION_CORRUPTION_DETECTED] Dimensions were corrupted during processing!`,
                {
                    before: originalDimensions,
                    after: currentDimensions,
                }
            );

            session.state.userFriendlyParams.width = originalDimensions.width;
            session.state.userFriendlyParams.length = originalDimensions.length;
            session.state.userFriendlyParams.height = originalDimensions.height;

            logger.info(`[DIMENSION_RESTORED] Dimensions restored to:`, originalDimensions);
        }
    }

    private async shouldSkipGarageDetectionForState(userInput: string, currentField: string | null | undefined): Promise<boolean>
    {
        logger.info(`[LeadAgent] Checking if should skip garage detection...`);
        logger.info(`[LeadAgent] Input: "${userInput}", Current field: "${currentField}"`);

        const trimmedInput = userInput.trim();
        const isJustNumber = /^\d+(?:\.\d+)?$/.test(trimmedInput);

        if (currentField) {
            logger.info(`[LeadAgent] ⚠️ Currently asking for field "${currentField}" - ALWAYS skip garage detection during active field collection`);
            return true;
        }

        if (!currentField && isJustNumber) {
            logger.info(`[LeadAgent] ⚠️ Single number in initial flow ("${userInput}") - treating as dimension, not garage`);
            return true;
        }

        if (!currentField) {
            const isExplicitGarage = /\b(garage|car|cars|2-car|3-car|for\s+\d+\s+car)\b/i.test(userInput);
            if (isExplicitGarage && !isJustNumber) {
                logger.info(`[LeadAgent] ✅ Explicit garage mention in initial flow - allowing garage detection`);
                return false;
            }
        }

        logger.info(`[LeadAgent] ✅ Safe to run garage detection`);
        return false;
    }

    private getOrCreateSession(sessionId: string): any
    {
        const existing: any = this.sessionManager.getSession(sessionId);

        if (existing && this.sessionManager.isSessionValid(sessionId)) {
            this.sessionManager.updateLastActivity(sessionId);
            return existing;
        }

        const { BufferMemory, ChatMessageHistory } = require("langchain/memory");

        const newSession: any = {
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
                priceCalculated: false,
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
                color: null,
                colorCost: 0,
            },
            stateMapCache: new Map(),
            roofMapCache: new Map(),
        };

        this.sessionManager.createSession(sessionId, newSession);
        return newSession;
    }

    private async createAddonsState(session: any, sessionId: string): Promise<any>
    {
        return {
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
            hasGarageIntent: true,
            priceCalculated: true,
            currentField: null,
            validationError: null,
            response: "",
            nextStep: null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: session.state.pricingData || null,
            basePrice: session.state.basePrice || 0,
            selectedAddons: [],
            finalPrice: session.state.finalPrice || 0,
            color: session.state.color,
            colorCost: session.state.colorCost,
            generatedImageUrl: ""
        };
    }

    private async createVisualizationState(session: any, sessionId: string, selectedAddons: any[], finalTotal: number): Promise<LeadAgentStateType>
    {
        const params = session.state.userFriendlyParams;
        return {
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: {
                ...params,
                color: session.state.color,
            } as Partial<UserFriendlyParams>,
            hasGarageIntent: true,
            priceCalculated: true,
            currentField: null,
            validationError: null,
            response: "",
            nextStep: null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: session.state.pricingData || null,
            basePrice: session.state.basePrice || 0,
            selectedAddons: selectedAddons,
            finalPrice: finalTotal,
            generatedImageUrl: null,
            color: session.state.color,
            colorCost: session.state.colorCost || 0,
            _pendingConfirmation: {
                field: "",
                matchedValue: ""
            }
        };
    }

    private updateSessionWithPrice(session: any, priceResult: any, colorName?: string): void
    {
        session.state.color = colorName || priceResult.color;
        session.state.priceCalculated = priceResult.priceCalculated || false;
        session.state.pricingData = priceResult.pricingData;
        session.state.basePrice = priceResult.basePrice || 0;
        session.state.finalPrice = priceResult.finalPrice || 0;
        session.state.colorCost = priceResult.colorCost || 0;

        if (priceResult.userFriendlyParams) {
            session.state.userFriendlyParams = {
                ...session.state.userFriendlyParams,
                ...priceResult.userFriendlyParams,
            };
            if (colorName) {
                session.state.userFriendlyParams.color = colorName;
            }
        }
    }

    private async handleColorChangeRequest(session: any, sessionId: string, userInput: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🎨 EXPLICIT COLOR CHANGE REQUEST detected: "${userInput}"`);

        try {
            const allColors: ColorOption[] = await this.colorService.get();

            if (!allColors || allColors.length === 0) {
                logger.error(`[LeadAgent] NO COLORS IN DATABASE!`);
                return `Error: No colors available in database.`;
            }

            logger.info(`[LeadAgent] ✅ Got ${allColors.length} colors from database`);

            const groupedColors: Map<string, ColorOption[]> = this.colorService.group(allColors, 5);
            const displayColors: ColorOption[] = [];
            const categoryOrder = ['🔴 Reds', '🔵 Blues', '🟢 Greens', '⚫ Grays', '⚪ Neutrals'];

            for (const category of categoryOrder) {
                const colors = groupedColors.get(category);
                if (colors && Array.isArray(colors) && colors.length > 0) {
                    displayColors.push(...colors);
                }
            }

            logger.info(`[LeadAgent] Display order for color change:`);
            displayColors.forEach((c, idx) => {
                logger.info(`  [${idx}] → Display #${idx + 1}: "${c.name}"`);
            });

            const availableColors = displayColors.map((c) => ({
                name: c.name,
                cost: c.cost || 0,
            }));

            const colorHandler = ColorChangeHandler.getInstance();
            const result = await colorHandler.handleColorChange(userInput, availableColors);

            if (!result.success) {
                logger.warn(`[LeadAgent] Color change failed: ${result.message}`);

                if (result.alternatives && result.alternatives.length > 0) {
                    const altList = result.alternatives
                        .slice(0, 5)
                        .map((c, i) => `${i + 1}. ${c.name}`)
                        .join("\n");

                    return `${result.message}\n\nAvailable colors:\n${altList}`;
                }

                return `${result.message}`;
            }

            if (!result.color) {
                logger.warn(`[LeadAgent] No color matched`);
                return `Could not determine color preference.`;
            }

            const fullColorOption = displayColors.find(
                c => c.name.toLowerCase() === result.color!.name.toLowerCase()
            );

            if (!fullColorOption) {
                logger.error(`[LeadAgent] Could not find full color object for: ${result.color.name}`);
                return `Error: Color not found in database.`;
            }

            logger.info(`[LeadAgent] ✅ Color selected: ${fullColorOption.name}`);

            const colorChangeMessage = await this.applyColorAndCalculatePrice(
                session,
                sessionId,
                fullColorOption
            );

            if (result.alternatives && result.alternatives.length > 0) {
                const altList = result.alternatives
                    .slice(0, 3)
                    .map((c) => `${c.name}`)
                    .join(", ");

                const altMessage = `\n\n💡 Other similar colors available: ${altList}`;
                return colorChangeMessage + altMessage;
            }

            return colorChangeMessage;

        } catch (error) {
            logger.error(`[LeadAgent] ERROR in color change request:`, error);
            return `Error processing color change. Please try again.`;
        }
    }

    private calculateAndLogFinalPrice(session: any, selectedAddons: any[] = []): number
    {
        const basePrice = session.state.basePrice || 0;
        const colorCost = session.state.colorCost || 0;
        const params = session.state.userFriendlyParams;
        const sqft = (params.width || 0) * (params.length || 0);

        const finalTotal = this.calculateFinalPrice(basePrice, colorCost, selectedAddons, sqft);

        logger.info(`[LeadAgent] 🎨 Final calculation: Base=$${basePrice}, Color=$${colorCost}, Addons=${selectedAddons.length}, Total=$${finalTotal}`);

        return finalTotal;
    }

    private async handleColorSelection(session: any, sessionId: string, input: string): Promise<string>
    {
        try {
            logger.info(`[LeadAgent] Fetching colors from database...`);
            const allColors: ColorOption[] = await this.colorService.get();

            if (!allColors || allColors.length === 0) {
                logger.error(`[LeadAgent] NO COLORS IN DATABASE!`);
                return `Error: No colors available in database. Skipping color selection.`;
            }

            logger.info(`[LeadAgent] ✅ Got ${allColors.length} colors from database`);

            const groupedColors: Map<string, ColorOption[]> = this.colorService.group(allColors, 5);
            const displayColors: ColorOption[] = [];
            const categoryOrder = ['🔴 Reds', '🔵 Blues', '🟢 Greens', '⚫ Grays', '⚪ Neutrals'];

            for (const category of categoryOrder) {
                const colors = groupedColors.get(category);
                if (colors && Array.isArray(colors) && colors.length > 0) {
                    logger.info(`[LeadAgent] Adding ${colors.length} colors from category: ${category}`);
                    displayColors.push(...colors);
                }
            }

            logger.info(`[LeadAgent] Built displayColors array: ${displayColors.length} colors`);

            logger.info(`[LeadAgent] Display order for colors (as shown to user):`);
            displayColors.forEach((c, idx) => {
                logger.info(`  [${idx}] → Display #${idx + 1}: "${c.name}"`);
            });

            if (displayColors.length === 0) {
                logger.error(`[LeadAgent] displayColors is empty after grouping!`);
                return `Error: No colors available for selection.`;
            }

            const firstColor = displayColors[0];
            if (!firstColor || !firstColor.name) {
                logger.error(`[LeadAgent] displayColors contains invalid objects!`);
                return `Error: Color data is corrupted. Please contact support.`;
            }

            logger.info(`[LeadAgent] Attempting to match user input: "${input}"`);

            const displayOrder = displayColors.map(c => c.name);

            logger.info(`[LeadAgent] Calling fuzzyChoiceMatcher.matchColor with:`);
            logger.info(`  - User input: "${input}"`);
            logger.info(`  - displayColors count: ${displayColors.length}`);
            logger.info(`  - displayOrder count: ${displayOrder.length}`);
            logger.info(`  - displayOrder: ${displayOrder.join(', ')}`);

            const colorMatch = await fuzzyChoiceMatcher.matchColor(
                input,
                displayColors,
                displayOrder
            );

            logger.info(`[LeadAgent] Color match result:`, {
                matched: colorMatch.matched,
                color: colorMatch.color?.name,
                confidence: colorMatch.confidence,
                reasoning: colorMatch.reasoning
            });

            if (colorMatch.matched && colorMatch.color) {
                logger.info(`[LeadAgent] 🎨 Color matched: ${colorMatch.color.name}`);

                const fullColorOption = displayColors.find(
                    c => c.name.toLowerCase() === colorMatch.color!.name.toLowerCase()
                );

                if (fullColorOption) {
                    return await this.applyColorAndCalculatePrice(
                        session,
                        sessionId,
                        fullColorOption
                    );
                } else {
                    logger.error(`[LeadAgent] Could not find full color object for: ${colorMatch.color.name}`);
                    return `Error: Color not found in database.`;
                }
            } else {
                const suggestions = displayColors.slice(0, 3).map(c => c.name).join(", ");
                return `I didn't find that color. Try: ${suggestions} or "any" for White`;
            }
        } catch (error) {
            logger.error(`[LeadAgent] ERROR in color phase:`, error);
            return `Error processing color. Please try again or say "any" for default (White)`;
        }
    }

    private async applyColorAndCalculatePrice(session: any, sessionId: string, selectedColor: ColorOption): Promise<string>
    {
        logger.info(`[LeadAgent] ✅ Color matched: "${selectedColor.name}" (cost: $${selectedColor.cost})`);

        session.state.color = selectedColor.name;
        session.state.userFriendlyParams.color = selectedColor.name;

        const originalDimensions = {
            width: session.state.userFriendlyParams.width,
            length: session.state.userFriendlyParams.length,
            height: session.state.userFriendlyParams.height,
        };

        const priceResult = await calculatePriceNode({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
            hasGarageIntent: true,
            priceCalculated: false,
            currentField: null,
            validationError: null,
            response: "",
            nextStep: null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: selectedColor.name,
            colorCost: 0,
            generatedImageUrl: "",
            _pendingConfirmation: {
                field: "",
                matchedValue: ""
            }
        });

        this.restoreDimensionsIfCorrupted(session, originalDimensions);
        this.updateSessionWithPrice(session, priceResult, selectedColor.name);

        logger.info(`[LeadAgent] 🎨 Price calculated, showing addon menu`);

        try {
            const addonsState = await this.createAddonsState(session, sessionId);
            const addonsResponse = await showAddonsNode(addonsState);
            const response = `${priceResult.response}\n\n${addonsResponse.response}`;

            await session.memory.chatHistory.addAIChatMessage(response);
            logger.info(`[LeadAgent] ✅ Color processed and addon menu shown successfully`);

            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error showing addon menu:`, error);
            await session.memory.chatHistory.addAIChatMessage(priceResult.response);
            return priceResult.response;
        }
    }

    private async askForNextField(session: any, sessionId: string, nextField: string, previousMessage: string): Promise<string>
    {
        session.state.currentField = nextField;
        logger.info(`[LeadAgent] Next field to collect: ${nextField}`);

        const fieldResult = await askForFieldNode({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams,
            hasGarageIntent: true,
            priceCalculated: false,
            currentField: nextField as keyof UserFriendlyParams,
            validationError: null,
            response: "",
            nextStep: null,
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
            generatedImageUrl: "",
            _pendingConfirmation: {
                field: "",
                matchedValue: ""
            }
        });

        return `${previousMessage}\n\n${fieldResult.response}`;
    }

    private async detectBatchDimensions(userInput: string): Promise<{ width: number; length: number; height: number } | null>
    {
        if (!userInput) {
            logger.info(`[LeadAgent] detectBatchDimensions: empty input`);
            return null;
        }

        try {
            logger.info(`[LeadAgent] detectBatchDimensions: "${userInput}"`);

            const xPattern = /(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/;
            const xMatch = userInput.match(xPattern);

            if (xMatch) {
                const width = parseInt(xMatch[1], 10);
                const length = parseInt(xMatch[2], 10);
                const height = parseInt(xMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ X format match: W=${width} × L=${length} × H=${height}`);
                    return { width, length, height };
                }
            }

            const abbreviatedPattern = /w\s*:?\s*(\d+)\s*l\s*:?\s*(\d+)\s*h\s*:?\s*(\d+)/i;
            const abbreviatedMatch = userInput.match(abbreviatedPattern);

            if (abbreviatedMatch) {
                logger.info(`[LeadAgent] ✅ Abbreviated pattern MATCHED!`);
                const width = parseInt(abbreviatedMatch[1], 10);
                const length = parseInt(abbreviatedMatch[2], 10);
                const height = parseInt(abbreviatedMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ Validation passed: ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            const commaPattern = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;
            const commaMatch = userInput.match(commaPattern);

            if (commaMatch) {
                const width = parseInt(commaMatch[1], 10);
                const length = parseInt(commaMatch[2], 10);
                const height = parseInt(commaMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ Comma format match: ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            const labeledPattern = /width\s*:?\s*(\d+).*?length\s*:?\s*(\d+).*?height\s*:?\s*(\d+)/i;
            const labeledMatch = userInput.match(labeledPattern);

            if (labeledMatch) {
                const width = parseInt(labeledMatch[1], 10);
                const length = parseInt(labeledMatch[2], 10);
                const height = parseInt(labeledMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ Labeled format match: ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            logger.info(`[LeadAgent] Trying DimensionManager...`);
            const dimensionManager = DimensionManager.getInstance();
            const calculation = dimensionManager.calculateDimensions(userInput);

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(`[LeadAgent] ✅ DimensionManager match: ${calculation.width}×${calculation.length}×${calculation.height}`);
                return {
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height,
                };
            }

            logger.info(`[LeadAgent] No pattern matched`);
            return null;

        } catch (error) {
            logger.error(`[LeadAgent] detectBatchDimensions error:`, error);
            return null;
        }
    }

    private async detectBatchDimensionsRegexOnly(userInput: string): Promise<{ width: number; length: number; height: number } | null>
    {
        if (!userInput) {
            logger.info(`[LeadAgent] detectBatchDimensionsRegexOnly: empty input`);
            return null;
        }

        try {
            logger.info(`[LeadAgent] 🚀 FAST regex detection: "${userInput}"`);

            const xPattern = /(\d+)\s*[xX×]\s*(\d+)\s*[xX×]\s*(\d+)/;
            const xMatch = userInput.match(xPattern);

            if (xMatch) {
                const width = parseInt(xMatch[1], 10);
                const length = parseInt(xMatch[2], 10);
                const height = parseInt(xMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ FAST MATCH (XxYxZ): W=${width} × L=${length} × H=${height}`);
                    return { width, length, height };
                }
            }

            const abbreviatedPattern = /w\s*:?\s*(\d+)\s*l\s*:?\s*(\d+)\s*h\s*:?\s*(\d+)/i;
            const abbreviatedMatch = userInput.match(abbreviatedPattern);

            if (abbreviatedMatch) {
                const width = parseInt(abbreviatedMatch[1], 10);
                const length = parseInt(abbreviatedMatch[2], 10);
                const height = parseInt(abbreviatedMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ FAST MATCH (w/l/h): ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            const commaPattern = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;
            const commaMatch = userInput.match(commaPattern);

            if (commaMatch) {
                const width = parseInt(commaMatch[1], 10);
                const length = parseInt(commaMatch[2], 10);
                const height = parseInt(commaMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ FAST MATCH (comma): ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            const labeledPattern = /width\s*:?\s*(\d+).*?length\s*:?\s*(\d+).*?height\s*:?\s*(\d+)/i;
            const labeledMatch = userInput.match(labeledPattern);

            if (labeledMatch) {
                const width = parseInt(labeledMatch[1], 10);
                const length = parseInt(labeledMatch[2], 10);
                const height = parseInt(labeledMatch[3], 10);

                if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                    logger.info(`[LeadAgent] ✅ FAST MATCH (labeled): ${width}×${length}×${height}`);
                    return { width, length, height };
                }
            }

            logger.info(`[LeadAgent] No regex pattern matched`);
            return null;

        } catch (error) {
            logger.error(`[LeadAgent] detectBatchDimensionsRegexOnly error:`, error);
            return null;
        }
    }

    /**
     * ✅ FIX: Detect explicit dimension updates after image generation
     * Catches patterns like: "width 30", "change height to 12", "make it 20 feet wide"
     */
    private detectExplicitDimensionUpdate(userInput: string): { field: string; value: any } | null {
        if (!userInput) return null;

        const input = userInput.toLowerCase().trim();

        const simplePattern = /\b(width|length|height)\s+(\d+)/i;
        const simpleMatch = input.match(simplePattern);

        if (simpleMatch) {
            const field = simpleMatch[1].toLowerCase();
            const value = parseInt(simpleMatch[2], 10);

            if (value > 0 && value <= 500) {
                logger.info(`[LeadAgent] ✅ Simple dimension pattern: ${field} = ${value}`);
                return { field, value };
            }
        }

        const changePattern = /\b(change|update|set|make)\s+(width|length|height)\s+(?:to\s+)?(\d+)/i;
        const changeMatch = input.match(changePattern);

        if (changeMatch) {
            const field = changeMatch[2].toLowerCase();
            const value = parseInt(changeMatch[3], 10);

            if (value > 0 && value <= 500) {
                logger.info(`[LeadAgent] ✅ Change dimension pattern: ${field} = ${value}`);
                return { field, value };
            }
        }

        const makePattern = /\b(?:make|change|set)\s+(?:it\s+)?(\d+)\s+(?:feet?|ft)?\s*(wide|long|tall|high)/i;
        const makeMatch = input.match(makePattern);

        if (makeMatch) {
            const value = parseInt(makeMatch[1], 10);
            const dimension = makeMatch[2].toLowerCase();

            let field: string;
            if (dimension === 'wide') field = 'width';
            else if (dimension === 'long') field = 'length';
            else if (dimension === 'tall' || dimension === 'high') field = 'height';
            else return null;

            if (value > 0 && value <= 500) {
                logger.info(`[LeadAgent] ✅ Make dimension pattern: ${field} = ${value}`);
                return { field, value };
            }
        }

        const feetPattern = /\b(\d+)\s+(?:feet?|ft)\s+(wide|long|tall|high)/i;
        const feetMatch = input.match(feetPattern);

        if (feetMatch) {
            const value = parseInt(feetMatch[1], 10);
            const dimension = feetMatch[2].toLowerCase();

            let field: string;
            if (dimension === 'wide') field = 'width';
            else if (dimension === 'long') field = 'length';
            else if (dimension === 'tall' || dimension === 'high') field = 'height';
            else return null;

            if (value > 0 && value <= 500) {
                logger.info(`[LeadAgent] ✅ Feet dimension pattern: ${field} = ${value}`);
                return { field, value };
            }
        }

        return null;
    }

    private async handleParameterUpdate(session: any, sessionId: string, update: any, input: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🔄 Parameter update detected: ${update.field} = ${update.value} (while asking for ${session.state.currentField})`);

        try {
            const choiceFields = ['roof_type', 'gauge', 'building_type'];

            if (choiceFields.includes(update.field)) {
                logger.info(`[LeadAgent] 🎯 Detected choice field update: ${update.field}`);
                logger.info(`[LeadAgent] Using fuzzy matcher instead of update service`);

                let choiceResult: any = null;
                let matchedValue: string | null = null;

                switch (update.field) {
                    case 'roof_type':
                        logger.info(`[LeadAgent] 🏠 Using fuzzyChoiceMatcher.matchRoofType("${update.value}")`);
                        choiceResult = await fuzzyChoiceMatcher.matchRoofType(update.value);

                        if (choiceResult.matched) {
                            matchedValue = choiceResult.roofType;
                            session.state.userFriendlyParams.roof_type = choiceResult.roofType;
                        }
                        break;

                    case 'gauge':
                        logger.info(`[LeadAgent] 📏 Using fuzzyChoiceMatcher.matchGauge("${update.value}")`);
                        choiceResult = await fuzzyChoiceMatcher.matchGauge(update.value);

                        if (choiceResult.matched) {
                            matchedValue = choiceResult.gauge;
                            session.state.userFriendlyParams.gauge = choiceResult.gauge;
                        }
                        break;

                    case 'building_type':
                        logger.info(`[LeadAgent] 🏢 Using fuzzyChoiceMatcher.matchBuildingType("${update.value}")`);
                        choiceResult = await fuzzyChoiceMatcher.matchBuildingType(update.value);

                        if (choiceResult.matched) {
                            matchedValue = choiceResult.buildingType;
                            session.state.userFriendlyParams.building_type = choiceResult.buildingType;
                        }
                        break;
                }

                if (choiceResult && choiceResult.matched) {
                    logger.info(`[LeadAgent] ✅ Choice field match: ${update.field} = ${matchedValue}`);

                    const response = `✅ Updated ${update.field} to ${matchedValue}`;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                    logger.info(`[LeadAgent] Missing fields after update: ${missingFields.length}`, missingFields);

                    if (missingFields.length > 0) {
                        const nextField = missingFields[0];
                        session.state.currentField = nextField as keyof UserFriendlyParams;
                        logger.info(`[LeadAgent] Moving to next field: ${nextField}`);

                        const fieldResult = await askForFieldNode({
                            sessionId,
                            messages: await session.memory.chatHistory.getMessages(),
                            userFriendlyParams: session.state.userFriendlyParams,
                            hasGarageIntent: true,
                            priceCalculated: false,
                            currentField: nextField as keyof UserFriendlyParams,
                            validationError: null,
                            response: "",
                            nextStep: null,
                            stateMapCache: session.stateMapCache || new Map(),
                            roofMapCache: session.roofMapCache || new Map(),
                            pendingUpdates: [],
                            pricingData: null,
                            basePrice: 0,
                            selectedAddons: [],
                            finalPrice: 0,
                            color: null,
                            colorCost: 0,
                            generatedImageUrl: "",
                            _pendingConfirmation: null
                        });

                        const fullResponse = `${response}\n\n${fieldResult.response}`;
                        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                        return fullResponse;
                    } else {
                        logger.info(`[LeadAgent] ✅ All fields complete!`);
                        return response + "\n\nAll set! Let me calculate your quote...";
                    }
                } else if (choiceResult && choiceResult.confidence === 'medium') {
                    logger.info(`[LeadAgent] ⚠️ Medium confidence for ${update.field}`);
                    const confirmMsg = `Did you mean ${matchedValue}? Say "yes" or try again.`;
                    await session.memory.chatHistory.addAIChatMessage(confirmMsg);
                    return confirmMsg;
                } else {
                    logger.warn(`[LeadAgent] Could not match ${update.field} with fuzzy matcher`);
                    let suggestions = "";
                    switch (update.field) {
                        case 'roof_type':
                            suggestions = "Try: Vertical, Regular, or Box";
                            break;
                        case 'gauge':
                            suggestions = "Try: 14 Gauge or 16 Gauge";
                            break;
                        case 'building_type':
                            suggestions = "Try: Garage, Shed, Barn, or Workshop";
                            break;
                    }
                    const retryMsg = `I didn't understand that. ${suggestions}`;
                    await session.memory.chatHistory.addAIChatMessage(retryMsg);
                    return retryMsg;
                }
            }

            const updateService = ParameterUpdateServiceImpl.getInstance();

            const processResult = await updateService.process(
                update,
                input,
                session.state.userFriendlyParams,
                session.stateMapCache || new Map()
            );

            if ("error" in processResult) {
                logger.error(`[LeadAgent] Update processing failed`, processResult.error);
                const errorResponse = processResult.error.response || `Could not update ${update.field}. Please try again.`;
                await session.memory.chatHistory.addAIChatMessage(errorResponse);
                return errorResponse;
            }

            const { result } = processResult;

            if (!result.success) {
                logger.warn(`[LeadAgent] Update validation failed: ${result.message}`);
                await session.memory.chatHistory.addAIChatMessage(result.message);
                return result.message;
            }

            if (result.updatedParams) {
                session.state.userFriendlyParams = {
                    ...session.state.userFriendlyParams,
                    ...result.updatedParams
                };
                logger.info(`[LeadAgent] ✅ Successfully updated ${update.field}`, session.state.userFriendlyParams);
            }

            const pendingDimensions: Array<{ field: keyof UserFriendlyParams; value: any }> | undefined = (global as any).__pendingMultiDimensions;

            if (pendingDimensions && pendingDimensions.length > 0) {
                logger.info(`[LeadAgent] 🔄 Processing ${pendingDimensions.length} pending dimension updates...`);

                for (const pendingUpdate of pendingDimensions) {
                    logger.info(`[LeadAgent] Processing pending: ${pendingUpdate.field} = ${pendingUpdate.value}`);

                    const pendingResult = await updateService.process(
                        pendingUpdate,
                        input,
                        session.state.userFriendlyParams,
                        session.stateMapCache || new Map()
                    );

                    if (!("error" in pendingResult) && pendingResult.result.success && pendingResult.result.updatedParams) {
                        session.state.userFriendlyParams = {
                            ...session.state.userFriendlyParams,
                            ...pendingResult.result.updatedParams
                        };
                        logger.info(`[LeadAgent] ✅ Applied pending update: ${pendingUpdate.field} = ${pendingUpdate.value}`);
                    }
                }

                (global as any).__pendingMultiDimensions = [];
            }

            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
            logger.info(`[LeadAgent] After update - Missing fields: ${missingFields.length}`, missingFields);

            let finalResponse: string;
            const updateMessage = result.message;

            if (missingFields.length === 0) {
                logger.info(`[LeadAgent] ✅ All fields complete after multi-updates, calculating price`);
                finalResponse = await this.calculatePriceAfterUpdate(session, sessionId);
            } else {
                finalResponse = await this.askForNextField(session, sessionId, missingFields[0], updateMessage);
            }

            await session.memory.chatHistory.addAIChatMessage(finalResponse);
            return finalResponse;

        } catch (error) {
            logger.error(`[LeadAgent] Exception handling update:`, error);
            const errorMsg = `Error updating ${update.field}. Please try again.`;
            await session.memory.chatHistory.addAIChatMessage(errorMsg);
            return errorMsg;
        }
    }

    /**
     * Calculates price after all parameters are collected
     */
    private async calculatePriceAfterUpdate(session: any, sessionId: string): Promise<string>
    {
        logger.info(`[LeadAgent] All fields complete, calculating price`);

        session.state.currentField = null;

        const graphResult = await leadAgentGraph.invoke({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams,
            hasGarageIntent: true,
            priceCalculated: false,
            currentField: null,
            validationError: null,
            response: "",
            nextStep: "calculate_price",
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: null,
            basePrice: 0,
            selectedAddons: [],
            finalPrice: 0,
            color: null,
            colorCost: 0,
        });

        session.state.priceCalculated = graphResult.priceCalculated || false;
        session.state.pricingData = graphResult.pricingData;
        session.state.basePrice = graphResult.basePrice || 0;
        session.state.finalPrice = graphResult.finalPrice || 0;
        session.state.color = graphResult.color;
        session.state.colorCost = graphResult.colorCost;

        return graphResult.response;
    }

    private async handleAddonRequestAfterPrice(session: any, sessionId: string, userInput: string): Promise<string>
    {
        logger.info(`[LeadAgent] ✅ Detected addon request: "${userInput}"`);

        try {
            if (this.shouldSkipAddons(userInput)) {
                logger.info(`[LeadAgent] 🎨 User skipped addons - DIRECT VISUALIZATION`);

                const finalTotal = this.calculateAndLogFinalPrice(session, []);
                const visualizationState = await this.createVisualizationState(session, sessionId, [], finalTotal);

                const result = await generateGarageVisualizationNode(visualizationState);
                const response = result.response;

                await session.memory.chatHistory.addAIChatMessage(response);
                session.state.selectedAddons = [];
                session.state.finalPrice = finalTotal;

                return response;
            }

            const addonsMenu = await this.getAddonsMenuFromDatabase();

            if (!addonsMenu || addonsMenu.length === 0) {
                logger.error(`[LeadAgent] No addons menu available`);
                return `Error: Addon options not available`;
            }

            const addonService = AddonServiceImpl.getInstance();
            const selectedAddons = await addonService.parse(userInput, addonsMenu);

            if (selectedAddons.length === 0) {
                return `I couldn't find any addons matching "${userInput}".\n\nPlease try:\n• "1" to select by number\n• "2 windows" for 2 windows\n• "add 3 doors" for 3 garage doors\n• "no" or "skip" to proceed without addons`;
            }

            const finalTotal = this.calculateAndLogFinalPrice(session, selectedAddons);
            const visualizationState = await this.createVisualizationState(session, sessionId, selectedAddons, finalTotal);

            logger.info(`[LeadAgent] 🎨 VISUALIZATION with addons: ${selectedAddons.length} addons selected, Final=$${finalTotal}`);

            const result = await generateGarageVisualizationNode(visualizationState);
            const response = result.response;

            await session.memory.chatHistory.addAIChatMessage(response);
            session.state.selectedAddons = selectedAddons;
            session.state.finalPrice = finalTotal;

            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error processing addons:`, error);
            return `Error processing addons. Please try again.`;
        }
    }

    private async handleUserDeclinesAddons(session: any, sessionId: string): Promise<string>
    {
        logger.info(`[LeadAgent] ✅ User declined addons - DIRECT VISUALIZATION`);

        const finalTotal = this.calculateAndLogFinalPrice(session, []);
        const visualizationState = await this.createVisualizationState(session, sessionId, [], finalTotal);

        logger.info(`[LeadAgent] 🎨 VISUALIZATION: Color=${session.state.color}, Final=$${finalTotal}`);

        const result = await generateGarageVisualizationNode(visualizationState);
        const response = result.response;

        await session.memory.chatHistory.addAIChatMessage(response);

        session.state.finalPrice = finalTotal;
        session.state.generatedImageUrl = result.generatedImageUrl || "";
        session.state.priceCalculated = true;

        logger.info(`[LeadAgent] ✅ Image generated, priceCalculated=${session.state.priceCalculated}, ready for parameter updates`);

        return response;
    }

    private async handleEmptyInputAfterPrice(session: any, sessionId: string): Promise<string>
    {
        logger.info(`[LeadAgent] ✅ Showing addon options after price calculation`);

        try {
            const addonsState = await this.createAddonsState(session, sessionId);
            const addonsResponse = await showAddonsNode(addonsState);

            const response = addonsResponse.response;
            await session.memory.chatHistory.addAIChatMessage(response);

            if (addonsResponse.addonsMenu) {
                (session as any).addonsMenuData = addonsResponse.addonsMenu;
            }

            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error showing addons:`, error);
            return `Error loading addon options. Please try again.`;
        }
    }

    /**
     * ✅ NEW: Helper to detect skip intent
     */
    private async shouldSkipAddons(userInput: string): Promise<boolean>
    {
        const result = await fuzzyMatcher.isSkipIntent(userInput);
        logger.info(`[LeadAgent] Skip intent: ${result.isSkip} (confidence: ${result.confidence})`);
        return result.isSkip && result.confidence !== 'low';
    }
}

function Enforce(): void {}
