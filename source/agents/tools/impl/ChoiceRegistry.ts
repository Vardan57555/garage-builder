import {IChoiceRegistry} from "@agents/tools/impl/io/IChoiceHandler";
import {ChoiceOption, FieldConfig} from "@agents/tools/io/IChoiceHandler";

/**
 * ChoiceRegistry: Manages field-option mappings with validation
 */
export class ChoiceRegistry implements IChoiceRegistry
{
    private configs: Map<string, FieldConfig>;

    constructor(configs: FieldConfig[])
    {
        this.configs = new Map(configs.map(c => [c.name, c]));
    }

    /**
     * Retrieves options for field, throws if not found
     */
    public getOptions(field: string): ChoiceOption[]
    {
        const config: FieldConfig = this.configs.get(field);

        if (!config)
        {
            throw new Error(`No options configured for field: ${field}`);
        }

        return config.options;
    }
}
