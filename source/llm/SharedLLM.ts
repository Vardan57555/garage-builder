import { ChatOllama } from "@langchain/ollama";
import { HumanMessage, BaseMessage } from "@langchain/core/messages";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * Configuration interface for LLM settings
 */
interface LLMConfig {
    model: string;
    temperature: number;
    baseUrl: string;
    streaming: boolean;
    timeout: number;
}

/**
 * LLM Initialization Manager
 * Handles:
 * - Lazy initialization (only when first needed)
 * - Connection pooling and reuse
 * - Automatic retry logic
 * - Health monitoring
 */
class SharedLLMManager {
    private static instance: SharedLLMManager;
    private llmClient: ChatOllama | null = null;
    private isInitialized: boolean = false;
    private isInitializing: boolean = false;
    private config: LLMConfig;

    private constructor(config: LLMConfig) {
        this.config = config;
    }

    /**
     * Get or create singleton instance
     */
    public static getInstance(config?: LLMConfig): SharedLLMManager {
        if (!SharedLLMManager.instance) {
            SharedLLMManager.instance = new SharedLLMManager(
                config || SharedLLMManager.getDefaultConfig()
            );
        }
        return SharedLLMManager.instance;
    }

    /**
     * Default configuration with environment variable overrides
     */
    private static getDefaultConfig(): LLMConfig {
        return {
            model: process.env.OLLAMA_MODEL || "llama3.2:latest",
            temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || "0.2"),
            baseUrl: process.env.OLLAMA_BASE_URL || "http://ollama:11434",
            streaming: process.env.OLLAMA_STREAMING === "true" ? true : false,
            timeout: parseInt(process.env.OLLAMA_TIMEOUT || "30000"),
        };
    }

    /**
     * Initialize the LLM client
     */
    private async initializeLLM(): Promise<void> {
        if (this.isInitialized || this.isInitializing) {
            return;
        }

        this.isInitializing = true;

        try {
            logger.info("[SharedLLM] Initializing with config:", {
                model: this.config.model,
                temperature: this.config.temperature,
                baseUrl: this.config.baseUrl,
            });

            this.llmClient = new ChatOllama({
                model: this.config.model,
                temperature: this.config.temperature,
                streaming: this.config.streaming,
                baseUrl: this.config.baseUrl,
            });

            await this.healthCheck();
            this.isInitialized = true;
            logger.info("✅ [SharedLLM] Model initialized successfully");
        } catch (error) {
            this.isInitialized = false;
            logger.warn(
                "⚠️ [SharedLLM] Initialization failed (Ollama may not be running):",
                error instanceof Error ? error.message : error
            );
            throw error;
        } finally {
            this.isInitializing = false;
        }
    }

    /**
     * Verify LLM is responding
     */
    private async healthCheck(): Promise<void> {
        if (!this.llmClient) {
            throw new Error("LLM client not initialized");
        }

        try {
            await this.llmClient.invoke([new HumanMessage("ping")]);
            logger.debug("[SharedLLM] Health check passed");
        } catch (error) {
            logger.warn("[SharedLLM] Health check failed");
            throw error;
        }
    }

    /**
     * Extract string content from LangChain message response
     * Handles various content types safely
     */
    private extractStringContent(response: any): string {
        try {
            // If content is already a string
            if (typeof response.content === "string") {
                return response.content;
            }

            // If content is an array (could be mixed types)
            if (Array.isArray(response.content)) {
                return response.content
                    .map((item: any) => {
                        // Handle string items
                        if (typeof item === "string") {
                            return item;
                        }

                        // Handle text content objects
                        if (item && typeof item === "object" && "text" in item) {
                            return item.text;
                        }

                        // For other object types, convert to string
                        if (item && typeof item === "object") {
                            return JSON.stringify(item);
                        }

                        // Fallback for primitives
                        return String(item);
                    })
                    .join("");
            }

            // If content is an object but not an array
            if (response.content && typeof response.content === "object") {
                // Try to extract text field
                if ("text" in response.content) {
                    return response.content.text;
                }

                // Fallback to JSON stringify
                return JSON.stringify(response.content);
            }

            // Last resort: convert to string
            return String(response.content);
        } catch (error) {
            logger.warn("[SharedLLM] Error extracting content:", error);
            return JSON.stringify(response.content || "");
        }
    }

    /**
     * Invoke LLM with automatic initialization and retry logic
     */
    public async invoke(
        messages: BaseMessage[],
        options?: { retries?: number }
    ): Promise<string> {
        const maxRetries = options?.retries || 3;

        // Auto-initialize if needed
        if (!this.isInitialized && !this.isInitializing) {
            try {
                await this.initializeLLM();
            } catch (error) {
                logger.error("[SharedLLM] Auto-initialization failed");
                throw error;
            }
        }

        // Wait for initialization if in progress
        while (this.isInitializing) {
            await this.delay(100);
        }

        if (!this.llmClient) {
            throw new Error("LLM client not available");
        }

        let lastError: Error | null = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                logger.debug(`[SharedLLM] Invoking (attempt ${attempt}/${maxRetries})`);

                const response = await this.llmClient.invoke(messages);
                const content = this.extractStringContent(response);

                logger.debug("[SharedLLM] Response received successfully");
                return content;
            } catch (error) {
                lastError = error as Error;
                logger.warn(
                    `[SharedLLM] Attempt ${attempt}/${maxRetries} failed:`,
                    lastError.message
                );

                if (attempt < maxRetries) {
                    // Exponential backoff: 1s, 2s, 4s
                    const delayMs = Math.pow(2, attempt - 1) * 1000;
                    logger.info(`[SharedLLM] Retrying in ${delayMs}ms...`);
                    await this.delay(delayMs);
                }
            }
        }

        throw lastError || new Error("LLM invocation failed after all retries");
    }

    /**
     * Check if LLM is ready to use
     */
    public isReady(): boolean {
        return this.isInitialized && this.llmClient !== null;
    }

    /**
     * Get initialization status
     */
    public getStatus(): { initialized: boolean; initializing: boolean } {
        return {
            initialized: this.isInitialized,
            initializing: this.isInitializing,
        };
    }

    /**
     * Graceful shutdown
     */
    public shutdown(): void {
        this.llmClient = null;
        this.isInitialized = false;
        logger.info("[SharedLLM] Shutdown complete");
    }

    /**
     * Utility: delay helper
     */
    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Export singleton manager
 * Use sharedLLM.invoke() to call the LLM
 */
export const sharedLLM = SharedLLMManager.getInstance();

/**
 * Async initialization hook
 * Call this in your application startup
 */
export async function initializeSharedLLM(
    config?: Partial<LLMConfig>
): Promise<void> {
    try {
        logger.info("[SharedLLM] Starting preload...");
        await sharedLLM.invoke([new HumanMessage("ping")]);
        logger.info("✅ [SharedLLM] Model preloaded successfully");
    } catch (error) {
        logger.warn(
            "⚠️ [SharedLLM] Preload failed (Ollama may not be running yet).",
            "The model will load automatically on first request."
        );
    }
}

/**
 * IIFE: Attempt preload on module load (optional, for backwards compatibility)
 * Remove this if you prefer explicit initialization
 */
(async () => {
    try {
        await sharedLLM.invoke([new HumanMessage("ping")]);
        logger.info("✅ [SharedLLM] Model preloaded");
    } catch (err) {
        logger.warn(
            "⚠️ [SharedLLM] Preload failed (maybe not running yet). The model will load on first request."
        );
    }
})();
