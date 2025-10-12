import { Tool } from "langchain/tools";

export interface ToolInterface
{
    name: string;
    description: string;

    _call(input: string): Promise<string>;
}

export abstract class BaseTool extends Tool implements ToolInterface
{
    abstract readonly name: string;
    abstract readonly description: string;

    abstract _call(input: string): Promise<string>;
}

