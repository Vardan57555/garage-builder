import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {BuildingTypeMatch, BuildingTypeNodeResponse} from "@agents/tools/io/IDetectBuilding";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import { BuildingTypeValidator } from "@agents/tools/validators/BuildingTypeValidator";
import {Constants} from "@common/io/Constants";
import {InstantiationError} from "@errors/InstantiationError";
import {IBuildingTypeDetectionNode} from "@agents/tools/impl/io/IBuildingTypeDetectionNode";

const logger: pino.Logger = createLogger(module);

/**
 * BuildingTypeNodeState: Manages state transitions and response creation
 */

export class BuildingTypeDetectionNode implements IBuildingTypeDetectionNode
{
    private static instance: IBuildingTypeDetectionNode;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonServiceImpl.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of AddonService.
     *
     * @returns The singleton instance of AddonService.
     */

    public static getInstance(): IBuildingTypeDetectionNode
    {
        if(!BuildingTypeDetectionNode.instance)
        {
            BuildingTypeDetectionNode.instance = new BuildingTypeDetectionNode(Enforce);
        }

        return BuildingTypeDetectionNode.instance;
    }

    /**
     * Response when building type already detected
     */

    public createAlreadySetResponse(): BuildingTypeNodeResponse
    {
        logger.info("[BuildingTypeNodeState] Building type already set");
        return { nextStep: "extract_parameters" };
    }

    /**
     * Response when building type successfully detected
     */

    public createDetectedResponse(type: string, confidence: string): BuildingTypeNodeResponse
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

    public createNotDetectedResponse(): BuildingTypeNodeResponse
    {
        logger.info("[BuildingTypeNodeState] No building type detected");
        return { nextStep: "extract_parameters" };
    }

    /**
     * Response for error scenarios
     */

    public createErrorResponse(error: any): BuildingTypeNodeResponse
    {
        logger.error("[BuildingTypeNodeState] Error during detection:", error);
        return { nextStep: "extract_parameters" };
    }

    /**
     * Executes building type detection node
     */

    public async execute(state: LeadAgentStateType): Promise<BuildingTypeNodeResponse>
    {
        logger.info("[BuildingTypeNodeManager] Starting building type detection");

        try
        {
            if (BuildingTypeValidator.isAlreadySet(state))
            {
                return this.createAlreadySetResponse();
            }

            const userInput: string = BuildingTypeValidator.getUserInput(state);
            if (!userInput)
            {
                return this.createNotDetectedResponse();
            }

            const match: BuildingTypeMatch = this.detect(userInput);

            if (!BuildingTypeValidator.isValidMatch(match))
            {
                return this.createNotDetectedResponse();
            }

            return this.createDetectedResponse(match.type, match.confidence);
        }
        catch (error)
        {
            return this.createErrorResponse(error);
        }
    }

    /**
     * Extracts last message content from state
     */

    public getLastMessage(state: LeadAgentStateType): string | null
    {
        const lastMessage = state.messages[state.messages.length - 1];
        return typeof lastMessage?.content === "string" ? lastMessage.content : null;
    }

    /**
     * Detects building type from user input
     */

    public detect(userInput: string): BuildingTypeMatch | null
    {
        if (!userInput?.trim())
        {
            return null;
        }

        const lowerInput: string = userInput.toLowerCase();

        for (const { pattern, type, confidence } of Constants.DETECTION_PATTERNS)
        {
            if (pattern.test(lowerInput))
            {
                return {type, confidence, matchedPattern: pattern.source,};
            }
        }

        return null;
    }

    /**
     * Validates building type is known
     */

    public isValidType(type: string): boolean
    {
        const validTypes: string[] = ["garage", "shed", "barn"];
        return validTypes.includes(type.toLowerCase());
    }
}


/**
 * Function to enforce the Singleton pattern.
 */

function Enforce(): void
{
}

/**
 * NODE: Detects building type from initial user input
 *
 * @param state - Lead agent state containing messages and parameters
 * @returns Node response with optional detected building type
 */
export const detectBuildingTypeNode = async (state: LeadAgentStateType): Promise<BuildingTypeNodeResponse> =>
{
    return BuildingTypeDetectionNode.getInstance().execute(state);
};
