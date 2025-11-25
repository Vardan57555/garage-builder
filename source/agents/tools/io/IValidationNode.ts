import { ValidationResult } from "@agents/tools/impl/io/IValidation";
import {LeadAgentStateType} from "@agents/LeadAgentState";

export interface IFieldValidationOrchestrator
{
    validate(state: LeadAgentStateType): Promise<ValidationResult>;
}
