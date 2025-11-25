import {ILLMResponseHandler} from "@agents/tools/io/IParameterExtractionNode";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";

export class LLMResponseHandler implements ILLMResponseHandler
{
    private readonly codeIndicators: string[] = [
        "def ",
        "import ",
        "function ",
        "const ",
        "pattern ",
        "regex",
    ];

    async extractLLMResponse(userInput: string, prompt: string): Promise<string>
    {
        const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);

        if (this.containsCode(response))
        {
            throw new Error("LLM returned code instead of JSON");
        }

        return response;
    }

    private containsCode(response: string): boolean
    {
        return this.codeIndicators.some((indicator) => response.includes(indicator));
    }
}
