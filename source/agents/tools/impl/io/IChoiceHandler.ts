import {ChoiceOption, ChoiceResult} from "@agents/tools/io/IChoiceHandler";

export interface IChoiceParser
{
    parse(userInput: string, options: ChoiceOption[], context?: string): Promise<ChoiceResult>;
}

export interface IChoiceRegistry
{
    /**
     * Retrieves options for a specific field.
     * Throws an error if field is not registered.
     */
    getOptions(field: string): ChoiceOption[];
}


export interface IChoiceHandler
{
    /**
     * Parses user input for a given field with LLM fallback.
     */
    parseUserChoiceWithAI(userInput: string, options: ChoiceOption[], context?: string): Promise<ChoiceResult>;

    /**
     * Generates a complete user-facing prompt for a field.
     */
    getPrompt(field: string, customOptions?: ChoiceOption[]): string;
}


export interface IGenericChoiceManager {
    /**
     * Handles user choice for a specific field.
     */
    handleChoice(field: string, userInput: string, customOptions?: ChoiceOption[]): Promise<ChoiceResult>;

    /**
     * Returns a user-facing prompt for a specific field.
     */
    getPrompt(field: string, customOptions?: ChoiceOption[]): string;
}
