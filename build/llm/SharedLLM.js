"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedLLM = void 0;
const ollama_1 = require("@langchain/ollama");
const messages_1 = require("@langchain/core/messages");
const Log_1 = require("../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
exports.sharedLLM = new ollama_1.ChatOllama({
    model: "llama3.2:latest",
    temperature: 0.2,
    streaming: false,
    baseUrl: "http://ollama:11434"
});
(async () => {
    try {
        await exports.sharedLLM.invoke([new messages_1.HumanMessage("ping")]);
        logger.info("✅ Model preloaded");
    }
    catch (err) {
        logger.warn("⚠️ Ollama preload failed (maybe not running yet). The model will load on first request.");
    }
})();
//# sourceMappingURL=SharedLLM.js.map