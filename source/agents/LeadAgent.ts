import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { leadAgentGraph } from "@agents/LeadAgentGraph";
import { detectParameterUpdateFromInput, IntentDetector } from "@agents/tools/impl/DetectionHelpers";
import { SessionManager } from "@utils/session/SessionManager";
import { RedisCacheUtils } from "@utils/cache/RedisCacheUtils";
import { InstantiationError } from "@errors/InstantiationError";
import { ColorOption } from "@agents/tools/io/IColorChoice";
import { ColorService } from "@agents/tools/impl/io/ColorService";
import { ColorServiceImpl } from "@agents/tools/impl/ColorServiceImpl";
import { AddonService } from "@agents/tools/impl/io/AddonService";
import { AddonServiceImpl } from "@agents/tools/impl/AddonServiceImpl";

const logger: pino.Logger = createLogger(module);

export class LeadAgent {
    private static instance: LeadAgent;
    private sessionManager: SessionManager;
    private readonly addonManagerInstance: AddonService = AddonServiceImpl.getInstance();
    private readonly colorService: ColorService = ColorServiceImpl.getInstance();

    private constructor(enforce: () => void, cacheUtils: RedisCacheUtils) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use LeadAgent.getInstance() instead of new."
            );
        }

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

    private calculateFinalPrice(
        basePrice: number,
        colorCost: number,
        selectedAddons: any[],
        sqft: number
    ): number {
        const laborCost = basePrice * 0.5;
        const foundationCost = sqft * 8.5;
        const deliveryCost = 750;
        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
        const contingency =
            (basePrice + colorCost + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;

        return (
            basePrice + colorCost + laborCost + foundationCost + deliveryCost + contingency + addonTotal
        );
    }

    private detectAddonRequest(input: string): boolean {
        const addonPatterns = [
            /\b(add|also|and|get|want|need)\s+(\d+\s+)?[\w_]+/i,
            /\b(\d+)\s+[\w_]+/i,
            /\b(window|door|garage|walk.?in|brace|anchor|cupola|truss|sectional)/i,
        ];

        const isAddon = addonPatterns.some((pattern) => pattern.test(input));
        const isCarRelated = /\b\d+\s*(?:car|cars)\s*(?:garage)?\b/i.test(input);

        return isAddon && !isCarRelated;
    }

    private parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
        const selected: any[] = [];

        const normalizeForMatching = (text: string): string => {
            return text.toLowerCase().trim().replace(/[_\s-]+/g, "").replace(/s$/, "");
        };

        const looksLikeNumberSelection = /^[\d,\s]+$/.test(userInput.trim());

        if (looksLikeNumberSelection) {
            const numberMatches = userInput.match(/\d+/g);
            if (numberMatches) {
                const indices = numberMatches
                    .map((n) => parseInt(n) - 1)
                    .filter((idx) => idx >= 0 && idx < addonsMenu.length);

                indices.forEach((idx) => selected.push(addonsMenu[idx]));
                if (selected.length > 0) return selected;
            }
        }

        const quantityPattern =
            /(?:add|also|and|get|want|need)?\s*(\d+)\s+([\w_]+(?:\s+[\w_]+)*)/gi;
        const matches = [...userInput.matchAll(quantityPattern)];

        if (matches.length > 0) {
            for (const match of matches) {
                const quantity = parseInt(match[1], 10);
                const rawKeyword = match[2].trim();
                const normalizedKeyword = normalizeForMatching(rawKeyword);

                const matchingAddons = addonsMenu.filter((addon) => {
                    const normalizedLabel = normalizeForMatching(addon.label || "");
                    const normalizedType = normalizeForMatching(addon.type || "");

                    return (
                        normalizedLabel.includes(normalizedKeyword) ||
                        (normalizedKeyword.includes("window") && normalizedType.includes("window")) ||
                        (normalizedKeyword.includes("door") && normalizedType.includes("door")) ||
                        (normalizedKeyword.includes("walkin") && normalizedType.includes("walkin"))
                    );
                });

                if (matchingAddons.length > 0) {
                    for (let i = 0; i < quantity; i++) {
                        const addon = matchingAddons[i % matchingAddons.length];
                        selected.push({ ...addon, id: `${addon.id}_${Date.now()}_${i}` });
                    }
                }
            }
            if (selected.length > 0) return selected;
        }

        return selected;
    }

    private async getAddonsMenuFromDatabase(): Promise<any[]> {
        const allAddons = await this.addonManagerInstance.getAddonsWithCache();
        const limited = this.addonManagerInstance.getLimitedAddonsByType(allAddons, 10);
        return limited.map((addon) => ({
            id: addon.id,
            label: addon.label,
            type: addon.type,
            cost: addon.cost,
            description: addon.description || "",
        }));
    }

    public async run(sessionId: string, input: string): Promise<string> {
        logger.info(`[LeadAgent] Session ${sessionId} - Input: ${input}`);

        try {
            const session = this.getOrCreateSession(sessionId);
            await session.memory.chatHistory.addUserMessage(input);

            if (IntentDetector.detectReset(input)) {
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

            if (
                session.state.currentField === "color" &&
                !session.state.color &&
                !session.state.priceCalculated
            ) {
                logger.info(`[LeadAgent] 🎨 COLOR SELECTION PHASE - user input: "${input}"`);

                const isAddonRequest =
                    /^(add|get|want|need)\s+\d+\s+(window|door|brace|cupola|sectional)/i.test(input);

                if (isAddonRequest) {
                    logger.info(
                        `[LeadAgent] ⚠️  User in color phase but requesting addons: "${input}"`
                    );
                    logger.info(
                        `[LeadAgent] Setting default color (White) and proceeding to price calculation`
                    );

                    session.state.color = "White";
                    session.state.userFriendlyParams.color = "White";

                    const result = await leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                        hasGarageIntent: session.state.hasGarageIntent,
                        color: "White",
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
                    });

                    const response = result.response;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    session.state.color = "White";
                    session.state.priceCalculated = result.priceCalculated || false;
                    session.state.pricingData = result.pricingData;
                    session.state.basePrice = result.basePrice || 0;
                    session.state.finalPrice = result.finalPrice || 0;
                    session.state.colorCost = result.colorCost || 0;

                    return response;
                }

                try {
                    logger.info(`[LeadAgent] Fetching colors from database...`);
                    const allColors: ColorOption[] = await this.colorService.get();

                    if (!allColors || allColors.length === 0) {
                        logger.error(`[LeadAgent] ❌ NO COLORS IN DATABASE!`);
                        return `❌ Error: No colors available in database. Skipping color selection.`;
                    }

                    logger.info(`[LeadAgent] ✅ Got ${allColors.length} colors from database`);

                    const groupedColors: Map<string, ColorOption[]> = this.colorService.group(
                        allColors,
                        5
                    );
                    const displayColors: any[] = [];

                    for (const [category, colors] of groupedColors.entries()) {
                        if (colors && Array.isArray(colors) && colors.length > 0) {
                            logger.info(
                                `[LeadAgent] Adding ${colors.length} colors from category: ${category}`
                            );
                            displayColors.push(...colors);
                        }
                    }

                    logger.info(
                        `[LeadAgent] Built displayColors array: ${displayColors.length} colors`
                    );

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
                        logger.info(
                            `[LeadAgent] ✅ Color matched: "${selectedColor.name}" (cost: $${selectedColor.cost})`
                        );

                        session.state.color = selectedColor.name;
                        session.state.userFriendlyParams.color = selectedColor.name;

                        const result = await leadAgentGraph.invoke({
                            sessionId,
                            messages: await session.memory.chatHistory.getMessages(),
                            userFriendlyParams: session.state
                                .userFriendlyParams as Partial<UserFriendlyParams>,
                            hasGarageIntent: session.state.hasGarageIntent,
                            color: selectedColor.name,
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
                        });

                        const response: string = result.response;
                        await session.memory.chatHistory.addAIChatMessage(response);

                        session.state.color = result.color || selectedColor.name;
                        session.state.colorCost = result.colorCost || 0;
                        session.state.priceCalculated = result.priceCalculated || false;
                        session.state.basePrice = result.basePrice || 0;
                        session.state.finalPrice =
                            (result.basePrice || 0) + (result.colorCost || 0);
                        session.state.pricingData = result.pricingData;

                        if (result.userFriendlyParams) {
                            session.state.userFriendlyParams = {
                                ...session.state.userFriendlyParams,
                                ...result.userFriendlyParams,
                                color: selectedColor.name,
                            };
                        }

                        logger.info(`[LeadAgent] ✅ Color processed successfully`);
                        return response;
                    } else {
                        logger.warn(`[LeadAgent] ❌ Color not matched for input: "${input}"`);

                        const suggestions = displayColors
                            .slice(0, 3)
                            .map((c, i) => `${i + 1}. ${c.name}`)
                            .join(", ");

                        return `❌ Color "${input}" not recognized.\n\nTry:\n• "1" or "2" to select by number\n• "Barn Red" or "barn red" for exact color\n• "red" to search\n• "any" for default (White)\n\n💡 Example colors: ${suggestions}...`;
                    }
                } catch (error) {
                    logger.error(`[LeadAgent] ❌ ERROR in color phase:`, error);
                    return `❌ Error processing color. Please try again or say "any" for default (White)`;
                }
            }

            if (session.state.priceCalculated) {
                logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);

                const userInput = input.toLowerCase().trim();

                const isSkipping =
                    /(^|\s)(no|skip|none|without|don't|nope|nah|nothing)($|\s)/i.test(userInput);
                const isExplicitColorChange =
                    /^(color|paint|make.*color|change.*color)\b/i.test(input);
                const isAddonRequest = this.detectAddonRequest(userInput);

                if (isSkipping && !isExplicitColorChange && !isAddonRequest) {
                    logger.info(`[LeadAgent] ✅ User declined addons - DIRECT VISUALIZATION`);

                    const params = session.state.userFriendlyParams;
                    const basePrice = session.state.basePrice || 0;
                    const colorCost = session.state.colorCost || 0;
                    const sqft = (params.width || 0) * (params.length || 0);

                    const finalTotal = this.calculateFinalPrice(basePrice, colorCost, [], sqft);

                    const { generateGarageVisualizationNode } = await import(
                        "@agents/tools/impl/VisualizationNode"
                        );

                    const visualizationState: LeadAgentStateType = {
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
                        basePrice: basePrice,
                        selectedAddons: [],
                        finalPrice: finalTotal,
                        generatedImageUrl: null,
                        color: session.state.color,
                        colorCost: colorCost,
                    };

                    logger.info(
                        `[LeadAgent] 🎨 VISUALIZATION: Color=${session.state.color}, ColorCost=$${colorCost}, Final=$${finalTotal}`
                    );

                    const result = await generateGarageVisualizationNode(visualizationState);
                    const response = result.response;

                    await session.memory.chatHistory.addAIChatMessage(response);
                    session.state.finalPrice = finalTotal;

                    return response;
                }

                if (isExplicitColorChange && !isAddonRequest) {
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

                if (isAddonRequest) {
                    logger.info(`[LeadAgent] ✅ Detected addon request: "${userInput}"`);

                    try {
                        const addonsMenu = await this.getAddonsMenuFromDatabase();

                        if (!addonsMenu || addonsMenu.length === 0) {
                            logger.error(`[LeadAgent] No addons menu available`);
                            return `❌ Error: Addon options not available`;
                        }

                        const selectedAddons = this.parseAddonSelections(userInput, addonsMenu);

                        if (selectedAddons.length === 0) {
                            return `I couldn't find any addons matching "${userInput}".\n\nPlease try:\n• "1" to select by number\n• "2 windows" for 2 windows\n• "add 3 doors" for 3 garage doors`;
                        }

                        const basePrice = session.state.basePrice || 0;
                        const colorCost = session.state.colorCost || 0;
                        const params = session.state.userFriendlyParams;
                        const sqft = (params.width || 0) * (params.length || 0);

                        const finalTotal = this.calculateFinalPrice(basePrice, colorCost, selectedAddons, sqft);

                        const { generateGarageVisualizationNode } = await import(
                            "@agents/tools/impl/VisualizationNode"
                            );

                        const visualizationState: LeadAgentStateType = {
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
                            basePrice: basePrice,
                            selectedAddons: selectedAddons,
                            finalPrice: finalTotal,
                            generatedImageUrl: null,
                            color: session.state.color,
                            colorCost: colorCost,
                        };

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

                const update = await detectParameterUpdateFromInput(input, session.state.currentField || undefined);
                if (update) {
                    logger.info(`[LeadAgent] ✅ User modified parameter: ${update.field} = ${update.value}`);

                    const result = await leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                        hasGarageIntent: session.state.hasGarageIntent,
                        priceCalculated: true,
                        currentField: null,
                        validationError: null,
                        response: "",
                        nextStep: "handle_update",
                        stateMapCache: session.stateMapCache || new Map(),
                        roofMapCache: session.roofMapCache || new Map(),
                        pendingUpdates: [update],
                        pricingData: session.state.pricingData || null,
                        basePrice: session.state.basePrice || 0,
                        selectedAddons: session.state.selectedAddons || [],
                        finalPrice: session.state.finalPrice || 0,
                        color: session.state.color,
                        colorCost: session.state.colorCost,
                    });

                    const response = result.response;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    session.state.userFriendlyParams = result.userFriendlyParams;
                    session.state.priceCalculated = result.priceCalculated || false;
                    session.state.currentField = result.currentField || null;
                    session.state.color = result.color || session.state.color;
                    session.state.colorCost = result.colorCost || session.state.colorCost;

                    if (result.priceCalculated && result.pricingData) {
                        session.state.pricingData = result.pricingData;
                        session.state.basePrice = result.basePrice || 0;
                        session.state.finalPrice = result.finalPrice || 0;
                    }

                    logger.info(`[LeadAgent] ✅ Parameter update complete, returning response`);
                    return response;
                }

                logger.info(`[LeadAgent] Unclear input, showing addon menu again`);
                const result = await leadAgentGraph.invoke({
                    sessionId,
                    messages: await session.memory.chatHistory.getMessages(),
                    userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                    hasGarageIntent: session.state.hasGarageIntent,
                    priceCalculated: true,
                    currentField: null,
                    validationError: null,
                    response: "",
                    nextStep: "show_addons",
                    stateMapCache: session.stateMapCache || new Map(),
                    roofMapCache: session.roofMapCache || new Map(),
                    pendingUpdates: [],
                    pricingData: session.state.pricingData || null,
                    basePrice: session.state.basePrice || 0,
                    selectedAddons: session.state.selectedAddons || [],
                    finalPrice: session.state.finalPrice || 0,
                    color: session.state.color,
                    colorCost: session.state.colorCost,
                });

                const response = result.response;
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

            const update = await detectParameterUpdateFromInput(input,session.state.currentField || undefined);

            if (update && session.state.currentField) {
                logger.info(
                    `[LeadAgent] 🔄 Parameter update detected: ${update.field} = ${update.value} ` +
                    `(while asking for ${session.state.currentField})`
                );

                try {
                    const { ParameterUpdateServiceImpl } = await import(
                        "@agents/tools/impl/ParameterUpdateServiceImpl"
                        );
                    const { LeadAgentHelpers } = await import("@agents/LeadAgentHelpers");

                    const updateService = ParameterUpdateServiceImpl.getInstance();

                    const processResult = await updateService.process(
                        update,
                        input,
                        session.state.userFriendlyParams,
                        session.stateMapCache || new Map()
                    );

                    if ("error" in processResult) {
                        logger.error(`[LeadAgent] Update processing failed`, processResult.error);

                        const errorResponse = processResult.error.response ||
                            `❌ Could not update ${update.field}. Please try again.`;

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

                        logger.info(
                            `[LeadAgent] ✅ Successfully updated ${update.field}`,
                            session.state.userFriendlyParams
                        );
                    }

                    const missingFields = LeadAgentHelpers.getMissingFields(
                        session.state.userFriendlyParams
                    );

                    logger.info(
                        `[LeadAgent] After update - Missing fields: ${missingFields.length}`,
                        missingFields
                    );

                    let finalResponse: string;

                    if (missingFields.length === 0) {
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

                        finalResponse = graphResult.response;

                        session.state.priceCalculated = graphResult.priceCalculated || false;
                        session.state.pricingData = graphResult.pricingData;
                        session.state.basePrice = graphResult.basePrice || 0;
                        session.state.finalPrice = graphResult.finalPrice || 0;
                        session.state.color = graphResult.color;
                        session.state.colorCost = graphResult.colorCost;

                    } else {
                        const nextField = missingFields[0];
                        session.state.currentField = nextField;

                        logger.info(`[LeadAgent] Next field to collect: ${nextField}`);

                        const { askForFieldNode } = await import("@agents/tools/impl/AskForFieldNode");

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

                        finalResponse = `${result.message}\n\n${fieldResult.response}`;
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
        } catch (error) {
            logger.error(`[LeadAgent] Error:`, error);
            return "❌ An error occurred. Please try again.";
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

    public async endSession(sessionId: string): Promise<void> {
        if (this.sessionManager.endSession(sessionId)) {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
    }

    public async reset(): Promise<void> {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] Full reset complete");
    }
}

function Enforce(): void {}
