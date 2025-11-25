import { LeadAgentStateType } from "@agents/LeadAgentState";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import {BuildingTypeMatch, BuildingTypeNodeResponse } from "@agents/tools/io/IDetectBuilding";
import {BuildingTypeDetector, BuildingTypeValidator} from "@agents/tools/validators/BuildingTypeValidator";
import {BuildingTypeNodeState} from "@agents/tools/impl/BuildingTypeNodeState";
const logger: pino.Logger = createLogger(module);

/**
 * BuildingTypeNodeManager: Orchestrates building type detection workflow
 */

class BuildingTypeNodeManager
{
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
                return BuildingTypeNodeState.createAlreadySetResponse();
            }

            const userInput: string = BuildingTypeValidator.getUserInput(state);
            if (!userInput)
            {
                return BuildingTypeNodeState.createNotDetectedResponse();
            }

            const match: BuildingTypeMatch = BuildingTypeDetector.detect(userInput);

            if (!BuildingTypeValidator.isValidMatch(match))
            {
                return BuildingTypeNodeState.createNotDetectedResponse();
            }

            return BuildingTypeNodeState.createDetectedResponse(match.type, match.confidence);
        }
        catch (error)
        {
            return BuildingTypeNodeState.createErrorResponse(error);
        }
    }
}

const buildingTypeNodeManager = new BuildingTypeNodeManager();

/**
 * NODE: Detects building type from initial user input
 *
 * @param state - Lead agent state containing messages and parameters
 * @returns Node response with optional detected building type
 */
export const detectBuildingTypeNode = async (state: LeadAgentStateType): Promise<BuildingTypeNodeResponse> =>
{
    return buildingTypeNodeManager.execute(state);
};
