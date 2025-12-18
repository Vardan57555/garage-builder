import axios, { AxiosInstance } from "axios";
import {InstantiationError} from "@errors/InstantiationError";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {IComfyUIClient} from "@agents/tools/impl/io/IVisualizationNode";
import {ComfyUIResponse, ComfyUIWorkflow, HealthCheckResult} from "@agents/tools/io/IVisualization";
const logger: pino.Logger = createLogger(module);

/**
 * Handles ComfyUI API communication with enhanced resilience
 */
export class ComfyUIClient implements IComfyUIClient
{
    private axios: AxiosInstance;
    private readonly pollInterval: number = 3000;
    private readonly timeout: number = 600000; // 10 minutes for image generation
    private readonly maxRetries: number = 3; // Reduce from 5 to 3
    private static instance: IComfyUIClient;

    constructor(enforce: () => void, comfyuiUrl: string = "http://127.0.0.1:8188")
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ComfyUIClient.getInstance() instead of new.");
        }

        this.axios = axios.create({
            baseURL: comfyuiUrl,
            timeout: 60000, // Reduce individual request timeout to 60s
            headers: {
                'Connection': 'keep-alive',
                'Keep-Alive': 'timeout=30'
            }
        });
        logger.info(`[ComfyUIClient] Initialized with URL: ${comfyuiUrl}`);
    }

    public static getInstance(comfyuiUrl: string = "http://localhost:8188"): IComfyUIClient
    {
        if(!ComfyUIClient.instance)
        {
            ComfyUIClient.instance = new ComfyUIClient(Enforce, comfyuiUrl);
        }

        return ComfyUIClient.instance;
    }

    /**
     * Queue prompt for processing
     */
    public async queuePrompt(workflow: ComfyUIWorkflow): Promise<string>
    {
        try
        {
            logger.info("[ComfyUIClient] Queueing prompt...");
            const requestBody = {prompt: workflow, client_id: `client_${Date.now()}_${Math.random()}`};

            const response = await this.axios.post<ComfyUIResponse>("/prompt", requestBody);

            if (response.status !== 200)
            {
                throw new Error(`ComfyUI queue failed with status ${response.status}`);
            }

            const promptId: string = response.data.prompt_id;
            logger.info(`[ComfyUIClient] Prompt queued: ${promptId}`);
            return promptId;
        }
        catch (error)
        {
            logger.error("[ComfyUIClient] Queue error:", error.message);

            if (error.response?.data)
            {
                logger.error("[ComfyUIClient] Response data:", JSON.stringify(error.response.data));
            }

            throw error;
        }
    }

    /**
     * Poll for generation completion with retry logic
     */
    public async pollForCompletion(promptId: string): Promise<string>
    {
        const startTime: number = Date.now();
        let consecutiveErrors: number = 0;
        let lastSuccessfulPoll: number = Date.now();

        // Pre-check ComfyUI health before starting polling
        const healthCheck = await this.checkHealth();
        if (!healthCheck.healthy) {
            throw new Error(`ComfyUI server is unhealthy: ${healthCheck.message}`);
        }

        logger.info(`[ComfyUIClient] Starting to poll for prompt: ${promptId}`);

        while (Date.now() - startTime < this.timeout)
        {
            try
            {
                // Add connection check before polling
                const timeSinceLastSuccess = Date.now() - lastSuccessfulPoll;
                if (timeSinceLastSuccess > 30000) { // If no success for 30s, check health
                    const quickHealth = await this.checkHealth();
                    if (!quickHealth.healthy) {
                        throw new Error('ComfyUI server became unhealthy during polling');
                    }
                }

                const response = await this.axios.get(`/history/${promptId}`, {
                    timeout: 30000 // Shorter timeout for individual polls
                });

                // Reset error counter on successful request
                consecutiveErrors = 0;
                lastSuccessfulPoll = Date.now();

                if (response.status === 200 && response.data[promptId])
                {
                    const history = response.data[promptId];

                    if (history.status?.status_str === "error")
                    {
                        const errorMsg = history.status?.messages || "Unknown error";
                        throw new Error(`Generation error: ${errorMsg}`);
                    }

                    if (history.outputs)
                    {
                        for (const output of Object.values(history.outputs))
                        {
                            const nodeOutput = output as any;
                            if (nodeOutput.images?.length > 0)
                            {
                                const filename = nodeOutput.images[0].filename;
                                logger.info(`[ComfyUIClient] Generation complete: ${filename}`);
                                return filename;
                            }
                        }
                    }
                }

                await this.delay(this.pollInterval);
            }
            catch (error)
            {
                if (error instanceof Error && error.message.includes("Generation error"))
                {
                    throw error;
                }

                consecutiveErrors++;
                const elapsedMs = Date.now() - startTime;
                const elapsedSec = Math.round(elapsedMs / 1000);

                logger.warn({
                    err: error,
                    promptId,
                    consecutiveErrors,
                    elapsedSeconds: elapsedSec,
                    message: error instanceof Error ? error.message : String(error)
                }, "[ComfyUIClient] Poll error (will retry)");

                // If too many consecutive errors, fail
                if (consecutiveErrors > this.maxRetries)
                {
                    logger.error(`[ComfyUIClient] Max retries exceeded after ${elapsedSec}s`);
                    throw error;
                }

                // Faster exponential backoff: 3s, 6s, 12s (reduced from 48s max)
                const backoffMs = Math.min(this.pollInterval * Math.pow(2, consecutiveErrors - 1), 12000); // Cap at 12s
                logger.info(`[ComfyUIClient] Retrying in ${backoffMs}ms...`);
                await this.delay(backoffMs);
            }
        }

        throw new Error(`Generation timeout after ${this.timeout}ms`);
    }

    /**
     * Retrieve generated image
     */
    public async getImage(filename: string): Promise<Buffer>
    {
        try
        {
            logger.info(`[ComfyUIClient] Fetching image: ${filename}`);

            const response = await this.axios.get("/view", {
                params: { filename, type: "output" },
                responseType: "arraybuffer",
            });

            if (response.status !== 200)
            {
                throw new Error(`Failed to fetch image: ${response.status}`);
            }

            logger.info("[ComfyUIClient] Image retrieved successfully");
            return Buffer.from(response.data);
        }
        catch (error)
        {
            logger.error("[ComfyUIClient] Image fetch error:", error);
            throw error;
        }
    }

    /**
     * Check ComfyUI health with retries
     */
    public async checkHealth(): Promise<HealthCheckResult>
    {
        let lastError: Error | null = null;

        for (let attempt = 0; attempt <= this.maxRetries; attempt++)
        {
            try
            {
                logger.info(`[ComfyUIClient] Checking health (attempt ${attempt + 1}/${this.maxRetries + 1})...`);
                const response = await this.axios.get("/system_stats", { timeout: 5000 });

                if (response.status === 200)
                {
                    logger.info("[ComfyUIClient] ✅ Health check passed");
                    return { healthy: true, message: "ComfyUI is running and healthy" };
                }

                return { healthy: false, message: `ComfyUI returned status ${response.status}` };
            }
            catch (error)
            {
                lastError = error instanceof Error ? error : new Error(String(error));

                if (attempt < this.maxRetries)
                {
                    const backoffMs = this.pollInterval * Math.pow(2, attempt);
                    logger.warn(`[ComfyUIClient] Health check failed, retrying in ${backoffMs}ms...`);
                    await this.delay(backoffMs);
                }
            }
        }

        const message: string = lastError?.message || "Unknown error";
        logger.error("[ComfyUIClient] Health check failed after all retries:", message);
        return { healthy: false, message: `ComfyUI is unreachable: ${message}` };
    }

    /**
     * Helper to delay execution
     */
    private delay(ms: number): Promise<void>
    {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
