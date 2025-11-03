import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export function setupLangSmith(): void {
    process.env.LANGCHAIN_TRACING_V2 = "true";
    process.env.LANGCHAIN_API_KEY = process.env.LANGSMITH_API_KEY || "";
    process.env.LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || "garage-quotes-production";

    logger.info("[LangSmith] ✅ Tracing enabled");
    logger.info(`[LangSmith] Project: ${process.env.LANGCHAIN_PROJECT}`);
    logger.info("[LangSmith] API Key configured:", process.env.LANGSMITH_API_KEY ? "✅ Yes" : "❌ Not found");
    logger.info("[LangSmith] Visit: https://smith.langchain.com to view traces");

    if (!process.env.LANGSMITH_API_KEY) {
        logger.warn("[LangSmith] ⚠️  No LANGSMITH_API_KEY set. Get one from https://smith.langchain.com");
    }
}
