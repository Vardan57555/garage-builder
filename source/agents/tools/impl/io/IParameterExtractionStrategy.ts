import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {ExtractionResult} from "@agents/tools/io/IParameterExtraction";

export interface IParameterExtractionStrategy
{
    buildLockedContext(params: Partial<UserFriendlyParams>): string

    buildExtractionPrompt(field: keyof UserFriendlyParams, userInput: string, lockedContext: string): string

    extractLLMResponse(userInput: string, prompt: string): Promise<string>;

    extract(context: string, baseParams: Record<string, any>): ExtractionResult | null;
}
