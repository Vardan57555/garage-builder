import OpenAI from "openai";
import { ServiceManager } from "@config/ServiceManager";
import { InstantiationError } from "@errors/InstantiationError";
import { ServerError } from "@errors/ServerError";
import dotenv from "dotenv";
import Config from "@config/system-config/Config";

dotenv.config();

export class OpenAIManager extends ServiceManager
{
    private static instance: OpenAIManager;

    private _openaiClient: OpenAI;

    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use OpenAIManager.getInstance() instead of new.");
        }
    }

    public static getInstance(): OpenAIManager
    {
        if (!OpenAIManager.instance)
        {
            OpenAIManager.instance = new OpenAIManager(Enforce);
        }

        return OpenAIManager.instance;
    }

    /**
     * Connects to the OpenAI server using the configuration from the Config class.
     * Logs the connection status and handles reconnection on errors.
     * @throws Will throw an error if the connection fails.
     */

    public async connect(): Promise<void>
    {
        const {
            apiKey
        } = Config.getInstance().openAiConfig;

        return new Promise((resolve, reject): void =>
        {
            if (!process.env.OPENAI_API_KEY)
            {
                reject(new ServerError(ServerError.INTERNAL, "Missing OpenAI API Key"));

                return;
            }

            this._openaiClient = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY || apiKey
            });

            resolve();
        });
    }

    /**
     * Gracefully stops the OpenAiInstance client by closing the connection.
     * Logs the disconnection status.
     */

    public async gracefulStop(): Promise<void>
    {
        return Promise.resolve();
    }

    /**
     * Gets the OpenAI client instance.
     * @returns The OpenAI client instance.
     * @throws Will throw an error if the OpenAI client is not initialized.
     */

    public get getOpenaiClient(): OpenAI
    {
        if (!this._openaiClient)
        {
            throw new ServerError(ServerError.INTERNAL, "OpenAI Client not initialized.");
        }

        return this._openaiClient;
    }
}

function Enforce(): void
{
}
