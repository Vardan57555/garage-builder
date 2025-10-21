import { ChatOllama } from "@langchain/ollama";
import {HumanMessage} from "@langchain/core/messages";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);
export const sharedLLM = new ChatOllama({
    model: "llama3.2:latest",
    temperature: 0.2,
    streaming: false,
    baseUrl: "http://ollama:11434"
});

(async () =>
{
    try
    {
        await sharedLLM.invoke([new HumanMessage("ping")]);
        logger.info("✅ Model preloaded");
    }
    catch (err)
    {
        logger.warn("⚠️ Ollama preload failed (maybe not running yet). The model will load on first request.");
    }
})();

