import { InstantiationError } from "@errors/InstantiationError";
import { createLogger } from "@utils/logger/Log";
import dotenv from "dotenv";
import { Redis } from "ioredis";
import pino from "pino";
import { ServiceManager } from "../ServiceManager";
import Config from "../system-config/Config";

const logger: pino.Logger = createLogger(module);

dotenv.config();

/**
 * RedisManager is a singleton class responsible for managing the Redis connection.
 * It provides methods to connect to and gracefully stop the Redis client.
 */
export class RedisManager extends ServiceManager
{
    /**
     * Singleton instance of the RedisManager class.
     * @private
     */
    private static instance: RedisManager;

    /**
     * The Redis client instance.
     *
     * @private
     */
    private redisClient: Redis;

    /**
     * Constructor for the RedisManager class.
     *
     * @param enforce - Enforces the Singleton pattern.
     */
    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PostgresManager.getInstance() instead of new.");
        }
    }

    /**
     * Gets the single instance of the Config class.
     * @returns The single instance of the Config class.
     */
    public static getInstance(): RedisManager
    {
        if (!RedisManager.instance)
        {
            RedisManager.instance = new RedisManager(Enforce);
        }

        return RedisManager.instance;
    }

    /**
     * Connects to the Redis server using the configuration from the Config class.
     * Logs the connection status and handles reconnection on errors.
     * @throws Will throw an error if the connection fails.
     */
    public async connect(): Promise<void>
    {
        const {
            host,
            port,
            timeout,
            isLazyConnect
        } = Config.getInstance().redisConfig;

        try
        {
            this.redisClient = new Redis({
                lazyConnect: isLazyConnect,
                connectTimeout: timeout,
                host: process.env.REDIS_HOST || host,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : port,
                family: 4,
                retryStrategy: (times: number): number => Math.min(times * 30, 1000),
                reconnectOnError(error: Error): boolean
                {
                    const targetErrors: RegExp[] = [
                        /READONLY/,
                        /ETIMEDOUT/
                    ];
                    logger.warn(`Redis connection error: ${error.message}`, error);

                    return targetErrors.some((targetError: RegExp): boolean => targetError.test(error.message));
                }
            });
        }
        catch (error)
        {
            logger.error(`Unable to connect to the redis: ${error.message}`);
            throw error;
        }
    }

    /**
     * Gracefully stops the Redis client by quitting the connection.
     * Logs the disconnection status.
     */
    public async gracefulStop(): Promise<void>
    {
        if (this.redisClient)
        {
            await this.redisClient.quit();
        }
    }

    /**
     * Gets the Redis client instance.
     * @returns The Redis client instance.
     * @throws Will throw an error if the Redis client is not initialized.
     */
    public get getRedisClient(): Redis
    {
        if (!this.redisClient)
        {
            throw new Error("Redis instance not initialized.");
        }

        return this.redisClient;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
