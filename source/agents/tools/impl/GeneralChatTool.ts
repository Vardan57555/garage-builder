import { BaseTool } from "@agents/tools/BaseTool";
import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";

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

    async _call(input: string): Promise<string> {
        const isGarageInput = /garage|building|width|length|height/i.test(input);

        if (isGarageInput) {
            // let PriceParamsExtractorTool handle
            return null;
        }

        const prompt = `You are a helpful AI assistant. Respond naturally:\n${input}`;
        const response = await sharedLLM.invoke([{ role: "user", content: prompt }]);
        return response.content as string;
    }
}

function Enforce(): void {}
