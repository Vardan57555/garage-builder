import {LeadAgentStateType} from "@agents/LeadAgentState";
import {ValidationResult} from "@agents/tools/io/IValidation";

export interface IFieldValidationOrchestrator
{
    validate(state: LeadAgentStateType): Promise<ValidationResult>;
}
