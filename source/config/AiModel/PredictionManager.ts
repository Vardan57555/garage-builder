import * as ort from "onnxruntime-node";
import { InstantiationError } from "@errors/InstantiationError";
import { createLogger } from "@utils/logger/Log";
import { ServiceManager } from "../ServiceManager";
import http from "http";

const logger = createLogger(module);

/**
 * PredictionManager is a singleton class responsible for managing the ONNX model session.
 * It loads the AI model once and provides access for predictions.
 */
export class PredictionManager extends ServiceManager
{
    private static instance: PredictionManager;
    private session: ort.InferenceSession | null = null;
    private isConnected = false;
    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PredictionManager.getInstance() instead of new.");
        }
    }

    /**
     * Gets the single instance of the PredictionManager class.
     */
    public static getInstance(): PredictionManager
    {
        if (!PredictionManager.instance)
        {
            PredictionManager.instance = new PredictionManager(Enforce);
        }

        return PredictionManager.instance;
    }

    /**
     * Loads the ONNX model session once.
     * Call this at app startup.
     */
    public async loadModel(modelPath: string): Promise<void>
    {
        try
        {
            this.session = await ort.InferenceSession.create(modelPath);
            logger.info(`✅ Model loaded from ${modelPath}`);
        }
        catch (error)
        {
            logger.error(`❌ Failed to load model: ${error.message}`);
            throw error;
        }
    }

    /**
     * Runs prediction with the loaded model.
     * @param features Array of numbers representing building parameters.
     */
    public async predict(features: number[]): Promise<number>
    {
        if (!this.session)
        {
            throw new Error("ONNX model session not initialized. Call loadModel() first.");
        }

        const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [1, features.length]);

        const feeds: Record<string, ort.Tensor> =
            {
            input: inputTensor
        };

        const results = await this.session.run(feeds);
        const outputName: string = this.session.outputNames[0];

        return results[outputName].data[0] as number;
    }

    /**
     * Connects to the prediction service (can be ML model, API, etc.)
     */
    public async connect(server?: http.Server): Promise<void>
    {
        try
        {
            logger.info("Connecting to Prediction service...");
            this.isConnected = true;
        }
        catch (error)
        {
            logger.error("PredictionManager failed to connect:", error);
            throw error;
        }
    }

    /**
     * Gracefully stops the prediction service
     */
    public async gracefulStop(): Promise<void>
    {
        try
        {
            if (this.isConnected)
            {
                logger.info("Shutting down Prediction service...");
                this.isConnected = false;
            }
        }
        catch (error)
        {
            logger.error("PredictionManager failed to shut down:", error);
            throw error;
        }
    }
}

/**
 * Enforce singleton instantiation.
 */
function Enforce(): void {}
