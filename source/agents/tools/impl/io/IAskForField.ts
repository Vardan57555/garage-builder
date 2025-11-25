
/**
 * Field prompt configuration interface
 */
export interface FieldPromptConfig
{
    template: string;
    handler?: (params: string) => Promise<string>;
}
