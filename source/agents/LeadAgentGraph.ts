import { StateGraph } from "@langchain/langgraph";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { detectGarageIntentNode } from "@agents/IntentDetectionNode";
import { extractParametersNode } from "@agents/tools/impl/ParameterExtractionNode";
import { askForFieldNode } from "@agents/tools/impl/AskForFieldNode";
import { calculatePriceNode } from "@agents/tools/impl/PriceCalculationNode";
import { handleParameterUpdateNode } from "@agents/tools/impl/ParameterUpdateNode";
import { handleResetNode } from "@agents/tools/impl/ResetNode";
import { generateGarageVisualizationNode } from "@agents/tools/impl/VisualizationNode";
import { LeadAgentState } from "@agents/LeadAgentState";
import {askForColorNode} from "@agents/tools/impl/ColorServiceImpl";
import {processAddonsSelectionNode, showAddonsNode} from "@agents/tools/impl/AddonServiceImpl";
import {checkMissingFieldsNode} from "@agents/tools/validators/FieldValidationOrchestrator";
import {detectBuildingTypeNode} from "@agents/tools/impl/BuildingTypeDetectionNode";

const logger: pino.Logger = createLogger(module);

export function buildLeadAgentGraph() {
    logger.info("[LeadAgentGraph] Building conversation graph");

    const workflow = new StateGraph(LeadAgentState)
        .addNode("detect_intent", detectGarageIntentNode)
        .addNode("detect_building_type", detectBuildingTypeNode)
        .addNode("extract_parameters", extractParametersNode)
        .addNode("check_missing_fields", checkMissingFieldsNode)
        .addNode("ask_for_field", askForFieldNode)
        .addNode("ask_for_color", askForColorNode)
        .addNode("calculate_price", calculatePriceNode)
        .addNode("show_addons", showAddonsNode)
        .addNode("process_addons", processAddonsSelectionNode)
        .addNode("handle_update", handleParameterUpdateNode)
        .addNode("handle_reset", handleResetNode)
        .addNode("generate_visualization", generateGarageVisualizationNode)

        .addEdge("__start__", "detect_intent")

        .addConditionalEdges(
            "detect_intent",
            (state) => {
                logger.debug(`[detect_intent] nextStep=${state.nextStep}, intent=${state.hasGarageIntent}`);
                if (state.nextStep) {
                    logger.info(`[detect_intent] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.hasGarageIntent ? "extract_parameters" : "__end__";
            },
            {
                "extract_parameters": "extract_parameters",
                "detect_building_type": "detect_building_type",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

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

        .addConditionalEdges(
            "check_missing_fields",
            (state) => {
                logger.debug(`[check_missing_fields] nextStep=${state.nextStep}, missing=${!state.currentField}`);
                if (state.nextStep) {
                    logger.info(`[check_missing_fields] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.currentField ? "ask_for_field" : "ask_for_color";
            },
            {
                "ask_for_color": "ask_for_color",
                "ask_for_field": "ask_for_field",
                "calculate_price": "calculate_price",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

        .addEdge("ask_for_field", "__end__")

        .addConditionalEdges(
            "ask_for_color",
            (state) => {
                logger.debug(`[ask_for_color] nextStep=${state.nextStep}, color=${state.color}`);
                return state.nextStep || "calculate_price";
            },
            {
                "calculate_price": "calculate_price",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        .addConditionalEdges(
            "calculate_price",
            (state) => {
                logger.debug(`[calculate_price] nextStep=${state.nextStep}`);
                if (state.nextStep) {
                    logger.info(`[calculate_price] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.nextStep || "show_addons";
            },
            {
                "show_addons": "show_addons",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

        .addConditionalEdges(
            "show_addons",
            (state) => {
                logger.debug(`[show_addons] nextStep=${state.nextStep}`);
                if (state.nextStep) {
                    logger.info(`[show_addons] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.nextStep || "__end__";
            },
            {
                "process_addons": "process_addons",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

        .addConditionalEdges(
            "process_addons",
            (state) => {
                logger.debug(`[process_addons] nextStep=${state.nextStep}`);
                if (state.nextStep) {
                    logger.info(`[process_addons] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.nextStep || "generate_visualization";
            },
            {
                "generate_visualization": "generate_visualization",
                "handle_update": "handle_update",
                "handle_reset": "handle_reset",
                "__end__": "__end__",
            }
        )

        .addEdge("generate_visualization", "__end__")

        .addConditionalEdges(
            "handle_update",
            (state) => {
                logger.debug(`[handle_update] nextStep=${state.nextStep}`);
                if (state.nextStep) {
                    logger.info(`[handle_update] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.nextStep || "check_missing_fields";
            },
            {
                "check_missing_fields": "check_missing_fields",
                "calculate_price": "calculate_price",
                "show_addons": "show_addons",
                "ask_for_field": "ask_for_field",
                "ask_for_color": "ask_for_color",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

        .addConditionalEdges(
            "handle_reset",
            (state) => {
                logger.debug(`[handle_reset] nextStep=${state.nextStep}`);
                if (state.nextStep) {
                    logger.info(`[handle_reset] Using explicit nextStep: ${state.nextStep}`);
                    return state.nextStep;
                }
                return state.nextStep || "detect_intent";
            },
            {
                "detect_intent": "detect_intent",
                "generate_visualization": "generate_visualization",
                "__end__": "__end__",
            }
        )

    const compiled = workflow.compile();
    logger.info("[LeadAgentGraph] ✅ Graph compiled successfully");
    return compiled;
}

export const leadAgentGraph = buildLeadAgentGraph();
