import { ChatOllama } from "@langchain/ollama";
import {HumanMessage} from "@langchain/core/messages";

export const sharedLLM = new ChatOllama({
    model: "llama3.2:latest",
    temperature: 0.2,
    streaming: true,
    baseUrl: "http://ollama:11434"
});

(async () =>
{
    try
    {
        await sharedLLM.invoke([new HumanMessage("ping")]);
        console.log("✅ Model preloaded");
    }
    catch (err)
    {
        console.warn("⚠️ Ollama preload failed (maybe not running yet). The model will load on first request.");
    }
})();

