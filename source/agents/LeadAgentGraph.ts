import { StateGraph } from "@langchain/langgraph";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { detectGarageIntentNode } from "@agents/IntentDetectionNode";
import { detectBuildingTypeNode } from "@agents/tools/impl/DetectBuildingTypeNode";
import { extractParametersNode } from "@agents/tools/impl/ParameterExtractionNode";
import { checkMissingFieldsNode } from "@agents/tools/impl/ValidationNode";
import { askForFieldNode } from "@agents/tools/impl/AskForFieldNode";
import { calculatePriceNode } from "@agents/tools/impl/PriceCalculationNode";
import { handleParameterUpdateNode } from "@agents/tools/impl/ParameterUpdateNode";
import { handleResetNode } from "@agents/tools/impl/ResetNode";
import { showAddonsNode } from "@agents/tools/impl/ShowAddonsNode";
import { processAddonsSelectionNode } from "@agents/tools/impl/ProcessAddonsNode";
import { LeadAgentState } from "@agents/LeadAgentState";

const logger: pino.Logger = createLogger(module);

export function buildLeadAgentGraph() {
    logger.info("[LeadAgentGraph] Building conversation graph");

    const workflow = new StateGraph(LeadAgentState)
        .addNode("detect_intent", detectGarageIntentNode)
        .addNode("detect_building_type", detectBuildingTypeNode)
        .addNode("extract_parameters", extractParametersNode)
        .addNode("check_missing_fields", checkMissingFieldsNode)
        .addNode("ask_for_field", askForFieldNode)
        .addNode("calculate_price", calculatePriceNode)
        .addNode("show_addons", showAddonsNode)
        .addNode("process_addons", processAddonsSelectionNode)  // ✅ This node processes "skip" OR addon selections
        .addNode("handle_update", handleParameterUpdateNode)
        .addNode("handle_reset", handleResetNode)

        // ✅ START
        .addEdge("__start__", "detect_intent")

        // ✅ DETECT_INTENT → Extract or End
        .addConditionalEdges(
            "detect_intent",
            (state) => {
                logger.debug(`[detect_intent] nextStep=${state.nextStep}, intent=${state.hasGarageIntent}`);
                if (state.nextStep) return state.nextStep;
                return state.hasGarageIntent ? "extract_parameters" : "__end__";
            },
            {
                "extract_parameters": "extract_parameters",
                "detect_building_type": "detect_building_type",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ DETECT_BUILDING_TYPE → Extract Parameters
        .addConditionalEdges(
            "detect_building_type",
            (state) => {
                logger.debug(`[detect_building_type] nextStep=${state.nextStep}`);
                return state.nextStep || "extract_parameters";
            },
            {
                "extract_parameters": "extract_parameters",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ EXTRACT_PARAMETERS → Check Missing or Handle Update
        .addConditionalEdges(
            "extract_parameters",
            (state) => {
                logger.debug(`[extract_parameters] nextStep=${state.nextStep}`);
                return state.nextStep || "check_missing_fields";
            },
            {
                "check_missing_fields": "check_missing_fields",
                "ask_for_field": "ask_for_field",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ CHECK_MISSING_FIELDS → Calculate, Ask, or Update
        .addConditionalEdges(
            "check_missing_fields",
            (state) => {
                logger.debug(`[check_missing_fields] nextStep=${state.nextStep}, missing=${!state.currentField}`);
                return state.nextStep || (state.currentField ? "ask_for_field" : "calculate_price");
            },
            {
                "calculate_price": "calculate_price",
                "ask_for_field": "ask_for_field",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ ASK_FOR_FIELD → Wait for user input
        .addEdge("ask_for_field", "__end__")

        // ✅ CALCULATE_PRICE → Show Addons
        .addConditionalEdges(
            "calculate_price",
            (state) => {
                logger.debug(`[calculate_price] nextStep=${state.nextStep}`);
                return state.nextStep || "show_addons";
            },
            {
                "show_addons": "show_addons",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ SHOW_ADDONS → Go to PROCESS_ADDONS (NOT END!)
        // This is the KEY FIX - when user responds to addon menu, it goes to process_addons
        .addConditionalEdges(
            "show_addons",
            (state) => {
                logger.debug(`[show_addons] nextStep=${state.nextStep}`);
                return state.nextStep || "__end__";  // First time: wait for user (END)
            },
            {
                "process_addons": "process_addons",  // ✅ User responds → process it
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ PROCESS_ADDONS → End (after showing final price)
        .addConditionalEdges(
            "process_addons",
            (state) => {
                logger.debug(`[process_addons] nextStep=${state.nextStep}`);
                return state.nextStep || "__end__";
            },
            {
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        // ✅ HANDLE_UPDATE → Can go to multiple places
        .addConditionalEdges(
            "handle_update",
            (state) => {
                logger.debug(`[handle_update] nextStep=${state.nextStep}`);
                return state.nextStep || "check_missing_fields";
            },
            {
                "check_missing_fields": "check_missing_fields",
                "calculate_price": "calculate_price",
                "show_addons": "show_addons",
                "ask_for_field": "ask_for_field",
                "__end__": "__end__",
            }
        )

        // ✅ HANDLE_RESET → Back to start
        .addConditionalEdges(
            "handle_reset",
            (state) => {
                logger.debug(`[handle_reset] nextStep=${state.nextStep}`);
                return state.nextStep || "detect_intent";
            },
            {
                "detect_intent": "detect_intent",
                "__end__": "__end__",
            }
        );

    const compiled = workflow.compile();
    logger.info("[LeadAgentGraph] ✅ Graph compiled successfully");
    return compiled;
}

export const leadAgentGraph = buildLeadAgentGraph();
