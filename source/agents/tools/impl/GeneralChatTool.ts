import { BaseTool } from "@agents/tools/BaseTool";
import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import {BufferMemory} from "langchain/memory";
import {AIMessageChunk, BaseMessage} from "@langchain/core/messages";

export class GeneralChatTool extends BaseTool
{
    /**
     * The singleton instance of `GeneralChatTool`.
     * @private
     */

    private static instance: GeneralChatTool;

    /**
     * The unique name identifier for the `GeneralChatTool`.
     * Used internally to distinguish this tool within the agent system.
     */

    readonly name = "generalChat";

    /**
     * Describes the purpose of the `GeneralChatTool`.
     */

    readonly description = "Handles general conversation and casual questions.";

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */

    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use GeneralChatTool.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of GeneralChatTool.
     *
     * @returns The singleton instance of GeneralChatTool.
     */

    public static getInstance(): GeneralChatTool
    {
        if (!GeneralChatTool.instance)
        {
            GeneralChatTool.instance = new GeneralChatTool(Enforce);
        }
        return GeneralChatTool.instance;
    }

    /**
     * Determines if the input string contains keywords related to garages/buildings.
     * Returns true if any relevant keyword is found, false otherwise.
     */

    public canHandle(input: string): boolean
    {
        const garageKeywords = /garage|building|width|length|height/i;
        console.log(!garageKeywords.test(input))
        return !garageKeywords.test(input);
    }

    /**
     * Handles user input: checks for garage-related keywords, retrieves chat history,
     * invokes the AI model to generate a response, updates memory if provided, and returns
     * the AI-generated string.
     */

    async _call(input: string, memory?: BufferMemory): Promise<string> {
        const isGarageInput = /garage|building|width|length|height/i.test(input);

        if (isGarageInput) {
            return null; // let LeadAgent handle garage inputs
        }

        const historyMessages: BaseMessage[] = memory ? await memory.chatHistory.getMessages() : [];

        const messages = [
            ...historyMessages,
            { role: "user", content: input }
        ];

        try {
            const response: AIMessageChunk = await sharedLLM.invoke(messages);

            if (memory) {
                memory.chatHistory.addUserMessage(input);
                memory.chatHistory.addAIChatMessage(response.content as string);
            }

            return response.content as string;
        } catch (e) {
            console.error("GeneralChatTool invoke failed:", e);
            return "⚠️ AI service failed. Please try again.";
        }
    }
}

function Enforce(): void {}
