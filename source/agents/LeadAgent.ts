import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { RedisCacheUtils } from "@utils/cache/RedisCacheUtils";
import { SessionManager } from "@utils/session/SessionManager";
import {GraphAddon, LeadAgentSessionMetadata, UserFriendlyParams} from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { leadAgentGraph } from "@agents/LeadAgentGraph";
import {
    detectAddonSelectionFromInput,
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

            // ✅ NEW FIX: If price already calculated, check for ADDON selection FIRST
            if (session.state.priceCalculated) {
                logger.info(`[LeadAgent] POST-PRICE PHASE - priceCalculated: true`);

                // ✅ Check if this is an ADDON selection
                const addonSelection = detectAddonSelectionFromInput(input);

                if (addonSelection) {
                    logger.info(`[LeadAgent] Detected addon selection:`, addonSelection);

                    // ✅ Go directly to process_addons
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

                    // ✅ Store results back in session
                    session.state.selectedAddons = result.selectedAddons || [];
                    session.state.finalPrice = result.finalPrice || 0;

                    logger.info(`[LeadAgent] Addon processing completed`);
                    return response;
                }

                // ✅ Only check for parameter updates if NOT addon selection
                logger.info(`[LeadAgent] Not an addon selection, checking for parameter update`);
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

                    // ✅ Update session with new state
                    session.state.userFriendlyParams = result.userFriendlyParams;
                    session.state.priceCalculated = result.priceCalculated || false;

                    return response;
                }

                // ✅ If neither addon nor parameter update
                logger.info(`[LeadAgent] No addon or parameter update detected, showing current state`);
                const currentParams = LeadAgentHelpers.formatCurrentParams(session.state.userFriendlyParams);
                const response = `${currentParams}\n\nI didn't understand that. Would you like to:\n• Add optional features? (e.g., "add 2 windows", "add door")\n• Change a parameter? (e.g., "change width to 25")\n• Start over? (e.g., "new quote")`;

                await session.memory.chatHistory.addAIChatMessage(response);
                return response;
            }

            // ============================================================
            // INITIAL QUOTE FLOW (Before first price calculation)
            // ============================================================
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

            // ✅ Update session with new state
            session.state.userFriendlyParams = result.userFriendlyParams;
            session.state.hasGarageIntent = result.hasGarageIntent;
            session.state.priceCalculated = result.priceCalculated || false;
            session.state.currentField = result.currentField;
            session.stateMapCache = result.stateMapCache;
            session.roofMapCache = result.roofMapCache;

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
                selectedAddons: [] as GraphAddon[],  // ✅ CHANGED: Use GraphAddon
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
