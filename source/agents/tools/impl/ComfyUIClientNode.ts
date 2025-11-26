import axios, { AxiosInstance } from "axios";
import {InstantiationError} from "@errors/InstantiationError";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {IComfyUIClient} from "@agents/tools/impl/io/IVisualizationNode";
import {ComfyUIResponse, ComfyUIWorkflow, HealthCheckResult} from "@agents/tools/io/IVisualization";
const logger: pino.Logger = createLogger(module);

/**
 * Handles ComfyUI API communication
 */
export class ComfyUIClient implements IComfyUIClient
{
    private axios: AxiosInstance;
    private readonly pollInterval: number = 3000;
    private readonly timeout: number = 120000;
    private static instance: IComfyUIClient;

    constructor(enforce: () => void, comfyuiUrl: string = "http://localhost:8188")
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ComfyUIClient.getInstance() instead of new.");
        }

        this.axios = axios.create({
            baseURL: comfyuiUrl,
            timeout: 120000,
        });
        logger.info(`[ComfyUIClient] Initialized with URL: ${comfyuiUrl}`);
    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

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
     * Poll for generation completion
     */
    public async pollForCompletion(promptId: string): Promise<string>
    {
        const startTime: number = Date.now();

        while (Date.now() - startTime < this.timeout)
        {
            try
            {
                const response = await this.axios.get(`/history/${promptId}`);

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

                await new Promise((resolve) => setTimeout(resolve, this.pollInterval));
            }
            catch (error)
            {
                if (error instanceof Error && error.message.includes("Generation error"))
                {
                    throw error;
                }
                logger.warn("[ComfyUIClient] Poll error:", error);
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
     * Check ComfyUI health
     */
    public async checkHealth(): Promise<HealthCheckResult>
    {
        try
        {
            logger.info("[ComfyUIClient] Checking health...");
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
            const message: string = error instanceof Error ? error.message : String(error);
            logger.error("[ComfyUIClient] Health check failed:", message);
            return { healthy: false, message: `ComfyUI is unreachable: ${message}` };
        }
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
