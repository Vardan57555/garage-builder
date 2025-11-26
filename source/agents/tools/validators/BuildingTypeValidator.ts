import {BuildingTypeMatch} from "@agents/tools/io/IDetectBuilding";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {BuildingTypeDetectionNode} from "@agents/tools/impl/BuildingTypeDetectionNode";
const logger: pino.Logger = createLogger(module);

/**
 * BuildingTypeValidator: Validates state and detection results
 */
export class BuildingTypeValidator
{
    /**
     * Checks if building type already detected
     */

    static isAlreadySet(state: LeadAgentStateType): boolean
    {
        return !!state.userFriendlyParams?.building_type;
    }

    /**
     * Extracts user input from state messages
     */
    static getUserInput(state: LeadAgentStateType): string | null
    {
        if (!state.messages || state.messages.length === 0)
        {
            logger.warn("[BuildingTypeValidator] No messages in state");
            return null;
        }

        const userInput: string = BuildingTypeDetectionNode.getInstance().getLastMessage(state);

        if (!userInput)
        {
            logger.warn("[BuildingTypeValidator] Last message has no text content");
            return null;
        }

        return userInput;
    }

    /**
     * Validates match before using
     */
    static isValidMatch(match: BuildingTypeMatch | null): match is BuildingTypeMatch
    {
        if (!match)
        {
            return false;
        }

        if (!BuildingTypeDetectionNode.getInstance().isValidType(match.type))
        {
            logger.warn(`[BuildingTypeValidator] Invalid building type detected: ${match.type}`);
            return false;
        }

        return true;
    }
}
