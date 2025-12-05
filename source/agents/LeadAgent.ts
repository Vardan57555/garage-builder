    import pino from "pino";
    import { createLogger } from "@utils/logger/Log";
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
    const logger: pino.Logger = createLogger(module);

    export class LeadAgent {
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

        public async endSession(sessionId: string): Promise<void> {
            if (this.sessionManager.endSession(sessionId)) {
                logger.info(`[LeadAgent] Session ended: ${sessionId}`);
            }
        }

        public async reset(): Promise<void> {
            this.sessionManager.destroy();
            logger.info("[LeadAgent] Full reset complete");
        }

        public async run(sessionId: string, input: string): Promise<string>
        {
            logger.info(`[LeadAgent] Session ${sessionId} - Input: ${input}`);

            try
            {
                const session = this.getOrCreateSession(sessionId);
                await session.memory.chatHistory.addUserMessage(input);

                const originalDimensions = {
                    width: session.state.userFriendlyParams.width,
                    length: session.state.userFriendlyParams.length,
                    height: session.state.userFriendlyParams.height,
                };
                logger.info(`[LeadAgent] Original dimensions stored:`, originalDimensions);

                const hasDimensions = !!(
                    originalDimensions.width &&
                    originalDimensions.length &&
                    originalDimensions.height
                );

                const isInFieldMode = !!session.state.currentField;
                const isInChoiceFieldMode = session.state.currentField &&
                    ["roof_type", "gauge", "building_type"].includes(session.state.currentField);
                const isInDimensionFieldMode = session.state.currentField &&
                    ['width', 'length', 'height', 'utility_length'].includes(session.state.currentField);

                if (isInDimensionFieldMode) {
                    logger.info(`[LeadAgent] 🎯 In DIMENSION field mode (${session.state.currentField})`);
                    logger.info(`[LeadAgent] SKIPPING all early parameter detection - letting ParameterExtractor handle it`);

                    const result = await leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                        hasGarageIntent: session.state.hasGarageIntent,
                        priceCalculated: session.state.priceCalculated || false,
                        currentField: session.state.currentField as keyof UserFriendlyParams,
                        validationError: null,
                        response: "",
                        nextStep: "extract_parameters",
                        stateMapCache: session.stateMapCache || new Map(),
                        roofMapCache: session.roofMapCache || new Map(),
                        pendingUpdates: [],
                        pricingData: null,
                        basePrice: 0,
                        selectedAddons: [],
                        finalPrice: 0,
                        color: null,
                        colorCost: 0,
                        _pendingConfirmation: session.state._pendingConfirmation || null,
                    });

                    // ✅ Update session state
                    session.state.userFriendlyParams = result.userFriendlyParams;
                    session.state.currentField = result.currentField;
                    session.state.color = result.color;
                    session.stateMapCache = result.stateMapCache;
                    session.roofMapCache = result.roofMapCache;

                    if (result.priceCalculated && result.pricingData) {
                        session.state.pricingData = result.pricingData;
                        session.state.basePrice = result.basePrice || 0;
                        session.state.finalPrice = result.finalPrice || 0;
                    }

                    if (result.response) {
                        await session.memory.chatHistory.addAIChatMessage(result.response);
                        return result.response;
                    }

                    // If no response, check for next field
                    const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                    if (missingFields.length > 0) {
                        const nextField = missingFields[0];
                        session.state.currentField = nextField as keyof UserFriendlyParams;

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

                        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                        return fieldResult.response;
                    }

                    return "All fields complete. Calculating price...";
                }

                if (isInChoiceFieldMode) {
                    try {
                        logger.info(`[LeadAgent] 🎯 In CHOICE field mode (${session.state.currentField})`);

                        // ✅ CHECK FIRST: If price calculated and user wants to change color, handle it immediately
                        if (session.state.priceCalculated && session.state.currentField !== "color") {
                            logger.info(`[LeadAgent] 🎨 Price already calculated, checking for color change request...`);

                            try {
                                const colorHandler = ColorChangeHandler.getInstance();
                                const colorIntent = await colorHandler.extractColorIntent(input);

                                if (colorIntent.isColorChangeRequest) {
                                    logger.info(
                                        `[LeadAgent] 🎨 AI detected color change during choice field mode: "${colorIntent.colorName}"`
                                    );
                                    return await this.handleColorChangeRequest(session, sessionId, input);
                                }
                            } catch (error) {
                                logger.error(`[LeadAgent] Error checking color intent during field mode:`, error);
                            }
                        }

                        // ✅ CRITICAL FIX: Check if input is a simple option number (1, 2, 3, etc.)
                        // These should NOT be treated as parameter updates - they're choice selections!
                        const trimmedInput = input.trim();
                        const isSimpleNumber = /^\d+$/.test(trimmedInput);
                        const isLikelyChoiceSelection = isSimpleNumber && parseInt(trimmedInput) >= 1 && parseInt(trimmedInput) <= 10;

                        if (isLikelyChoiceSelection) {
                            logger.info(`[LeadAgent] ⚠️ Input "${trimmedInput}" looks like a choice selection, skipping parameter update detection`);
                            // Skip parameter update detection and let the choice handler process it
                        } else {
                            // ✅ Only check for parameter updates if NOT a simple choice number
                            logger.info(`[LeadAgent] 🔄 Checking for parameter updates during choice field mode...`);

                            try {
                                const paramDetector = ParameterUpdateDetector.getInstance();
                                const paramUpdate = await paramDetector.detectParameterUpdate(input);

                                if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                                    logger.info(
                                        `[LeadAgent] 🔄 Parameter update detected during choice field: ${paramUpdate.field} = ${paramUpdate.value}`
                                    );

                                    // ✅ Handle the parameter update
                                    return await this.handleParameterUpdate(session, sessionId, paramUpdate, input);
                                }
                            } catch (error) {
                                logger.error(`[LeadAgent] Error detecting parameter update during choice field:`, error);
                            }
                        }

                        // ✅ Continue with normal choice field processing
                        logger.info(`[LeadAgent] Processing choice field normally`);

                        const result = await leadAgentGraph.invoke({
                            sessionId,
                            messages: await session.memory.chatHistory.getMessages(),
                            userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                            hasGarageIntent: session.state.hasGarageIntent,
                            priceCalculated: session.state.priceCalculated || false,
                            currentField: session.state.currentField as keyof UserFriendlyParams,
                            validationError: null,
                            response: "",
                            nextStep: "extract_parameters",
                            stateMapCache: session.stateMapCache || new Map(),
                            roofMapCache: session.roofMapCache || new Map(),
                            pendingUpdates: [],
                            pricingData: null,
                            basePrice: 0,
                            selectedAddons: [],
                            finalPrice: 0,
                            color: null,
                            colorCost: 0,
                            _pendingConfirmation: session.state._pendingConfirmation || null,
                        });

                        // ✅ Update session state
                        session.state.userFriendlyParams = result.userFriendlyParams;
                        session.state.hasGarageIntent = result.hasGarageIntent;
                        session.state.priceCalculated = result.priceCalculated || false;
                        session.state.currentField = result.currentField;
                        session.state.color = result.color;
                        session.state.colorCost = result.colorCost;
                        session.state._pendingConfirmation = result._pendingConfirmation || null;
                        session.stateMapCache = result.stateMapCache;
                        session.roofMapCache = result.roofMapCache;

                        if (result.priceCalculated && result.pricingData) {
                            session.state.pricingData = result.pricingData;
                            session.state.basePrice = result.basePrice || 0;
                            session.state.selectedAddons = result.selectedAddons || [];
                            session.state.finalPrice = result.finalPrice || 0;
                        }

                        // ✅ If result has no response and currentField is null, ask for next field
                        if (!result.response && result.currentField === null) {
                            logger.info(`[LeadAgent] ✅ Field processed successfully, checking for next field`);

                            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);

                            if (missingFields.length > 0) {
                                const nextField = missingFields[0];
                                logger.info(`[LeadAgent] Next missing field: ${nextField}`);

                                session.state.currentField = nextField as keyof UserFriendlyParams;

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

                                const response = fieldResult.response;
                                await session.memory.chatHistory.addAIChatMessage(response);
                                return response;
                            } else {
                                // All fields complete - move to price calculation
                                logger.info(`[LeadAgent] ✅ All fields complete, moving to price calculation`);

                                const priceResult = await calculatePriceNode({
                                    sessionId,
                                    messages: await session.memory.chatHistory.getMessages(),
                                    userFriendlyParams: session.state.userFriendlyParams,
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
                                    color: null,
                                    colorCost: 0,
                                    generatedImageUrl: "",
                                    _pendingConfirmation: null
                                });

                                const response = priceResult.response;
                                await session.memory.chatHistory.addAIChatMessage(response);

                                // Update session with price data
                                session.state.priceCalculated = true;
                                session.state.pricingData = priceResult.pricingData;
                                session.state.basePrice = priceResult.basePrice || 0;
                                session.state.finalPrice = priceResult.finalPrice || 0;

                                return response;
                            }
                        }

                        // ✅ If result has a response, use it
                        if (result.response) {
                            await session.memory.chatHistory.addAIChatMessage(result.response);
                            return result.response;
                        }

                        // ✅ Fallback
                        logger.warn(`[LeadAgent] ⚠️ Unexpected state: no response and currentField is not null`);
                        return "Please continue with your building specifications.";

                    } catch (error) {
                        logger.error(`[LeadAgent] ERROR in choice field mode:`, error);
                        session.state.currentField = null;
                        return `❌ Error processing your input. Let's try again. What are your building dimensions?`;
                    }
                }

                if (isInFieldMode && this.isDimensionField(session.state.currentField)) {
                    logger.info(`[LeadAgent] In dimension field mode (${session.state.currentField}), checking for batch dimensions...`);

                    const batchDimensions = await this.detectBatchDimensions(input);

                    if (batchDimensions && batchDimensions.width && batchDimensions.length && batchDimensions.height) {
                        logger.info(`[LeadAgent] ✅ BATCH dimensions detected in field mode: ${batchDimensions.width}x${batchDimensions.length}x${batchDimensions.height}`);

                        // Apply all three dimensions
                        session.state.userFriendlyParams.width = batchDimensions.width;
                        session.state.userFriendlyParams.length = batchDimensions.length;
                        session.state.userFriendlyParams.height = batchDimensions.height;
                        session.state.hasGarageIntent = true;
                        session.state.currentField = null; // Clear field mode

                        const response = `✓ Got it! Building dimensions: ${batchDimensions.width}ft wide × ${batchDimensions.length}ft long × ${batchDimensions.height}ft tall`;
                        await session.memory.chatHistory.addAIChatMessage(response);

                        // Check for other missing fields
                        const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                        if (missingFields.length === 0) {
                            // All fields complete
                            return response + "\n\nMoving to price calculation...";
                        } else {
                            // Ask for next missing field
                            const nextField = missingFields[0];
                            session.state.currentField = nextField as keyof UserFriendlyParams;

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

                            const fullResponse = `${response}\n\n${fieldResult.response}`;
                            await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                            return fullResponse;
                        }
                    }

                    logger.info(`[LeadAgent] No batch dimensions detected, continuing with single field extraction`);
                }

                if (!hasDimensions && !isInFieldMode) {
                    logger.info(`[LeadAgent] Checking for explicit batch dimensions...`);
                    const batchDimensions = await this.detectBatchDimensions(input);

                    if (batchDimensions && batchDimensions.width && batchDimensions.length && batchDimensions.height) {
                        logger.info(`[LeadAgent] ✅ EXPLICIT batch dimensions: ${batchDimensions.width}x${batchDimensions.length}x${batchDimensions.height}`);

                        session.state.userFriendlyParams.width = batchDimensions.width;
                        session.state.userFriendlyParams.length = batchDimensions.length;
                        session.state.userFriendlyParams.height = batchDimensions.height;
                        session.state.hasGarageIntent = true;

                        const response = `✓ Got it! Building dimensions: ${batchDimensions.width}ft wide × ${batchDimensions.length}ft long × ${batchDimensions.height}ft tall`;
                        await session.memory.chatHistory.addAIChatMessage(response);

                        const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                        if (missingFields.length > 0) {
                            const nextField = missingFields[0];
                            session.state.currentField = nextField as keyof UserFriendlyParams;

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

                            const fullResponse = `${response}\n\n${fieldResult.response}`;
                            await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                            return fullResponse;
                        }

                        return response;
                    }
                } else if (hasDimensions) {
                    logger.info(`[LeadAgent] ✅ Dimensions already complete, SKIPPING batch detection`);
                }

                if (IntentDetector.detectReset(input))
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

                logger.info(`[LeadAgent] Checking for batch dimensions...`);
                const batchDimensions = await this.detectBatchDimensions(input);
                if (batchDimensions && batchDimensions.width && batchDimensions.length && batchDimensions.height) {
                    logger.info(`[LeadAgent] ✅ BATCH DIMENSIONS DETECTED: ${batchDimensions.width}x${batchDimensions.length}x${batchDimensions.height}`);

                    // Update session state with batch dimensions
                    session.state.userFriendlyParams.width = batchDimensions.width;
                    session.state.userFriendlyParams.length = batchDimensions.length;
                    session.state.userFriendlyParams.height = batchDimensions.height;
                    session.state.hasGarageIntent = true;

                    const response = `✓ Got it! Building dimensions: ${batchDimensions.width}ft wide × ${batchDimensions.length}ft long × ${batchDimensions.height}ft tall`;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    // Now check for other missing fields
                    const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                    if (missingFields.length === 0) {
                        // All fields complete, go to price calculation
                        session.state.currentField = null;
                        return response + "\n\nMoving to price calculation...";
                    } else {
                        // Ask for next missing field
                        const nextField = missingFields[0];
                        session.state.currentField = nextField as keyof UserFriendlyParams;

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

                        const fullResponse = `${response}\n\n${fieldResult.response}`;
                        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                        return fullResponse;
                    }
                }

                if (session.state.currentField === "color" && !session.state.color && !session.state.priceCalculated) {
                    logger.info(`[LeadAgent] 🎨 COLOR SELECTION PHASE - user input: "${input}"`);

                    const userInputLower = input.toLowerCase().trim();

                    // ✅ CRITICAL FIX: Check if input is a simple option number FIRST
                    // BEFORE checking for parameter updates
                    // This prevents "1" from being treated as "width = 1"
                    const trimmedInput = input.trim();
                    const isSimpleNumber = /^\d+$/.test(trimmedInput);
                    const isLikelyColorSelection = isSimpleNumber && parseInt(trimmedInput) >= 1 && parseInt(trimmedInput) <= 10;

                    if (isLikelyColorSelection) {
                        logger.info(`[LeadAgent] 🎨 Input "${trimmedInput}" is a color option selection, SKIPPING parameter update detection`);
                        // Skip ALL parameter detection and go straight to color selection
                        try {
                            return await this.handleColorSelection(session, sessionId, input);
                        } catch (error) {
                            logger.error(`[LeadAgent] ❌ ERROR in color selection:`, error);
                            return `❌ Error processing color. Please try again or say "any" for default (White)`;
                        }
                    }

                    // ✅ Only check for parameter updates if NOT a simple color number
                    logger.info(`[LeadAgent] 🔄 Checking for parameter updates during color phase...`);

                    try {
                        const paramDetector = ParameterUpdateDetector.getInstance();
                        const paramUpdate = await paramDetector.detectParameterUpdate(userInputLower);

                        if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                            logger.info(
                                `[LeadAgent] 🔄 Parameter update detected during color phase: ${paramUpdate.field} = ${paramUpdate.value}`
                            );

                            // Update the parameter
                            const fieldKey = paramUpdate.field as keyof UserFriendlyParams;
                            let parsedValue: any = paramUpdate.value;

                            if (["width", "length", "height", "utility_length"].includes(paramUpdate.field)) {
                                parsedValue = parseInt(paramUpdate.value, 10);
                                if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue > 500) {
                                    return `❌ Invalid value for ${paramUpdate.field}. Please provide a number between 1 and 500.`;
                                }
                            }

                            session.state.userFriendlyParams[fieldKey] = parsedValue;
                            logger.info(`[LeadAgent] ✅ Updated ${paramUpdate.field} to ${parsedValue}`);

                            const updateMessage = `✅ Updated ${paramUpdate.field} to ${parsedValue}\n\n`;
                            const continueMessage = `Let's continue. ${this.getColorSelectionPrompt()}`;

                            const fullResponse = updateMessage + continueMessage;
                            await session.memory.chatHistory.addAIChatMessage(fullResponse);
                            return fullResponse;
                        }
                    } catch (error) {
                        logger.error(`[LeadAgent] Error detecting parameter update during color phase:`, error);
                        // Continue to color matching if detector fails
                    }

                    // ✅ Continue with normal color selection
                    const isAddonRequest = /^(add|get|want|need)\s+\d+\s+(window|door|brace|cupola|sectional)/i.test(input);

                    if (isAddonRequest) {
                        logger.info(`[LeadAgent] ⚠️ User in color phase but requesting addons: "${input}"`);
                        logger.info(`[LeadAgent] Setting default color (White) and proceeding to price calculation`);

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
                            _pendingConfirmation: {
                                field: "",
                                matchedValue: ""
                            }
                        });

                        this.restoreDimensionsIfCorrupted(session, originalDimensions);
                        this.updateSessionWithPrice(session, priceResult, "White");

                        logger.info(`[LeadAgent] 🎨 Price calculated, showing addon menu`);
                        try {
                            const addonsState = await this.createAddonsState(session, sessionId);
                            const addonsResponse = await showAddonsNode(addonsState);

                            const response = `${priceResult.response}\n\n${addonsResponse.response}`;
                            await session.memory.chatHistory.addAIChatMessage(response);
                            return response;
                        } catch (error) {
                            logger.error(`[LeadAgent] Error showing addon menu:`, error);
                            await session.memory.chatHistory.addAIChatMessage(priceResult.response);
                            return priceResult.response;
                        }
                    }

                    try {
                        return await this.handleColorSelection(session, sessionId, input);
                    } catch (error) {
                        logger.error(`[LeadAgent] ❌ ERROR in color phase:`, error);
                        return `❌ Error processing color. Please try again or say "any" for default (White)`;
                    }
                }

                if (session.state.priceCalculated) {
                    logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);

                    const userInput = input.toLowerCase().trim();

                    // ✅ CHECK 1: Skip addons FIRST
                    if (this.shouldSkipAddons(userInput)) {
                        logger.info(`[LeadAgent] 🎨 User skipped addons - DIRECT VISUALIZATION`);
                        return await this.handleUserDeclinesAddons(session, sessionId);
                    }

                    // ✅ CHECK 2: Empty input - show addon menu
                    if (input === "" || input.length === 0) {
                        return await this.handleEmptyInputAfterPrice(session, sessionId);
                    }

                    // ✅ CHECK 3: PARAMETER UPDATE DETECTION (NEW!)
                    // Detect if user wants to update width, length, height, roof_type, gauge, etc.
                    logger.info(`[LeadAgent] 🔄 Checking for parameter updates...`);

                    try {
                        const paramDetector = ParameterUpdateDetector.getInstance();
                        const paramUpdate = await paramDetector.detectParameterUpdate(userInput);

                        if (paramUpdate.isUpdate && paramUpdate.field && paramUpdate.confidence !== "low") {
                            logger.info(
                                `[LeadAgent] 🔄 Parameter update detected: ${paramUpdate.field} = ${paramUpdate.value} (confidence: ${paramUpdate.confidence})`
                            );

                            // Map the detected field and value to the update format
                            const update = {
                                field: paramUpdate.field,
                                value: paramUpdate.value,
                            };

                            return await this.handleParameterUpdateAfterPrice(session, sessionId, update, userInput);
                        }
                    } catch (error) {
                        logger.error(`[LeadAgent] Error detecting parameter update:`, error);
                        // Continue to next checks if detector fails
                    }

                    // ✅ CHECK 4: AI-POWERED COLOR CHANGE DETECTION
                    logger.info(`[LeadAgent] 🎨 Checking for color change request using AI...`);

                    try {
                        const colorHandler = ColorChangeHandler.getInstance();
                        const colorIntent = await colorHandler.extractColorIntent(userInput);

                        if (colorIntent.isColorChangeRequest) {
                            logger.info(
                                `[LeadAgent] 🎨 AI detected color change request: "${colorIntent.colorName}" (confidence: ${colorIntent.confidence})`
                            );
                            return await this.handleColorChangeRequest(session, sessionId, userInput);
                        }
                    } catch (error) {
                        logger.error(`[LeadAgent] Error checking color intent:`, error);
                        // Continue to next checks if color handler fails
                    }

                    // ✅ CHECK 5: Addon request
                    const isAddonRequest = this.detectAddonRequest(userInput);
                    if (isAddonRequest) {
                        logger.info(`[LeadAgent] Addon request detected`);
                        return await this.handleAddonRequestAfterPrice(session, sessionId, userInput);
                    }

                    // Default: show addon menu
                    logger.info(`[LeadAgent] No specific action detected, showing addon menu`);
                    try {
                        const addonsState = await this.createAddonsState(session, sessionId);
                        const addonsResponse = await showAddonsNode(addonsState);
                        const response = addonsResponse.response;
                        await session.memory.chatHistory.addAIChatMessage(response);
                        return response;
                    } catch (error) {
                        logger.error(`[LeadAgent] Error showing addon menu:`, error);
                        return `❌ Error loading addon options.`;
                    }
                }

                logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

                const shouldSkipGarageDetection = await this.shouldSkipGarageDetectionForState(
                    input,
                    session.state.currentField
                );

                logger.info(`[LeadAgent] Should skip garage detection: ${shouldSkipGarageDetection}`);


                const update = (!isInChoiceFieldMode && !shouldSkipGarageDetection)
                    ? await detectParameterUpdateFromInput(input, session.state.currentField || undefined)
                    : null;

                logger.info(`[LeadAgent] Parameter update detected: ${update ? `${update.field} = ${update.value}` : 'none'}`);

                if (update && session.state.currentField)
                {
                    return await this.handleParameterUpdate(session, sessionId, update, input);
                }

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

                if (result.priceCalculated && result.pricingData)
                {
                    session.state.pricingData = result.pricingData;
                    session.state.basePrice = result.basePrice || 0;
                    session.state.selectedAddons = result.selectedAddons || [];
                    session.state.finalPrice = result.finalPrice || 0;
                }

                return response;
            }
            catch (error)
            {
                logger.error(`[LeadAgent] Error:`, error);
                return "❌ An error occurred. Please try again.";
            }
        }

        private isDimensionField(field: string | null): boolean {
            if (!field) return false;
            return ['width', 'length', 'height', 'utility_length'].includes(field);
        }

        private async handleParameterUpdateAfterPrice(
            session: any,
            sessionId: string,
            update: any,
            userInput: string
        ): Promise<string> {
            logger.info(
                `[LeadAgent] 🔄 Handling parameter update after price: ${update.field} = ${update.value}`
            );

            try {
                // ✅ STEP 1: Update the parameter in session
                const fieldKey = update.field as keyof UserFriendlyParams;

                // Parse the value based on field type
                let parsedValue: any = update.value;

                if (["width", "length", "height", "utility_length", "gauge"].includes(update.field)) {
                    // Numeric fields
                    parsedValue = parseInt(update.value, 10);
                    if (isNaN(parsedValue) || parsedValue <= 0 || parsedValue > 500) {
                        return `❌ Invalid value for ${update.field}. Please provide a number between 1 and 500.`;
                    }
                } else if (["roof_type", "building_type"].includes(update.field)) {
                    // Choice fields - normalize to lowercase
                    parsedValue = update.value.toLowerCase().trim();
                }

                // Update session params
                session.state.userFriendlyParams[fieldKey] = parsedValue;
                logger.info(`[LeadAgent] ✅ Updated ${update.field} to ${parsedValue}`);

                // Store original dimensions to prevent corruption
                const originalDimensions = {
                    width: session.state.userFriendlyParams.width,
                    length: session.state.userFriendlyParams.length,
                    height: session.state.userFriendlyParams.height,
                };

                // ✅ STEP 2: Recalculate price with updated parameters
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

                // Restore dimensions if corrupted
                this.restoreDimensionsIfCorrupted(session, originalDimensions);

                // Update session with new pricing
                this.updateSessionWithPrice(session, priceResult, session.state.color);

                // ✅ STEP 3: Build response message
                const updateMessage = `✅ Updated ${update.field} to ${parsedValue}`;
                const priceMessage = priceResult.response;

                const fullResponse = `${updateMessage}\n\n${priceMessage}`;

                await session.memory.chatHistory.addAIChatMessage(fullResponse);
                return fullResponse;
            } catch (error) {
                logger.error(`[LeadAgent] Error updating parameter after price:`, error);
                return `❌ Error updating ${update.field}. Please try again.`;
            }
        }

        private calculateFinalPrice(basePrice: number, colorCost: number, selectedAddons: any[], sqft: number): number
        {
            const laborCost: number = basePrice * 0.5;
            const foundationCost: number = sqft * 8.5;
            const deliveryCost = 750;
            const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
            const contingency: number = (basePrice + colorCost + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;

            return (
                basePrice + colorCost + laborCost + foundationCost + deliveryCost + contingency + addonTotal
            );
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

        private restoreDimensionsIfCorrupted(session: any, originalDimensions: { width?: number; length?: number; height?: number }): void {
            const currentDimensions = {
                width: session.state.userFriendlyParams.width,
                length: session.state.userFriendlyParams.length,
                height: session.state.userFriendlyParams.height,
            };

            const dimensionChanged =
                currentDimensions.width !== originalDimensions.width ||
                currentDimensions.length !== originalDimensions.length ||
                currentDimensions.height !== originalDimensions.height;

            if (dimensionChanged && originalDimensions.width && originalDimensions.length && originalDimensions.height) {
                logger.error(
                    `[DIMENSION_CORRUPTION_DETECTED] Dimensions were corrupted during processing!`,
                    {
                        before: originalDimensions,
                        after: currentDimensions,
                    }
                );

                // ✅ Restore original dimensions
                session.state.userFriendlyParams.width = originalDimensions.width;
                session.state.userFriendlyParams.length = originalDimensions.length;
                session.state.userFriendlyParams.height = originalDimensions.height;

                logger.info(
                    `[DIMENSION_RESTORED] Dimensions restored to:`,
                    originalDimensions
                );
            }
        }

        private async shouldSkipGarageDetectionForState(
            userInput: string,
            currentField: string | null | undefined
        ): Promise<boolean> {
            logger.info(`[LeadAgent] Checking if should skip garage detection...`);
            logger.info(`[LeadAgent] Input: "${userInput}", Current field: "${currentField}"`);

            const trimmedInput = userInput.trim();
            const isJustNumber = /^\d+(?:\.\d+)?$/.test(trimmedInput);

            // ✅ RULE 1: If asking for choice fields (NOT state), skip garage detection
            if (currentField && ["roof_type", "gauge", "building_type"].includes(currentField)) {
                logger.info(`[LeadAgent] ⚠️ Currently asking for CHOICE FIELD (${currentField}) - skipping garage detection`);
                return true;
            }

            // ✅ RULE 2: If asking for dimensions, skip garage detection
            if (currentField && ["width", "length", "height", "utility_length"].includes(currentField)) {
                logger.info(`[LeadAgent] ⚠️ Currently asking for DIMENSION (${currentField}) - skipping garage detection`);
                return true;
            }

            // ✅ RULE 3: If asking for STATE and input is a SINGLE NUMBER, skip garage detection
            // This prevents "10" from being interpreted as "10-car" when asking for state
            if (currentField === "state_name" && isJustNumber) {
                logger.info(`[LeadAgent] ⚠️ Currently asking for STATE with numeric input "${userInput}" - skipping garage detection`);
                return true;
            }

            // ✅ RULE 4: If asking for STATE but input mentions cars/garage, ALLOW garage detection
            if (currentField === "state_name") {
                const isGarageRelated = /\b(car|cars|garage|2-car|3-car|4-car|for\s+\d+)\b/i.test(userInput);
                if (isGarageRelated) {
                    logger.info(`[LeadAgent] ✅ Garage-related input while asking for STATE - allowing garage detection`);
                    return false;
                }
            }

            // ✅ RULE 5: INITIAL FLOW - If NO current field and input is JUST A NUMBER
            // Single numbers at the start should be treated as dimensions (width), not garage
            // Example: "20" at start = width 20ft, NOT 20-car garage
            if (!currentField && isJustNumber) {
                logger.info(`[LeadAgent] ⚠️ Single number in initial flow ("${userInput}") - treating as dimension, not garage`);
                logger.info(`[LeadAgent] User should say "20 cars" or "for 2 cars" to update garage`);
                return true; // Skip garage detection for bare numbers
            }

            // ✅ RULE 6: If no current field and input is EXPLICIT GARAGE mention, allow detection
            // Examples: "garage for 2 cars", "2-car", "i want 3 cars"
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

        private getOrCreateSession(sessionId: string): any {
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

        private getColorSelectionPrompt(): string {
            return `Now, which color would you prefer for your building? (You can say "any" for default White, or choose from available colors)`;
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


        private async handleColorChangeRequest(session: any, sessionId: string, userInput: string): Promise<string> {
            logger.info(`[LeadAgent] 🎨 EXPLICIT COLOR CHANGE REQUEST detected: "${userInput}"`);

            try {
                // ✅ STEP 1: Get all available colors
                const allColors: ColorOption[] = await this.colorService.get();

                if (!allColors || allColors.length === 0) {
                    logger.error(`[LeadAgent] ❌ NO COLORS IN DATABASE!`);
                    return `❌ Error: No colors available in database.`;
                }

                logger.info(`[LeadAgent] ✅ Got ${allColors.length} colors from database`);

                // Convert to simple format for AI matcher
                const availableColors = allColors.map((c) => ({
                    name: c.name,
                    cost: c.cost || 0,
                }));

                // ✅ STEP 2: Use AI to extract and match color
                const colorHandler = ColorChangeHandler.getInstance();
                const result = await colorHandler.handleColorChange(userInput, availableColors);

                if (!result.success) {
                    logger.warn(`[LeadAgent] Color change failed: ${result.message}`);

                    // If there are alternatives, format them nicely
                    if (result.alternatives && result.alternatives.length > 0) {
                        const altList = result.alternatives
                            .slice(0, 5)
                            .map((c, i) => `${i + 1}. ${c.name}`)
                            .join("\n");

                        return `❌ ${result.message}\n\n📋 Available colors:\n${altList}`;
                    }

                    return `❌ ${result.message}`;
                }

                if (!result.color) {
                    logger.warn(`[LeadAgent] No color matched`);
                    return `❌ Could not determine color preference.`;
                }

                // ✅ STEP 3: Apply color and recalculate price
                logger.info(`[LeadAgent] ✅ Color selected: ${result.color.name}`);

                const colorChangeMessage = await this.applyColorAndCalculatePrice(session, sessionId, {
                    name: result.color.name,
                    cost: result.color.cost,
                    id: 0,
                    hex_value: "",
                    red_value: 0,
                    green_value: 0,
                    blue_value: 0
                });

                // ✅ STEP 4: Add alternatives suggestion if available
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
                logger.error(`[LeadAgent] ❌ ERROR in color change request:`, error);
                return `❌ Error processing color change. Please try again.`;
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
                    logger.error(`[LeadAgent] ❌ NO COLORS IN DATABASE!`);
                    return `❌ Error: No colors available in database. Skipping color selection.`;
                }

                logger.info(`[LeadAgent] ✅ Got ${allColors.length} colors from database`);

                const groupedColors: Map<string, ColorOption[]> = this.colorService.group(allColors, 5);
                const displayColors: ColorOption[] = [];

                for (const [category, colors] of groupedColors.entries()) {
                    if (colors && Array.isArray(colors) && colors.length > 0) {
                        logger.info(`[LeadAgent] Adding ${colors.length} colors from category: ${category}`);
                        displayColors.push(...colors);
                    }
                }

                logger.info(`[LeadAgent] Built displayColors array: ${displayColors.length} colors`);

                if (displayColors.length === 0) {
                    logger.error(`[LeadAgent] ❌ displayColors is empty after grouping!`);
                    return `❌ Error: No colors available for selection.`;
                }

                const firstColor = displayColors[0];
                if (!firstColor || !firstColor.name) {
                    logger.error(`[LeadAgent] ❌ displayColors contains invalid objects!`);
                    return `❌ Error: Color data is corrupted. Please contact support.`;
                }

                logger.info(`[LeadAgent] Attempting to match user input: "${input}"`);

                const selectedColor: ColorOption = this.colorService.detect(input, displayColors);

                if (selectedColor) {
                    return await this.applyColorAndCalculatePrice(session, sessionId, selectedColor);
                } else {
                    return this.buildColorNotFoundMessage(input, displayColors);
                }
            } catch (error) {
                logger.error(`[LeadAgent] ❌ ERROR in color phase:`, error);
                return `❌ Error processing color. Please try again or say "any" for default (White)`;
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

        private buildColorNotFoundMessage(input: string, displayColors: ColorOption[]): string
        {
            logger.warn(`[LeadAgent] ❌ Color not matched for input: "${input}"`);

            const suggestions = displayColors
                .slice(0, 3)
                .map((c, i) => `${i + 1}. ${c.name}`)
                .join(", ");

            return `❌ Color "${input}" not recognized.\n\nTry:\n• "1" or "2" to select by number\n• "Barn Red" or "barn red" for exact color\n• "red" to search\n• "any" for default (White)\n\n💡 Example colors: ${suggestions}...`;
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

        // ============================================================================
    // COPY THIS EXACT METHOD INTO YOUR LeadAgent.ts
    // Replace your entire detectBatchDimensions method with this
    // ============================================================================

        private async detectBatchDimensions(userInput: string): Promise<{ width: number; length: number; height: number } | null> {
            if (!userInput) {
                logger.info(`[LeadAgent] detectBatchDimensions: empty input`);
                return null;
            }

            try {
                logger.info(`[LeadAgent] detectBatchDimensions: "${userInput}"`);

                // ✅ STEP 1: Try abbreviated format FIRST (highest priority)
                const abbreviatedPattern = /w\s*:?\s*(\d+)\s*l\s*:?\s*(\d+)\s*h\s*:?\s*(\d+)/i;
                logger.info(`[LeadAgent] Testing abbreviated pattern: ${abbreviatedPattern}`);

                const abbreviatedMatch = userInput.match(abbreviatedPattern);

                if (abbreviatedMatch) {
                    logger.info(`[LeadAgent] ✅ Abbreviated pattern MATCHED!`);
                    logger.info(`[LeadAgent] Raw match: ${JSON.stringify(abbreviatedMatch)}`);

                    const width = parseInt(abbreviatedMatch[1], 10);
                    const length = parseInt(abbreviatedMatch[2], 10);
                    const height = parseInt(abbreviatedMatch[3], 10);

                    logger.info(`[LeadAgent] Parsed values: w=${width}, l=${length}, h=${height}`);

                    // Validate dimensions
                    if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                        logger.info(`[LeadAgent] ✅ Validation passed: ${width}x${length}x${height}`);
                        return { width, length, height };
                    } else {
                        logger.warn(`[LeadAgent] ❌ Validation failed: values out of range (1-500)`);
                        logger.warn(`[LeadAgent] Values: width=${width}, length=${length}, height=${height}`);
                    }
                } else {
                    logger.info(`[LeadAgent] ❌ Abbreviated pattern did NOT match`);
                }

                // ✅ STEP 2: Try other patterns
                logger.info(`[LeadAgent] Trying standard patterns...`);

                // X format
                const xPattern = /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i;
                const xMatch = userInput.match(xPattern);
                if (xMatch) {
                    const width = parseInt(xMatch[1], 10);
                    const length = parseInt(xMatch[2], 10);
                    const height = parseInt(xMatch[3], 10);

                    if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                        logger.info(`[LeadAgent] ✅ X format match: ${width}x${length}x${height}`);
                        return { width, length, height };
                    }
                }

                // Comma format
                const commaPattern = /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/;
                const commaMatch = userInput.match(commaPattern);
                if (commaMatch) {
                    const width = parseInt(commaMatch[1], 10);
                    const length = parseInt(commaMatch[2], 10);
                    const height = parseInt(commaMatch[3], 10);

                    if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                        logger.info(`[LeadAgent] ✅ Comma format match: ${width}x${length}x${height}`);
                        return { width, length, height };
                    }
                }

                // Labeled format
                const labeledPattern = /width.*?(\d+).*?length.*?(\d+).*?height.*?(\d+)/i;
                const labeledMatch = userInput.match(labeledPattern);
                if (labeledMatch) {
                    const width = parseInt(labeledMatch[1], 10);
                    const length = parseInt(labeledMatch[2], 10);
                    const height = parseInt(labeledMatch[3], 10);

                    if (width > 0 && width <= 500 && length > 0 && length <= 500 && height > 0 && height <= 500) {
                        logger.info(`[LeadAgent] ✅ Labeled format match: ${width}x${length}x${height}`);
                        return { width, length, height };
                    }
                }

                // Try DimensionManager as fallback
                logger.info(`[LeadAgent] Trying DimensionManager...`);
                const dimensionManager = DimensionManager.getInstance();
                const calculation = dimensionManager.calculateDimensions(userInput);

                if (calculation && calculation.width && calculation.length && calculation.height) {
                    logger.info(`[LeadAgent] ✅ DimensionManager match: ${calculation.width}x${calculation.length}x${calculation.height}`);
                    return {
                        width: calculation.width,
                        length: calculation.length,
                        height: calculation.height,
                    };
                }

                logger.info(`[LeadAgent] ❌ No pattern matched`);
                return null;

            } catch (error) {
                logger.error(`[LeadAgent] detectBatchDimensions error:`, error);
                return null;
            }
        }

        private async handleParameterUpdate(
            session: any,
            sessionId: string,
            update: any,
            input: string
        ): Promise<string> {
            logger.info(`[LeadAgent] 🔄 Parameter update detected: ${update.field} = ${update.value} (while asking for ${session.state.currentField})`);

            try {
                const updateService = ParameterUpdateServiceImpl.getInstance();

                // ✅ STEP 1: Apply first update
                const processResult = await updateService.process(
                    update,
                    input,
                    session.state.userFriendlyParams,
                    session.stateMapCache || new Map()
                );

                if ("error" in processResult) {
                    logger.error(`[LeadAgent] Update processing failed`, processResult.error);
                    const errorResponse = processResult.error.response || `❌ Could not update ${update.field}. Please try again.`;
                    await session.memory.chatHistory.addAIChatMessage(errorResponse);
                    return errorResponse;
                }

                const { result } = processResult;

                if (!result.success) {
                    logger.warn(`[LeadAgent] Update validation failed: ${result.message}`);
                    await session.memory.chatHistory.addAIChatMessage(result.message);
                    return result.message;
                }

                // Update session params with first result
                if (result.updatedParams) {
                    session.state.userFriendlyParams = {
                        ...session.state.userFriendlyParams,
                        ...result.updatedParams
                    };
                    logger.info(`[LeadAgent] ✅ Successfully updated ${update.field}`, session.state.userFriendlyParams);
                }

                // ✅ STEP 2: Check for pending multi-dimension updates
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

                    // Clear the pending updates
                    (global as any).__pendingMultiDimensions = [];
                }

                // ✅ STEP 3: Check for missing fields
                const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
                logger.info(`[LeadAgent] After update - Missing fields: ${missingFields.length}`, missingFields);

                let finalResponse: string;
                const updateMessage = result.message;

                if (missingFields.length === 0) {
                    // All fields complete - calculate price
                    logger.info(`[LeadAgent] ✅ All fields complete after multi-updates, calculating price`);
                    finalResponse = await this.calculatePriceAfterUpdate(session, sessionId);
                } else {
                    // Still missing fields - ask for next one
                    finalResponse = await this.askForNextField(session, sessionId, missingFields[0], updateMessage);
                }

                await session.memory.chatHistory.addAIChatMessage(finalResponse);
                return finalResponse;

            } catch (error) {
                logger.error(`[LeadAgent] Exception handling update:`, error);
                const errorMsg = `❌ Error updating ${update.field}. Please try again.`;
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
                // ✅ FIRST: Check if user wants to skip addons
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
                    return `❌ Error: Addon options not available`;
                }

                // ✅ CRITICAL FIX: Use AddonServiceImpl.parse() instead of parseAddonSelections()
                // This will use AI number extraction for "two", "three", "a couple", etc.
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
                return `❌ Error processing addons. Please try again.`;
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
                return `❌ Error loading addon options. Please try again.`;
            }
        }

        /**
         * ✅ NEW: Helper to detect skip intent
         */
        private shouldSkipAddons(userInput: string): boolean {
            const skipKeywords = [
                "any",
                "skip",
                "no",
                "none",
                "without",
                "don't need",
                "no addons",
                "no add-ons",
                "nope",
                "nah",
                "not needed",
                "nothing",
            ];

            const trimmed = userInput.toLowerCase().trim();

            return skipKeywords.some(keyword => {
                return trimmed === keyword || trimmed.startsWith(keyword);
            });
        }
    }

    function Enforce(): void {}
