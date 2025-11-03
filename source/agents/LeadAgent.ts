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

            // ✅ CHECK FOR RESET FIRST
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

            // ✅ POST-PRICE PHASE (user already got a quote)
            if (session.state.priceCalculated) {
                logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);
                logger.info(`[LeadAgent] Session basePrice: $${session.state.basePrice}`);

                const userInput = input.toLowerCase().trim();

                if (/(no|skip|none|without|don't|nope|nah)/i.test(userInput)) {
                    logger.info(`[LeadAgent] User declined addons, showing final price`);
                    const basePrice = session.state.basePrice || 0;
                    // ... format final price response
                    const response = `Final price: $${basePrice}`;
                    await session.memory.chatHistory.addAIChatMessage(response);
                    return response;
                }

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
                    session.state.selectedAddons = result.selectedAddons || [];
                    session.state.finalPrice = result.finalPrice || 0;
                    return response;
                }

                // Check for parameter updates in POST-PRICE phase
                const update = await detectParameterUpdateFromInput(input);
                if (update) {
                    logger.info(`[LeadAgent] Detected parameter update in POST-PRICE: ${update.field}=${update.value}`);
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
                    }
                    return response;
                }

                return "Please select add-ons or type 'no' to finish.";
            }

            // ✅ INITIAL QUOTE FLOW (user hasn't gotten a quote yet)
            logger.info(`[LeadAgent] INITIAL QUOTE FLOW - priceCalculated: false`);

            // ✅ KEY FIX: Check for parameter updates FIRST
            // If user provides an update, route directly to handle_update, skip extraction
            const update = await detectParameterUpdateFromInput(input);

            if (update) {
                logger.info(`[LeadAgent] ✅ Parameter update detected: ${update.field}=${update.value}`);
                logger.info(`[LeadAgent] Routing directly to handle_update (BYPASS extraction)`);

                const result = await leadAgentGraph.invoke({
                    sessionId,
                    messages: await session.memory.chatHistory.getMessages(),
                    userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                    hasGarageIntent: session.state.hasGarageIntent,
                    priceCalculated: false,
                    currentField: null,
                    validationError: null,
                    response: "",
                    nextStep: "handle_update",  // ✅ DIRECTLY to handle_update
                    stateMapCache: session.stateMapCache || new Map(),
                    roofMapCache: session.roofMapCache || new Map(),
                    pendingUpdates: [update],  // ✅ Pass the detected update
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
                }

                return response;
            }

            // No parameter update detected, proceed with normal flow
            logger.info(`[LeadAgent] No parameter update, proceeding with normal flow`);

            const result = await leadAgentGraph.invoke({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams as Partial<UserFriendlyParams>,
                hasGarageIntent: session.state.hasGarageIntent,
                priceCalculated: false,
                currentField: session.state.currentField as keyof UserFriendlyParams || null,
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
            }

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
