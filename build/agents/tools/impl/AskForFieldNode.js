"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.askForFieldNode = void 0;
const ChoiceHandler_1 = require("../../tools/impl/ChoiceHandler");
const LeadAgentHelpers_1 = require("../../LeadAgentHelpers");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
const choiceManager = new ChoiceHandler_1.GenericChoiceManager();
const askForFieldNode = async (state) => {
    logger.info(`[AskNode] Session ${state.sessionId} - Field: ${state.currentField}`);
    if (!state.currentField) {
        logger.warn(`[AskNode] No currentField set!`);
        const missing = LeadAgentHelpers_1.LeadAgentHelpers.getMissingFields(state.userFriendlyParams);
        if (missing.length > 0) {
            logger.info(`[AskNode] Setting field to: ${missing[0]}`);
            return {
                currentField: missing[0],
                userFriendlyParams: state.userFriendlyParams,
                nextStep: "ask_for_field",
            };
        }
        return {
            response: "Error: All fields complete",
            nextStep: "calculate_price",
        };
    }
    let promptMessage = "";
    const currentParams = LeadAgentHelpers_1.LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
    switch (state.currentField) {
        case "width":
            promptMessage = `${currentParams}\n\n📏 What **width** (feet)?\n(e.g., 20, 24, 30)`;
            break;
        case "length":
            promptMessage = `${currentParams}\n\n📏 What **length** (feet)?\n(e.g., 25, 30, 40)`;
            break;
        case "height":
            promptMessage = `${currentParams}\n\n📏 What **height** (feet)?\n(e.g., 10, 12)`;
            break;
        case "state_name":
            promptMessage = `${currentParams}\n\n🗺️ Which **state**?\n(e.g., Texas, California)`;
            break;
        case "roof_type":
            promptMessage = choiceManager.getPrompt("roof_type");
            break;
        case "gauge":
            promptMessage = `${currentParams}\n\n📊 What **gauge**?\n(e.g., 14GA, 16GA, 18GA, 20GA)`;
            break;
        case "building_type":
            promptMessage = choiceManager.getPrompt("building_type");
            break;
        default:
            promptMessage = `${currentParams}\n\nProvide: ${LeadAgentHelpers_1.LeadAgentHelpers.formatFieldName(state.currentField)}`;
    }
    logger.info(`[AskNode] Prompting for: ${state.currentField}`);
    return {
        response: promptMessage,
        userFriendlyParams: state.userFriendlyParams,
        currentField: state.currentField,
        nextStep: "__end__",
    };
};
exports.askForFieldNode = askForFieldNode;
//# sourceMappingURL=AskForFieldNode.js.map