import {BuildingTypeMatch} from "@agents/tools/io/IDetectBuilding";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import {Constants} from "@common/io/Constants";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * BuildingTypeDetector: Identifies building type from user input using pattern matching
 */
export class BuildingTypeDetector
{

    /**
     * Extracts last message content from state
     */

    static getLastMessage(state: LeadAgentStateType): string | null
    {
        const lastMessage = state.messages[state.messages.length - 1];
        return typeof lastMessage?.content === "string" ? lastMessage.content : null;
    }

    /**
     * Detects building type from user input
     */

    static detect(userInput: string): BuildingTypeMatch | null
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

    static isValidType(type: string): boolean
    {
        const validTypes: string[] = ["garage", "shed", "barn"];
        return validTypes.includes(type.toLowerCase());
    }
}

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

        const userInput: string = BuildingTypeDetector.getLastMessage(state);

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

        if (!BuildingTypeDetector.isValidType(match.type))
        {
            logger.warn(`[BuildingTypeValidator] Invalid building type detected: ${match.type}`);
            return false;
        }

        return true;
    }
}
