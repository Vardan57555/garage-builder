"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadAgentGraph = void 0;
exports.buildLeadAgentGraph = buildLeadAgentGraph;
const langgraph_1 = require("@langchain/langgraph");
const Log_1 = require("../utils/logger/Log");
const IntentDetectionNode_1 = require("./IntentDetectionNode");
const DetectBuildingTypeNode_1 = require("./tools/impl/DetectBuildingTypeNode");
const ParameterExtractionNode_1 = require("./tools/impl/ParameterExtractionNode");
const ValidationNode_1 = require("./tools/impl/ValidationNode");
const AskForFieldNode_1 = require("./tools/impl/AskForFieldNode");
const PriceCalculationNode_1 = require("./tools/impl/PriceCalculationNode");
const ParameterUpdateNode_1 = require("./tools/impl/ParameterUpdateNode");
const ResetNode_1 = require("./tools/impl/ResetNode");
const ShowAddonsNode_1 = require("./tools/impl/ShowAddonsNode");
const ProcessAddonsNode_1 = require("./tools/impl/ProcessAddonsNode");
const VisualizationNode_1 = require("./tools/impl/VisualizationNode");
const LeadAgentState_1 = require("./LeadAgentState");
const logger = (0, Log_1.createLogger)(module);
function buildLeadAgentGraph() {
    logger.info("[LeadAgentGraph] Building conversation graph");
    const workflow = new langgraph_1.StateGraph(LeadAgentState_1.LeadAgentState)
        .addNode("detect_intent", IntentDetectionNode_1.detectGarageIntentNode)
        .addNode("detect_building_type", DetectBuildingTypeNode_1.detectBuildingTypeNode)
        .addNode("extract_parameters", ParameterExtractionNode_1.extractParametersNode)
        .addNode("check_missing_fields", ValidationNode_1.checkMissingFieldsNode)
        .addNode("ask_for_field", AskForFieldNode_1.askForFieldNode)
        .addNode("calculate_price", PriceCalculationNode_1.calculatePriceNode)
        .addNode("show_addons", ShowAddonsNode_1.showAddonsNode)
        .addNode("process_addons", ProcessAddonsNode_1.processAddonsSelectionNode)
        .addNode("handle_update", ParameterUpdateNode_1.handleParameterUpdateNode)
        .addNode("handle_reset", ResetNode_1.handleResetNode)
        .addNode("generate_visualization", VisualizationNode_1.generateGarageVisualizationNode)
        .addEdge("__start__", "detect_intent")
        .addConditionalEdges("detect_intent", (state) => {
        logger.debug(`[detect_intent] nextStep=${state.nextStep}, intent=${state.hasGarageIntent}`);
        if (state.nextStep)
            return state.nextStep;
        return state.hasGarageIntent ? "extract_parameters" : "__end__";
    }, {
        "extract_parameters": "extract_parameters",
        "detect_building_type": "detect_building_type",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addConditionalEdges("detect_building_type", (state) => {
        logger.debug(`[detect_building_type] nextStep=${state.nextStep}`);
        return state.nextStep || "extract_parameters";
    }, {
        "extract_parameters": "extract_parameters",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addConditionalEdges("extract_parameters", (state) => {
        logger.debug(`[extract_parameters] nextStep=${state.nextStep}`);
        return state.nextStep || "check_missing_fields";
    }, {
        "check_missing_fields": "check_missing_fields",
        "ask_for_field": "ask_for_field",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addConditionalEdges("check_missing_fields", (state) => {
        logger.debug(`[check_missing_fields] nextStep=${state.nextStep}, missing=${!state.currentField}`);
        return state.nextStep || (state.currentField ? "ask_for_field" : "calculate_price");
    }, {
        "calculate_price": "calculate_price",
        "ask_for_field": "ask_for_field",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addEdge("ask_for_field", "__end__")
        .addConditionalEdges("calculate_price", (state) => {
        logger.debug(`[calculate_price] nextStep=${state.nextStep}`);
        return state.nextStep || "show_addons";
    }, {
        "show_addons": "show_addons",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addConditionalEdges("show_addons", (state) => {
        logger.debug(`[show_addons] nextStep=${state.nextStep}`);
        return state.nextStep || "__end__";
    }, {
        "process_addons": "process_addons",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addConditionalEdges("process_addons", (state) => {
        logger.debug(`[process_addons] nextStep=${state.nextStep}`);
        return state.nextStep || "generate_visualization";
    }, {
        "generate_visualization": "generate_visualization",
        "handle_update": "handle_update",
        "handle_reset": "handle_reset",
        "__end__": "__end__",
    })
        .addEdge("generate_visualization", "__end__")
        .addConditionalEdges("handle_update", (state) => {
        logger.debug(`[handle_update] nextStep=${state.nextStep}`);
        return state.nextStep || "check_missing_fields";
    }, {
        "check_missing_fields": "check_missing_fields",
        "calculate_price": "calculate_price",
        "show_addons": "show_addons",
        "ask_for_field": "ask_for_field",
        "__end__": "__end__",
    })
        .addConditionalEdges("handle_reset", (state) => {
        logger.debug(`[handle_reset] nextStep=${state.nextStep}`);
        return state.nextStep || "detect_intent";
    }, {
        "detect_intent": "detect_intent",
        "__end__": "__end__",
    });
    const compiled = workflow.compile();
    logger.info("[LeadAgentGraph] ✅ Graph compiled successfully");
    return compiled;
}
exports.leadAgentGraph = buildLeadAgentGraph();
//# sourceMappingURL=LeadAgentGraph.js.map