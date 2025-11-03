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

            // ✅ FIX: Detect reset first
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
                // ✅ FIX: Reset with all properties
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
                logger.info(`[LeadAgent] Session basePrice: $${session.state.basePrice}`); // ✅ DEBUG LOG

                // ✅ Get user input
                const userInput = input.toLowerCase().trim();

                // ✅ Check if user is trying to skip/decline addons
                if (/(no|skip|none|without|don't|nope|nah)/i.test(userInput)) {
                    logger.info(`[LeadAgent] User declined addons, showing final price`);

                    const basePrice = session.state.basePrice || 0;

                    // ✅ DEBUG: Log what we're working with
                    logger.info(`[LeadAgent] Using basePrice: $${basePrice}`);
                    logger.info(`[LeadAgent] Width: ${session.state.userFriendlyParams.width}, Length: ${session.state.userFriendlyParams.length}`);

                    const sqft = session.state.userFriendlyParams.width! * session.state.userFriendlyParams.length!;
                    const laborCost = basePrice * 0.5;
                    const foundationCost = sqft * 8.5;
                    const deliveryCost = 750;
                    const contingency = (basePrice + laborCost + foundationCost + deliveryCost) * 0.05;
                    const finalTotal = basePrice + laborCost + foundationCost + deliveryCost + contingency;

                    const currentParams = LeadAgentHelpers.formatCurrentParams(session.state.userFriendlyParams);
                    const response = `✅ **FINAL PRICE QUOTE**

${currentParams}

---

📊 **Price Breakdown:**
- Base Building: $${basePrice.toFixed(2)}
- Installation Labor (50% of kit): $${laborCost.toFixed(2)}
- Concrete Foundation (${sqft} sq ft @ $8.50/sq ft): $${foundationCost.toFixed(2)}
- Delivery & Site Preparation: $${deliveryCost.toFixed(2)}
- Contingency & Misc (5%): $${contingency.toFixed(2)}

---

💰 **TOTAL ESTIMATED PRICE: $${finalTotal.toFixed(2)}**

---

📝 This includes:
  • Building kit and materials
  • Installation labor
  • Foundation slab preparation
  • Delivery & site preparation

🔧 Want to modify anything? (e.g., "change width to 30", "add more windows")
Or **start over** to create a new quote.`;

                    await session.memory.chatHistory.addAIChatMessage(response);
                    session.state.finalPrice = finalTotal;
                    return response;
                }

                // ✅ Check if user is trying to add addons (e.g., "add windows", "1, 2, 3")
                const addonKeywords = /(add|window|door|brace|anchor|cupola|\d+)/i;
                if (addonKeywords.test(userInput)) {
                    logger.info(`[LeadAgent] User provided addon input: "${userInput}"`);

                    const result = await leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                        hasGarageIntent: session.state.hasGarageIntent,
                        priceCalculated: true,
                        currentField: null,
                        validationError: null,
                        response: "",
                        nextStep: "process_addons",
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

                    // ✅ SAVE addon processing results
                    session.state.selectedAddons = result.selectedAddons || [];
                    session.state.finalPrice = result.finalPrice || 0;

                    logger.info(`[LeadAgent] Addon processing completed`);
                    return response;
                }

                // ✅ Check for parameter updates (e.g., "change width to 25")
                logger.info(`[LeadAgent] Checking for parameter updates`);
                const update = await detectParameterUpdateFromInput(input);

                if (update) {
                    logger.info(`[LeadAgent] Detected parameter update: ${update.field}=${update.value}`);

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

                    // ✅ SAVE update results
                    session.state.userFriendlyParams = result.userFriendlyParams;
                    session.state.priceCalculated = result.priceCalculated || false;

                    // ✅ CRITICAL: If price was recalculated, save new pricing data
                    if (result.priceCalculated && result.pricingData) {
                        session.state.pricingData = result.pricingData;
                        session.state.basePrice = result.basePrice || 0;
                        session.state.finalPrice = result.finalPrice || 0;
                        logger.info(`[LeadAgent] ✅ Updated pricing data after parameter change`);
                        logger.info(`  - New basePrice: $${session.state.basePrice}`);
                    }

                    return response;
                }

                // ✅ If unclear, show addon menu again
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

            logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

            // ✅ Detect parameter update
            const update = await detectParameterUpdateFromInput(input);

            logger.info(`[LeadAgent] Update detected:`, update ? `${update.field}=${update.value}` : "none");

            let nextStep: string | null = null;
            nextStep = update ? "handle_update" : null;

            const result = await leadAgentGraph.invoke({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                hasGarageIntent: session.state.hasGarageIntent,
                priceCalculated: session.state.priceCalculated || false,
                currentField: (session.state.currentField as keyof UserFriendlyParams) || null,
                validationError: null,
                response: "",
                nextStep: nextStep,
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

                logger.info(`[LeadAgent] ✅ Saved pricing data to session:`);
                logger.info(`  - basePrice: $${session.state.basePrice}`);
                logger.info(`  - finalPrice: $${session.state.finalPrice}`);
                logger.info(`  - pricingData keys: ${Object.keys(result.pricingData || {}).join(', ')}`);
            }

            logger.info(`[LeadAgent] Response sent, state updated`);
            return response;
        } catch (error) {
            logger.error(`[LeadAgent] Error:`, error);
            return "❌ An error occurred. Please try again.";
        }
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
