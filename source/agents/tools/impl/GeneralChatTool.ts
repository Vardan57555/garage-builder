import { BaseTool } from "@agents/tools/BaseTool";
import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import {BufferMemory} from "langchain/memory";

export class GeneralChatTool extends BaseTool {
    private static instance: GeneralChatTool;
    readonly name = "generalChat";
    readonly description = "Handles general conversation and casual questions.";

    constructor(enforce: () => void) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use GeneralChatTool.getInstance() instead of new."
            );
        }
    }

    public static getInstance(): GeneralChatTool {
        if (!GeneralChatTool.instance) {
            GeneralChatTool.instance = new GeneralChatTool(Enforce);
        }
        return GeneralChatTool.instance;
    }

    public canHandle(input: string): boolean {
        const garageKeywords = /garage|building|width|length|height/i;
        return !garageKeywords.test(input); // Handle everything that is NOT garage/building
    }

    async _call(input: string, memory?: BufferMemory): Promise<string> {
        const isGarageInput = /garage|building|width|length|height/i.test(input);

        if (isGarageInput) {
            return null; // let PriceParamsExtractorTool handle
        }

        // ✅ Get previous conversation messages
        const historyMessages = memory ? await memory.chatHistory.getMessages() : [];

        // ✅ Add new user message to the context
        const messages = [
            ...historyMessages,
            { role: "user", content: input }
        ];

        const response = await sharedLLM.invoke(messages);

        // ✅ Store this turn for next time
        if (memory) {
            memory.chatHistory.addUserMessage(input);
            memory.chatHistory.addAIChatMessage(response.content as string);
        }

        return response.content as string;
    }

}

function Enforce(): void {}
