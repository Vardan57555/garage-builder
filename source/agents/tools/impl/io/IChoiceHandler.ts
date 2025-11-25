import {ChoiceOption, ChoiceResult} from "@agents/tools/io/IChoiceHandler";
import {UserFriendlyParams} from "@agents/tools/io/IChat";

export interface IChoiceService
{
    parse(userInput: string, options: ChoiceOption[], context?: string): Promise<ChoiceResult>;

    getOptions(field: string): ChoiceOption[];

    parseUserChoiceWithAI(userInput: string, options: ChoiceOption[], context?: string): Promise<ChoiceResult>;

    getPrompt(field: string, customOptions?: ChoiceOption[]): string;

    getPrompt(field: string, customOptions?: ChoiceOption[]): string;

    resolve(field: keyof UserFriendlyParams, value: any): Promise<any>

    handleChoice(field: string, userInput: string, customOptions?: ChoiceOption[]): Promise<ChoiceResult>;

    getPrompt(field: string, customOptions?: ChoiceOption[]): string;
}
