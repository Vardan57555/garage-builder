import { RedisManager } from "@config/redis/RedisManager";
import { StringFormatter } from "@utils/formatter/string/StringFormatter";
import { createLogger } from "@utils/logger/Log";
import pino from "pino";
import { ChainableCommander, Redis } from "ioredis";
import { FindOptions } from "sequelize";

const logger: pino.Logger = createLogger(module);

export class RedisCacheUtils
{
    /**
     * The batch size for deleting keys in Redis.
     * @private
     */
    private static readonly BATCH_SIZE: number = 500;

    /**
     * The singleton instance of the RedisCacheUtils class.
     * @private
     */
    private static instance: RedisCacheUtils;

    /**
     * Constructor for the RedisCacheUtils class.
     * Initializes the Redis client.
     * @private
     */
    private constructor()
    {
    }

    /**
     * Singleton instance getter
     * @returns {RedisCacheUtils} The single instance of RedisCacheUtils.
     */
    public static getInstance(): RedisCacheUtils
    {
        if (!RedisCacheUtils.instance)
        {
            RedisCacheUtils.instance = new RedisCacheUtils();
        }

        return RedisCacheUtils.instance;
    }

    /**
     * Stores a key-value pair in Redis with an optional expiration time.
     *
     * @param key The key under which the value is stored.
     * @param value The value to store. It will be stringified if it's an object.
     * @param ttl Optional time-to-live (in seconds) for the key.
     * @returns A promise resolving to true if the operation is successful.
     */
    public async put(key: string, value: unknown, ttl: number = 3600): Promise<boolean>
    {
        const serializedValue: string = typeof value === "string" ? value : JSON.stringify(value);

        try
        {
            await RedisManager.getInstance().getRedisClient.set(key, serializedValue, "EX", ttl);

            return true;
        }
        catch (error)
        {
            logger.error(`Error setting key "${key}" in Redis:`, error);

            return false;
        }
    }

    /**
     * Retrieves a value by its key from Redis.
     *
     * @param key The key to retrieve.
     * @returns A promise resolving to the value or null if not found.
     */
    public async get<T>(key: string): Promise<T | null>
    {
        try
        {
            const value: string = await RedisManager.getInstance().getRedisClient.get(key);

            return value ? (StringFormatter.toJson(value) as T) : null;
        }
        catch (error)
        {
            logger.error(`Error retrieving key "${key}" from Redis: ${error.message}`);

            return null;
        }
    }

    /**
     * Deletes a key from Redis.
     *
     * @param key The key to delete.
     * @returns A promise resolving to true if the key was deleted.
     */
    public async delete(key: string): Promise<boolean>
    {
        try
        {
            const result: number = await RedisManager.getInstance().getRedisClient.del(key);

            return result > 0;
        }
        catch (error)
        {
            logger.error(`Error deleting key "${key}" from Redis: ${error.message}`);

            return false;
        }
    }

    /**
     * Checks if a key exists in Redis.
     *
     * @param key The key to check.
     * @returns A promise resolving to true if the key exists, false otherwise.
     */
    public async exists(key: string): Promise<boolean>
    {
        try
        {
            const result: number = await RedisManager.getInstance().getRedisClient.exists(key);

            return result > 0;
        }
        catch (error)
        {
            logger.error(`Error checking existence of key "${key}" in Redis: ${error.message}`);

            return false;
        }
    }

    /**
     * Clears all keys in Redis (use with caution in production).
     * @returns A promise resolving to true if the operation is successful.
     */
    public async clear(): Promise<boolean>
    {
        try
        {
            await RedisManager.getInstance().getRedisClient.flushdb();

            return true;
        }
        catch (error)
        {
            logger.error(`Error clearing Redis database: ${error.message}`);

            return false;
        }
    }

    /**
     * Deletes all keys in Redis that start with the specified prefix.
     *
     * @param prefix The prefix to match keys against.
     * @returns A promise resolving to true if operation is successful.
     */
    public async invalidateCacheByPrefix(prefix: string): Promise<boolean>
    {
        try
        {
            const redisClient: Redis = RedisManager.getInstance().getRedisClient;
            const pattern: string = `${prefix}*`;
            const keys: string[] = await redisClient.keys(pattern);

            if (keys.length === 0)
            {
                return true;
            }

            for (let i = 0; i < keys.length; i += RedisCacheUtils.BATCH_SIZE)
            {
                const batch: string[] = keys.slice(i, i + RedisCacheUtils.BATCH_SIZE);
                const pipeline: ChainableCommander = redisClient.multi();

                for (const key of batch)
                {
                    pipeline.del(key);
                }

                await pipeline.exec();
            }

            return true;
        }
        catch (error)
        {
            logger.error(`Error deleting keys with prefix "${prefix}" from Redis: ${error.message}`);

            return false;
        }
    }

    /**
     * Recursively normalizes Sequelize values into JSON-serializable objects.
     * - Handles arrays, objects, and Sequelize operator Symbols (e.g., Symbol(Op.gt) becomes "$gt").
     * - Avoids circular references by tracking seen objects and replacing cycles with "[Circular]".
     * - Skips the "Transaction" key commonly found in Sequelize instances.
     *
     * @param value - The input value to normalize (object, array, primitive, etc.).
     * @param depth - Maximum recursion depth to avoid stack overflows (default is 30).
     * @param seen - A WeakSet used internally to track visited objects and detect cycles.
     * @returns A JSON-safe version of the input value.
     * @private
     */
    private normalizeSequelizeValue(
        value: any,
        depth: number = 30,
        seen: WeakSet<object> = new WeakSet()
    ): any
    {
        if (depth <= 0)
        {
            return value;
        }

        if (Array.isArray(value))
        {
            return value.map((val) => this.normalizeSequelizeValue(val, depth - 1, seen));
        }

        if (value && typeof value === "object")
        {
            if (seen.has(value))
            {
                return "[Circular]";
            }

            seen.add(value);

            const normalized: Record<string, any> = {};

            for (const key of Object.keys(value).sort())
            {
                if (key === "Transaction")
                {
                    continue;
                }

                normalized[key] = this.normalizeSequelizeValue(value[key], depth - 1, seen);
            }

            const symbolKeys: symbol[] = Object.getOwnPropertySymbols(value);

            for (const sym of symbolKeys)
            {
                const opKey = `$${sym.description ?? sym.toString()}`;
                normalized[opKey] = this.normalizeSequelizeValue(value[sym], depth - 1, seen);
            }

            return normalized;
        }

        return value;
    }

    /**
     * Serializes the options for caching.
     *
     * @param options The options to serialize.
     * @returns A string representing the serialized options.
     */
    public serializeCacheKeyOptions(options: FindOptions): string
    {
        const serializeInclude: (include: any) => any = (include: any): any =>
        {
            if (typeof include === "function")
            {
                return { model: include.name };
            }

            if (Array.isArray(include))
            {
                return include.map(serializeInclude);
            }

            if (include && typeof include === "object")
            {
                return {
                    model: typeof include.model === "function" ? include.model.name : include.model?.name || "unknown",
                    as: include.as,
                    where: this.normalizeSequelizeValue(include.where),
                    attributes: include.attributes,
                    required: include.required,
                    include: serializeInclude(include.include)
                };
            }

            return include;
        };

        const keyParts = {
            attributes: options.attributes,
            where: this.normalizeSequelizeValue(options.where),
            include: serializeInclude(options.include)
        };

        return JSON.stringify(keyParts);
    }
}
