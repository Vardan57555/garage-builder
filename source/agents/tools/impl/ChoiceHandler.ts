import {ChoiceOption, ChoiceResult, FieldConfig} from "@agents/tools/io/IChoiceHandler";
import {Constants} from "@common/io/Constants";
import { IChoiceHandler } from "@agents/tools/impl/io/IChoiceHandler";
import { ChoiceParser } from "@agents/tools/impl/ChoiceParser";
import {ChoiceFormatter} from "@agents/tools/impl/ChoiceFormatter";
import {ChoiceRegistry} from "@agents/tools/impl/ChoiceRegistry";


/**
 * ChoiceHandler: High-level API for user choice parsing and validation
 * Delegates to specialized components for parsing, formatting, and registry
 */
export class ChoiceHandler implements IChoiceHandler
{
    private parser: ChoiceParser;
    private registry: ChoiceRegistry;

    constructor(customFields?: FieldConfig[])
    {
        this.parser = new ChoiceParser();
        this.registry = new ChoiceRegistry(customFields || Constants.DEFAULT_FIELDS);
    }

    /**
     * Parses user input for a given field with LLM fallback
     */
    public async parseUserChoiceWithAI(userInput: string, options: ChoiceOption[], context: string = ""): Promise<ChoiceResult>
    {
        return this.parser.parse(userInput, options, context);
    }

    /**
     * Generates complete prompt for field
     */
    public getPrompt(field: string, customOptions?: ChoiceOption[]): string
    {
        const options: ChoiceOption[] = customOptions || this.registry.getOptions(field);
        return ChoiceFormatter.generatePrompt(field, options);
    }
}

