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

                    // Continue to next field
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
                            generatedImageUrl: ""
                        });

                        const fullResponse = `${response}\n\n${fieldResult.response}`;
                        await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                        return fullResponse;
                    }

                    return response;
                }
            } else if (hasDimensions) {
                logger.info(`[LeadAgent] ✅ Dimensions already complete, SKIPPING batch detection`);
            } else if (isInFieldMode) {
                logger.info(`[LeadAgent] ✅ In field mode (${session.state.currentField}), SKIPPING batch detection`);
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
                        generatedImageUrl: ""
                    });

                    const fullResponse = `${response}\n\n${fieldResult.response}`;
                    await session.memory.chatHistory.addAIChatMessage(fieldResult.response);
                    return fullResponse;
                }
            }

            if (session.state.currentField === "color" && !session.state.color && !session.state.priceCalculated)
            {
                logger.info(`[LeadAgent] 🎨 COLOR SELECTION PHASE - user input: "${input}"`);

                const isAddonRequest: boolean = /^(add|get|want|need)\s+\d+\s+(window|door|brace|cupola|sectional)/i.test(input);

                if (isAddonRequest)
                {
                    logger.info(`[LeadAgent] ⚠️  User in color phase but requesting addons: "${input}"`);
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
                        generatedImageUrl: ""
                    });

                    this.restoreDimensionsIfCorrupted(session, originalDimensions);
                    this.updateSessionWithPrice(session, priceResult, "White");

                    logger.info(`[LeadAgent] 🎨 Price calculated, showing addon menu`);
                    try
                    {
                        const addonsState = await this.createAddonsState(session, sessionId);
                        const addonsResponse = await showAddonsNode(addonsState);

                        const response = `${priceResult.response}\n\n${addonsResponse.response}`;
                        await session.memory.chatHistory.addAIChatMessage(response);
                        return response;
                    }
                    catch (error)
                    {
                        logger.error(`[LeadAgent] Error showing addon menu:`, error);
                        await session.memory.chatHistory.addAIChatMessage(priceResult.response);
                        return priceResult.response;
                    }
                }

                try
                {
                    return await this.handleColorSelection(session, sessionId, input);
                }
                catch (error)
                {
                    logger.error(`[LeadAgent] ❌ ERROR in color phase:`, error);
                    return `❌ Error processing color. Please try again or say "any" for default (White)`;
                }
            }

            if (session.state.priceCalculated)
            {
                logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);

                const userInput = input.toLowerCase().trim();

                // ✅ CHECK 1: Skip addons FIRST (any, skip, no, none, etc.)
                if (this.shouldSkipAddons(userInput)) {
                    logger.info(`[LeadAgent] 🎨 User skipped addons - DIRECT VISUALIZATION`);
                    return await this.handleUserDeclinesAddons(session, sessionId);
                }

                // ✅ CHECK 2: Empty input - show addon menu
                if (input === "" || input.length === 0) {
                    return await this.handleEmptyInputAfterPrice(session, sessionId);
                }

                // ✅ CHECK 3: Explicit color change request
                const isExplicitColorChange = /^(color|paint|make.*color|change.*color)\b/i.test(input);
                if (isExplicitColorChange && !this.detectAddonRequest(userInput)) {
                    return await this.handleColorChangeRequest(session, sessionId);
                }

                // ✅ CHECK 4: Addon request
                const isAddonRequest = this.detectAddonRequest(userInput);
                if (isAddonRequest) {
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

            const update = await detectParameterUpdateFromInput(input,session.state.currentField || undefined);

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
            generatedImageUrl: ""
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
            generatedImageUrl: ""
        });

        return `${previousMessage}\n\n${fieldResult.response}`;
    }

    private async detectBatchDimensions(userInput: string): Promise<{ width: number; length: number; height: number } | null> {
        if (!userInput) return null;

        try {
            logger.info(`[LeadAgent] detectBatchDimensions: "${userInput}"`);

            // ✅ STRICT: Only allow EXPLICIT dimension patterns
            const explicitPatterns = [
                /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i,           // "20x30x10"
                /(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/,             // "20, 30, 10"
                /width.*?(\d+).*?length.*?(\d+).*?height.*?(\d+)/i,  // "width 20 length 30 height 10"
            ];

            const hasExplicitPattern = explicitPatterns.some(pattern => pattern.test(userInput));

            if (!hasExplicitPattern) {
                logger.info(`[LeadAgent] ❌ No explicit dimension pattern in: "${userInput}"`);
                return null;
            }

            logger.info(`[LeadAgent] ✅ Explicit dimension pattern detected`);

            // Try DimensionManager patterns first
            const dimensionManager = DimensionManager.getInstance();
            const calculation = dimensionManager.calculateDimensions(userInput);

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(`[LeadAgent] ✅ Pattern match: ${calculation.width}x${calculation.length}x${calculation.height}`);
                return {
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height,
                };
            }

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

            // Update session params
            if (result.updatedParams) {
                session.state.userFriendlyParams = {
                    ...session.state.userFriendlyParams,
                    ...result.updatedParams
                };
                logger.info(`[LeadAgent] ✅ Successfully updated ${update.field}`, session.state.userFriendlyParams);
            }

            // Check for missing fields
            const missingFields = LeadAgentHelpers.getMissingFields(session.state.userFriendlyParams);
            logger.info(`[LeadAgent] After update - Missing fields: ${missingFields.length}`, missingFields);

            let finalResponse: string;

            if (missingFields.length === 0) {
                // All fields complete - calculate price
                finalResponse = await this.calculatePriceAfterUpdate(session, sessionId);
            } else {
                // Still missing fields - ask for next one
                finalResponse = await this.askForNextField(session, sessionId, missingFields[0], result.message);
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

    private async handleColorChangeRequest(session: any, sessionId: string): Promise<string>
    {
        logger.info(`[LeadAgent] 🎨 EXPLICIT COLOR CHANGE REQUEST detected`);

        const result = await leadAgentGraph.invoke({
            sessionId,
            messages: await session.memory.chatHistory.getMessages(),
            userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
            hasGarageIntent: session.state.hasGarageIntent,
            priceCalculated: true,
            currentField: "color",
            validationError: null,
            response: "",
            nextStep: "ask_for_color",
            stateMapCache: session.stateMapCache || new Map(),
            roofMapCache: session.roofMapCache || new Map(),
            pendingUpdates: [],
            pricingData: session.state.pricingData || null,
            basePrice: session.state.basePrice || 0,
            selectedAddons: session.state.selectedAddons || [],
            finalPrice: session.state.finalPrice || 0,
            color: null,
            colorCost: 0,
        });

        const response = result.response;
        await session.memory.chatHistory.addAIChatMessage(response);
        session.state.currentField = "color";
        session.state.color = null;
        return response;
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
