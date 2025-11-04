import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { RedisCacheUtils } from "@utils/cache/RedisCacheUtils";
import { SessionManager } from "@utils/session/SessionManager";
import {GraphAddon, LeadAgentSessionMetadata, UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { leadAgentGraph } from "@agents/LeadAgentGraph";
import {
    detectParameterUpdateFromInput,
    detectResetIntent
} from "@agents/tools/impl/DetectionHelpers";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";

const logger: pino.Logger = createLogger(module);

export class LeadAgent {
    private static instance: LeadAgent;
    private sessionManager: SessionManager;

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

    /**
     * Main entry point - FIXED routing
     */
    public async run(sessionId: string, input: string): Promise<string> {
        logger.info(`[LeadAgent] Session ${sessionId} - Input: ${input}`);

        try {
            const session = this.getOrCreateSession(sessionId);
            await session.memory.chatHistory.addUserMessage(input);

            if (detectResetIntent(input)) {
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
                };
                return response;
            }

            if (session.state.priceCalculated) {
                logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);
                logger.info(`[LeadAgent] Session basePrice: $${session.state.basePrice}`);

                const userInput = input.toLowerCase().trim();

                // ✅ FIX #1: Check if user DECLINED addons FIRST
                if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
                    logger.info(`[LeadAgent] User declined addons, calculating final price`);

                    const basePrice = session.state.basePrice || 0;
                    const params = session.state.userFriendlyParams;

                    const sqft = (params.width || 0) * (params.length || 0);
                    const laborCost = basePrice * 0.5;
                    const foundationCost = sqft * 8.5;
                    const deliveryCost = 750;
                    const contingency = (basePrice + laborCost + foundationCost + deliveryCost) * 0.05;
                    const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency;

                    logger.info(`[LeadAgent] Price breakdown:`);
                    logger.info(`  - Base kit: $${basePrice.toFixed(2)}`);
                    logger.info(`  - Labor: $${laborCost.toFixed(2)}`);
                    logger.info(`  - Foundation: $${foundationCost.toFixed(2)}`);
                    logger.info(`  - Delivery: $${deliveryCost.toFixed(2)}`);
                    logger.info(`  - Contingency: $${contingency.toFixed(2)}`);
                    logger.info(`  - FINAL TOTAL: $${finalTotal.toFixed(2)}`);

                    const currentParams = LeadAgentHelpers.formatCurrentParams(params);

                    const response = `✅ **FINAL PRICE QUOTE**

${currentParams}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **DETAILED PRICE BREAKDOWN:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Building Kit & Materials:**
• Base Building Package: $${basePrice.toFixed(2)}

**Installation & Construction:**
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **What's Included:**
  • Building kit and all materials
  • Professional installation labor
  • Foundation slab preparation (concrete)
  • Delivery & site preparation
  • 5% contingency for unforeseen costs

📞 **Next Steps:**
Contact us to finalize your order and discuss:
  • Custom modifications
  • Financing options
  • Installation timeline
  • Warranty details

🔧 **Want to modify anything?**
(e.g., "change width to 30", "make it 3 cars")
Or say **"start over"** to create a new quote.`;

                    await session.memory.chatHistory.addAIChatMessage(response);
                    session.state.finalPrice = finalTotal;
                    return response;
                }

                // ✅ FIX #2: Check if user is ADDING addons (BEFORE parameter extraction)
                const isAddonRequest = this.detectAddonRequest(userInput);

                if (isAddonRequest) {
                    logger.info(`[LeadAgent] ✅ Detected addon request: "${userInput}"`);
                    logger.info(`[LeadAgent] Routing directly to addon processing (NOT parameter extraction)`);

                    try {
                        // Get the addon menu
                        const addonsMenu = await this.getAddonsMenuFromDatabase();

                        if (!addonsMenu || addonsMenu.length === 0) {
                            logger.error(`[LeadAgent] No addons menu available`);
                            return `❌ Error: Addon options not available`;
                        }

                        // Parse addon selections directly
                        const selectedAddons = this.parseAddonSelections(userInput, addonsMenu);

                        if (selectedAddons.length === 0) {
                            logger.warn(`[LeadAgent] No addons matched`);
                            return `I couldn't understand which addons you want. Please try:\n• "2 windows"\n• "add 1 door and 3 braces"\n• "no" to skip addons`;
                        }

                        // Calculate final price WITH addons
                        const basePrice = session.state.basePrice || 0;
                        const params = session.state.userFriendlyParams;

                        const sqft = (params.width || 0) * (params.length || 0);
                        const laborCost = basePrice * 0.5;
                        const foundationCost = sqft * 8.5;
                        const deliveryCost = 750;
                        const addonTotal = selectedAddons.reduce((sum, addon) => sum + (addon.cost || 0), 0);
                        const contingency = (basePrice + laborCost + foundationCost + deliveryCost + addonTotal) * 0.05;
                        const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency + addonTotal;

                        logger.info(`[LeadAgent] ✅ Selected ${selectedAddons.length} addons`);
                        logger.info(`[LeadAgent] ✅ Addon total: $${addonTotal.toFixed(2)}`);
                        logger.info(`[LeadAgent] ✅ Final with addons: $${finalTotal.toFixed(2)}`);

                        const response = this.formatFinalPriceWithAddons(
                            params,
                            basePrice,
                            selectedAddons,
                            addonTotal,
                            finalTotal,
                            laborCost,
                            foundationCost,
                            deliveryCost,
                            contingency,
                            sqft
                        );

                        await session.memory.chatHistory.addAIChatMessage(response);
                        session.state.selectedAddons = selectedAddons;
                        session.state.finalPrice = finalTotal;
                        return response;
                    } catch (error) {
                        logger.error(`[LeadAgent] Error processing addons:`, error);
                        return `❌ Error processing addons. Please try again or say "no" to skip.`;
                    }
                }

                // ✅ If not addon request and not declined, check for parameter updates
                const update = await detectParameterUpdateFromInput(input);
                if (update) {
                    logger.info(`[LeadAgent] User modified parameter: ${update.field}`);

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
                    });

                    const response = result.response;
                    await session.memory.chatHistory.addAIChatMessage(response);

                    session.state.userFriendlyParams = result.userFriendlyParams;
                    session.state.priceCalculated = result.priceCalculated || false;

                    if (result.priceCalculated && result.pricingData) {
                        session.state.pricingData = result.pricingData;
                        session.state.basePrice = result.basePrice || 0;
                        session.state.finalPrice = result.finalPrice || 0;
                        logger.info(`[LeadAgent] ✅ Updated pricing data after parameter change`);
                    }

                    return response;
                }

                // Default: show addon menu again
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
                });

                const response = result.response;
                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            // INITIAL QUOTE FLOW
            logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

            const update = await detectParameterUpdateFromInput(input);

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
            });

            const response = result.response;
            await session.memory.chatHistory.addAIChatMessage(response);

            session.state.userFriendlyParams = result.userFriendlyParams;
            session.state.hasGarageIntent = result.hasGarageIntent;
            session.state.priceCalculated = result.priceCalculated || false;
            session.state.currentField = result.currentField;
            session.stateMapCache = result.stateMapCache;
            session.roofMapCache = result.roofMapCache;

            if (result.priceCalculated && result.pricingData) {
                session.state.pricingData = result.pricingData;
                session.state.basePrice = result.basePrice || 0;
                session.state.selectedAddons = result.selectedAddons || [];
                session.state.finalPrice = result.finalPrice || 0;

                logger.info(`[LeadAgent] ✅ Saved pricing data to session`);
            }

            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error:`, error);
            return "❌ An error occurred. Please try again.";
        }
    }

    // ✅ NEW METHOD: Detect if input is addon request
    private detectAddonRequest(input: string): boolean {
        const addonPatterns = [
            /\b(add|also|and)\s+(\d+\s+)?(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?/i,
            /\b(\d+)\s+(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?/i,
        ];

        const isAddon = addonPatterns.some(pattern => pattern.test(input));
        logger.info(`[LeadAgent.detectAddonRequest] Input: "${input}" → isAddon: ${isAddon}`);
        return isAddon;
    }

    // ✅ NEW METHOD: Parse addon selections from user input
    private parseAddonSelections(userInput: string, addonsMenu: any[]): any[] {
        const selected: any[] = [];
        const quantityPattern = /(?:add|also|and)?\s*(\d+)\s+(window|door|walkin|walk.?in|brace|anchor|cupola|truss)s?/gi;
        const quantityMatches = [...userInput.matchAll(quantityPattern)];

        logger.info(`[LeadAgent.parseAddonSelections] Found ${quantityMatches.length} addon matches`);

        quantityMatches.forEach((match, idx) => {
            const quantity = parseInt(match[1], 10);
            const keyword = match[2].toLowerCase();

            logger.info(`[LeadAgent.parseAddonSelections] Match ${idx}: quantity=${quantity}, keyword=${keyword}`);

            const matchingAddons = addonsMenu.filter(addon => {
                const type = addon.type?.toLowerCase() || "";
                const label = addon.label?.toLowerCase() || "";
                return type.includes(keyword) || label.includes(keyword);
            });

            logger.info(`[LeadAgent.parseAddonSelections] Found ${matchingAddons.length} addons for keyword "${keyword}"`);

            for (let i = 0; i < quantity && i < matchingAddons.length; i++) {
                selected.push(matchingAddons[i]);
                logger.info(`[LeadAgent.parseAddonSelections] Added: ${matchingAddons[i].label} ($${matchingAddons[i].cost})`);
            }
        });

        logger.info(`[LeadAgent.parseAddonSelections] Total selected: ${selected.length} addons`);
        return selected;
    }

    // ✅ NEW METHOD: Get addons menu from database
    private async getAddonsMenuFromDatabase(): Promise<any[]> {
        try {
            const { getAddonsWithCache, getLimitedAddonsByType } =
                await import("@agents/tools/impl/AddonDatabaseService");

            logger.info(`[LeadAgent.getAddonsMenuFromDatabase] Fetching addons...`);
            const allAddons = await getAddonsWithCache();
            logger.info(`[LeadAgent.getAddonsMenuFromDatabase] Found ${allAddons.length} total addons`);

            const limited = getLimitedAddonsByType(allAddons, 10);
            logger.info(`[LeadAgent.getAddonsMenuFromDatabase] Limited to ${limited.length} addons`);

            return limited.map(addon => ({
                id: addon.id,
                label: addon.label,
                type: addon.type,
                cost: addon.cost,
                description: addon.description || "",
            }));
        } catch (error) {
            logger.error(`[LeadAgent.getAddonsMenuFromDatabase] Error:`, error);
            throw error;
        }
    }

    // ✅ NEW METHOD: Format final price with addons
    private formatFinalPriceWithAddons(
        params: any,
        basePrice: number,
        selectedAddons: any[],
        addonTotal: number,
        finalTotal: number,
        laborCost: number,
        foundationCost: number,
        deliveryCost: number,
        contingency: number,
        sqft: number
    ): string {
        const currentParams = LeadAgentHelpers.formatCurrentParams(params);

        let response = `✅ **FINAL PRICE QUOTE WITH ADD-ONS**

${currentParams}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 **DETAILED PRICE BREAKDOWN:**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Building Kit & Materials:**
• Base Building Package: $${basePrice.toFixed(2)}

**Installation & Construction:**
• Installation Labor (50% of kit): $${laborCost.toFixed(2)}
• Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
• Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
• Contingency & Misc (5%): $${contingency.toFixed(2)}`;

        if (selectedAddons.length > 0) {
            response += `

**Selected Add-ons:** ✅ ADDONS INCLUDED!`;
            selectedAddons.forEach((addon) => {
                response += `\n  • ${addon.label}: $${(addon.cost || 0).toFixed(2)}`;
            });
            response += `\n\nAdd-ons Total: +$${addonTotal.toFixed(2)}`;
        }

        response += `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💰 **FINAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}** ✅ WITH ${selectedAddons.length} ADD-ONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ **What's Included:**
  • Building kit and all materials
  • Professional installation labor
  • Foundation slab preparation (concrete)
  • Delivery & site preparation
  • ${selectedAddons.length} add-on(s) selected
  • 5% contingency for unforeseen costs

📞 **Next Steps:**
Contact us to finalize your order and discuss:
  • Custom modifications
  • Financing options
  • Installation timeline
  • Warranty details

🔧 **Want to modify anything?**
(e.g., "change width to 30", "add more windows")
Or say **"start over"** to create a new quote.`;

        return response;
    }

    private getOrCreateSession(sessionId: string): LeadAgentSessionMetadata {
        const existing: any = this.sessionManager.getSession(sessionId);

        if (existing && this.sessionManager.isSessionValid(sessionId)) {
            this.sessionManager.updateLastActivity(sessionId);
            return existing as LeadAgentSessionMetadata;
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
                priceCalculated: false,
                pricingData: null,
                basePrice: 0,
                selectedAddons: [] as GraphAddon[],
                finalPrice: 0,
            },
            stateMapCache: new Map(),
            roofMapCache: new Map(),
        };

        this.sessionManager.createSession(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
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
