"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgent = void 0;
const memory_1 = require("langchain/memory");
const InstantiationError_1 = require("../errors/InstantiationError");
const RedisCacheUtils_1 = require("../utils/cache/RedisCacheUtils");
const SessionManager_1 = require("../utils/session/SessionManager");
const Log_1 = require("../utils/logger/Log");
const LeadAgentGraph_1 = require("./LeadAgentGraph");
const DetectionHelpers_1 = require("./tools/impl/DetectionHelpers");
const LeadAgentHelpers_1 = require("./LeadAgentHelpers");
const logger = (0, Log_1.createLogger)(module);
class LeadAgent {
    static instance;
    sessionManager;
    constructor(enforce, cacheUtils) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }
        this.sessionManager = SessionManager_1.SessionManager.getInstance({
            SESSION_TIMEOUT: 30 * 60 * 1000,
            CLEANUP_INTERVAL: 5 * 60 * 1000,
            WARNING_THRESHOLD: 5 * 60 * 1000,
        });
    }
    static async getInstance() {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce, RedisCacheUtils_1.RedisCacheUtils.getInstance());
        }
        return LeadAgent.instance;
    }
    async run(sessionId, input) {
        logger.info(`[LeadAgent] Session ${sessionId} - Input: ${input}`);
        try {
            const session = this.getOrCreateSession(sessionId);
            await session.memory.chatHistory.addUserMessage(input);
            if ((0, DetectionHelpers_1.detectResetIntent)(input)) {
                logger.info(`[LeadAgent] Reset intent detected`);
                const result = await LeadAgentGraph_1.leadAgentGraph.invoke({
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
                if (/(no|skip|none|without|don't|nope|nah|nothing)/i.test(userInput)) {
                    logger.info(`[LeadAgent] User declined addons, routing to visualization`);
                    const result = await LeadAgentGraph_1.leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams,
                        hasGarageIntent: session.state.hasGarageIntent,
                        priceCalculated: true,
                        currentField: null,
                        validationError: null,
                        response: "",
                        nextStep: "generate_visualization",
                        stateMapCache: session.stateMapCache || new Map(),
                        roofMapCache: session.roofMapCache || new Map(),
                        pendingUpdates: [],
                        pricingData: session.state.pricingData || null,
                        basePrice: session.state.basePrice || 0,
                        selectedAddons: [],
                        finalPrice: session.state.basePrice || 0,
                    });
                    const response = result.response;
                    await session.memory.chatHistory.addAIChatMessage(response);
                    session.state.finalPrice = result.finalPrice || session.state.basePrice || 0;
                    return response;
                }
                const isAddonRequest = this.detectAddonRequest(userInput);
                if (isAddonRequest) {
                    logger.info(`[LeadAgent] ✅ Detected addon request: "${userInput}"`);
                    logger.info(`[LeadAgent] Routing directly to addon processing (NOT parameter extraction)`);
                    try {
                        const addonsMenu = await this.getAddonsMenuFromDatabase();
                        if (!addonsMenu || addonsMenu.length === 0) {
                            logger.error(`[LeadAgent] No addons menu available`);
                            return `❌ Error: Addon options not available`;
                        }
                        const selectedAddons = this.parseAddonSelections(userInput, addonsMenu);
                        if (selectedAddons.length === 0) {
                            logger.warn(`[LeadAgent] No addons matched`);
                            return `I couldn't understand which addons you want. Please try:\n• "2 windows"\n• "add 1 door and 3 braces"\n• "no" to skip addons`;
                        }
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
                        const response = this.formatFinalPriceWithAddons(params, basePrice, selectedAddons, addonTotal, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft);
                        await session.memory.chatHistory.addAIChatMessage(response);
                        session.state.selectedAddons = selectedAddons;
                        session.state.finalPrice = finalTotal;
                        return response;
                    }
                    catch (error) {
                        logger.error(`[LeadAgent] Error processing addons:`, error);
                        return `❌ Error processing addons. Please try again or say "no" to skip.`;
                    }
                }
                const update = await (0, DetectionHelpers_1.detectParameterUpdateFromInput)(input);
                if (update) {
                    logger.info(`[LeadAgent] User modified parameter: ${update.field}`);
                    const result = await LeadAgentGraph_1.leadAgentGraph.invoke({
                        sessionId,
                        messages: await session.memory.chatHistory.getMessages(),
                        userFriendlyParams: session.state.userFriendlyParams,
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
                logger.info(`[LeadAgent] Unclear input, showing addon menu again`);
                const result = await LeadAgentGraph_1.leadAgentGraph.invoke({
                    sessionId,
                    messages: await session.memory.chatHistory.getMessages(),
                    userFriendlyParams: session.state.userFriendlyParams,
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
            const update = await (0, DetectionHelpers_1.detectParameterUpdateFromInput)(input);
            const result = await LeadAgentGraph_1.leadAgentGraph.invoke({
                sessionId,
                messages: await session.memory.chatHistory.getMessages(),
                userFriendlyParams: session.state.userFriendlyParams,
                hasGarageIntent: session.state.hasGarageIntent,
                priceCalculated: session.state.priceCalculated || false,
                currentField: session.state.currentField || null,
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
        }
        catch (error) {
            logger.error(`[LeadAgent] Error:`, error);
            return "❌ An error occurred. Please try again.";
        }
    }
    detectAddonRequest(input) {
        const addonPatterns = [
            /\b(add|also|and)\s+(\d+\s+)?(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?/i,
            /\b(\d+)\s+(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?/i,
        ];
        const isAddon = addonPatterns.some(pattern => pattern.test(input));
        logger.info(`[LeadAgent.detectAddonRequest] Input: "${input}" → isAddon: ${isAddon}`);
        return isAddon;
    }
    parseAddonSelections(userInput, addonsMenu) {
        const selected = [];
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
    async getAddonsMenuFromDatabase() {
        try {
            const { getAddonsWithCache, getLimitedAddonsByType } = await Promise.resolve().then(() => __importStar(require("./tools/impl/AddonDatabaseService")));
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
        }
        catch (error) {
            logger.error(`[LeadAgent.getAddonsMenuFromDatabase] Error:`, error);
            throw error;
        }
    }
    formatFinalPriceWithAddons(params, basePrice, selectedAddons, addonTotal, finalTotal, laborCost, foundationCost, deliveryCost, contingency, sqft) {
        const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(params);
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
    getOrCreateSession(sessionId) {
        const existing = this.sessionManager.getSession(sessionId);
        if (existing && this.sessionManager.isSessionValid(sessionId)) {
            this.sessionManager.updateLastActivity(sessionId);
            return existing;
        }
        const newSession = {
            sessionId,
            createdAt: Date.now(),
            lastActivity: Date.now(),
            expiresAt: Date.now() + 30 * 60 * 1000,
            memory: new memory_1.BufferMemory({
                memoryKey: "chat_history",
                returnMessages: true,
                chatHistory: new memory_1.ChatMessageHistory(),
            }),
            state: {
                userFriendlyParams: {},
                hasGarageIntent: false,
                priceCalculated: false,
                pricingData: null,
                basePrice: 0,
                selectedAddons: [],
                finalPrice: 0,
            },
            stateMapCache: new Map(),
            roofMapCache: new Map(),
        };
        this.sessionManager.createSession(sessionId, newSession);
        logger.info(`[LeadAgent] New session created: ${sessionId}`);
        return newSession;
    }
    async endSession(sessionId) {
        if (this.sessionManager.endSession(sessionId)) {
            logger.info(`[LeadAgent] Session ended: ${sessionId}`);
        }
    }
    async reset() {
        this.sessionManager.destroy();
        logger.info("[LeadAgent] Full reset complete");
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map