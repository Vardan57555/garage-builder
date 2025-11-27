import {FieldUpdate, ProcessUpdateResult, UpdateResult} from "@agents/tools/io/IParameterUpdate";
import {UserFriendlyParams} from "@agents/tools/io/IChat";

export interface ParameterUpdateService
{
    process(update: FieldUpdate, userInput: string, currentParams: Partial<UserFriendlyParams>, stateMapCache: Map<string, any>): Promise<| { result: UpdateResult; resolvedValue: any } | { error: ProcessUpdateResult }>

    apply(currentParams: Partial<UserFriendlyParams>, field: keyof UserFriendlyParams, value: any): UpdateResult
}
