import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {BuildingTypeNodeResponse} from "@agents/tools/io/IDetectBuilding";

const logger: pino.Logger = createLogger(module);

/**
 * BuildingTypeNodeState: Manages state transitions and response creation
 */

export class BuildingTypeNodeState
{
    /**
     * Response when building type already detected
     */

    static createAlreadySetResponse(): BuildingTypeNodeResponse
    {
        logger.info("[BuildingTypeNodeState] Building type already set");
        return { nextStep: "extract_parameters" };
    }

    /**
     * Response when building type successfully detected
     */

    static createDetectedResponse(type: string, confidence: string): BuildingTypeNodeResponse
    {
        logger.info(`[BuildingTypeNodeState] Detected: ${type} (confidence: ${confidence})`);
        return {
            userFriendlyParams: { building_type: type },
            response: `✓ Got it - you're looking for a ${type}!`,
            nextStep: "extract_parameters",
        };
    }

    /**
     * Response when no building type detected
     */

    static createNotDetectedResponse(): BuildingTypeNodeResponse
    {
        logger.info("[BuildingTypeNodeState] No building type detected");
        return { nextStep: "extract_parameters" };
    }

    /**
     * Response for error scenarios
     */

    static createErrorResponse(error: any): BuildingTypeNodeResponse
    {
        logger.error("[BuildingTypeNodeState] Error during detection:", error);
        return { nextStep: "extract_parameters" };
    }
}
