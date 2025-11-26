import {LeadAgentStateType} from "@agents/LeadAgentState";
import {BuildingTypeMatch, BuildingTypeNodeResponse} from "@agents/tools/io/IDetectBuilding";

export interface IBuildingTypeDetectionNode
{
    createAlreadySetResponse(): BuildingTypeNodeResponse

    createDetectedResponse(type: string, confidence: string): BuildingTypeNodeResponse

    createNotDetectedResponse(): BuildingTypeNodeResponse

    createErrorResponse(error: any): BuildingTypeNodeResponse

    getLastMessage(state: LeadAgentStateType): string | null

    detect(userInput: string): BuildingTypeMatch | null

    isValidType(type: string): boolean

    execute(state: LeadAgentStateType): Promise<BuildingTypeNodeResponse>
}
