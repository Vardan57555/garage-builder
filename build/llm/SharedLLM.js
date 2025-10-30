"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedLLM = void 0;
exports.initializeSharedLLM = initializeSharedLLM;
const ollama_1 = require("@langchain/ollama");
const messages_1 = require("@langchain/core/messages");
const Log_1 = require("../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class SharedLLMManager {
    static instance;
    llmClient = null;
    isInitialized = false;
    isInitializing = false;
    config;
    constructor(config) {
        this.config = config;
    }
    static getInstance(config) {
        if (!SharedLLMManager.instance) {
            SharedLLMManager.instance = new SharedLLMManager(config || SharedLLMManager.getDefaultConfig());
        }
        return SharedLLMManager.instance;
    }
    static getDefaultConfig() {
        return {
            model: process.env.OLLAMA_MODEL || "llama3.2:latest",
            temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || "0.2"),
            baseUrl: process.env.OLLAMA_BASE_URL || "http://ollama:11434",
            streaming: process.env.OLLAMA_STREAMING === "true" ? true : false,
            timeout: parseInt(process.env.OLLAMA_TIMEOUT || "30000"),
        };
    }
    async initializeLLM() {
        if (this.isInitialized || this.isInitializing) {
            return;
        }
        this.isInitializing = true;
        try {
            logger.info(`[SharedLLM] Initializing with config - model: ${this.config.model}, temperature: ${this.config.temperature}, baseUrl: ${this.config.baseUrl}`);
            this.llmClient = new ollama_1.ChatOllama({
                model: this.config.model,
                temperature: this.config.temperature,
                streaming: this.config.streaming,
                baseUrl: this.config.baseUrl,
            });
            await this.healthCheck();
            this.isInitialized = true;
            logger.info("[SharedLLM] Model initialized successfully");
        }
        catch (error) {
            this.isInitialized = false;
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`[SharedLLM] Initialization failed (Ollama may not be running): ${errorMessage}`);
            throw error;
        }
        finally {
            this.isInitializing = false;
        }
    }
    async healthCheck() {
        if (!this.llmClient) {
            throw new Error("LLM client not initialized");
        }
        try {
            await this.llmClient.invoke([new messages_1.HumanMessage("ping")]);
            logger.debug("[SharedLLM] Health check passed");
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`[SharedLLM] Health check failed: ${errorMessage}`);
            throw error;
        }
    }
    extractStringContent(response) {
        try {
            if (typeof response.content === "string") {
                return response.content;
            }
            if (Array.isArray(response.content)) {
                return response.content
                    .map((item) => {
                    if (typeof item === "string") {
                        return item;
                    }
                    if (item && typeof item === "object" && "text" in item) {
                        return item.text;
                    }
                    if (item && typeof item === "object") {
                        return JSON.stringify(item);
                    }
                    return String(item);
                })
                    .join("");
            }
            if (response.content && typeof response.content === "object") {
                if ("text" in response.content) {
                    return response.content.text;
                }
                return JSON.stringify(response.content);
            }
            return String(response.content);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.warn(`[SharedLLM] Error extracting content: ${errorMessage}`);
            return JSON.stringify(response.content || "");
        }
    }
    async invoke(messages, options) {
        const maxRetries = options?.retries || 3;
        if (!this.isInitialized && !this.isInitializing) {
            try {
                await this.initializeLLM();
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                logger.error(`[SharedLLM] Auto-initialization failed: ${errorMessage}`);
                throw error;
            }
        }
        while (this.isInitializing) {
            await this.delay(100);
        }
        if (!this.llmClient) {
            throw new Error("LLM client not available");
        }
        let lastError = null;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`[SharedLLM] Invoking LLM (attempt ${attempt}/${maxRetries})`);
                const response = await this.llmClient.invoke(messages);
                const content = this.extractStringContent(response);
                logger.debug("[SharedLLM] Response received successfully");
                return content;
            }
            catch (error) {
                lastError = error;
                const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
                logger.warn(`[SharedLLM] Attempt ${attempt}/${maxRetries} failed: ${errorMessage}`);
                if (attempt < maxRetries) {
                    const delayMs = Math.pow(2, attempt - 1) * 1000;
                    logger.info(`[SharedLLM] Retrying after ${delayMs}ms delay`);
                    await this.delay(delayMs);
                }
            }
        }
        throw lastError || new Error("LLM invocation failed after all retries");
    }
    isReady() {
        return this.isInitialized && this.llmClient !== null;
    }
    getStatus() {
        return {
            initialized: this.isInitialized,
            initializing: this.isInitializing,
        };
    }
    shutdown() {
        this.llmClient = null;
        this.isInitialized = false;
        logger.info("[SharedLLM] Shutdown complete");
    }
    delay(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
exports.sharedLLM = SharedLLMManager.getInstance();
async function initializeSharedLLM(config) {
    try {
        logger.info("[SharedLLM] Starting preload");
        await exports.sharedLLM.invoke([new messages_1.HumanMessage("ping")]);
        logger.info("[SharedLLM] Model preloaded successfully");
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.warn(`[SharedLLM] Preload failed (Ollama may not be running yet). Error: ${errorMessage}. Model will load on first request`);
    }
}
(async () => {
    try {
        await exports.sharedLLM.invoke([new messages_1.HumanMessage("ping")]);
        logger.info("[SharedLLM] Model preloaded");
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.warn(`[SharedLLM] Preload failed (maybe not running yet). Error: ${errorMessage}. Model will load on first request`);
    }
})();
//# sourceMappingURL=SharedLLM.js.map