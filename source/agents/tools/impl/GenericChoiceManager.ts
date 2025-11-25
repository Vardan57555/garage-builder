import {IGenericChoiceManager} from "@agents/tools/impl/io/IChoiceHandler";
import { ChoiceHandler } from "./ChoiceHandler";
import {ChoiceOption, ChoiceResult, FieldConfig} from "@agents/tools/io/IChoiceHandler";
import {Constants} from "@common/io/Constants";
import { ChoiceRegistry } from "./ChoiceRegistry";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

/**
 * GenericChoiceManager: Manager for choice operations across all fields
 * Simplifies API for common choice handling scenarios
 */
export class GenericChoiceManager implements IGenericChoiceManager
{
    private handler: ChoiceHandler;
    private registry: ChoiceRegistry;

    constructor(customFields?: FieldConfig[])
    {
        this.handler = new ChoiceHandler(customFields);
        this.registry = new ChoiceRegistry(customFields || Constants.DEFAULT_FIELDS);
    }

    /**
     * Handles user choice for a specific field
     */
    public async handleChoice(field: string, userInput: string, customOptions?: ChoiceOption[]): Promise<ChoiceResult>
    {
        logger.info(`[GenericChoiceManager] Handling choice for field: ${field}`);
        const options: ChoiceOption[] = customOptions || this.registry.getOptions(field);
        return this.handler.parseUserChoiceWithAI(userInput, options, `User is selecting a value for: ${field}`);
    }

    /**
     * Gets prompt for field
     */
    public getPrompt(field: string, customOptions?: ChoiceOption[]): string
    {
        return this.handler.getPrompt(field, customOptions);
    }
}
