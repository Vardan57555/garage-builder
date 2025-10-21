"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCacheUtils = void 0;
const RedisManager_1 = require("../../config/redis/RedisManager");
const StringFormatter_1 = require("../formatter/string/StringFormatter");
const Log_1 = require("../logger/Log");
const logger = (0, Log_1.createLogger)(module);
class RedisCacheUtils {
    static BATCH_SIZE = 500;
    static instance;
    constructor() {
    }
    static getInstance() {
        if (!RedisCacheUtils.instance) {
            RedisCacheUtils.instance = new RedisCacheUtils();
        }
        return RedisCacheUtils.instance;
    }
    async put(key, value, ttl = 3600) {
        const serializedValue = typeof value === "string" ? value : JSON.stringify(value);
        try {
            await RedisManager_1.RedisManager.getInstance().getRedisClient.set(key, serializedValue, "EX", ttl);
            return true;
        }
        catch (error) {
            logger.error(`Error setting key "${key}" in Redis:`, error);
            return false;
        }
    }
    async get(key) {
        try {
            const value = await RedisManager_1.RedisManager.getInstance().getRedisClient.get(key);
            return value ? StringFormatter_1.StringFormatter.toJson(value) : null;
        }
        catch (error) {
            logger.error(`Error retrieving key "${key}" from Redis: ${error.message}`);
            return null;
        }
    }
    async delete(key) {
        try {
            const result = await RedisManager_1.RedisManager.getInstance().getRedisClient.del(key);
            return result > 0;
        }
        catch (error) {
            logger.error(`Error deleting key "${key}" from Redis: ${error.message}`);
            return false;
        }
    }
    async exists(key) {
        try {
            const result = await RedisManager_1.RedisManager.getInstance().getRedisClient.exists(key);
            return result > 0;
        }
        catch (error) {
            logger.error(`Error checking existence of key "${key}" in Redis: ${error.message}`);
            return false;
        }
    }
    async clear() {
        try {
            await RedisManager_1.RedisManager.getInstance().getRedisClient.flushdb();
            return true;
        }
        catch (error) {
            logger.error(`Error clearing Redis database: ${error.message}`);
            return false;
        }
    }
    async invalidateCacheByPrefix(prefix) {
        try {
            const redisClient = RedisManager_1.RedisManager.getInstance().getRedisClient;
            const pattern = `${prefix}*`;
            const keys = await redisClient.keys(pattern);
            if (keys.length === 0) {
                return true;
            }
            for (let i = 0; i < keys.length; i += RedisCacheUtils.BATCH_SIZE) {
                const batch = keys.slice(i, i + RedisCacheUtils.BATCH_SIZE);
                const pipeline = redisClient.multi();
                for (const key of batch) {
                    pipeline.del(key);
                }
                await pipeline.exec();
            }
            return true;
        }
        catch (error) {
            logger.error(`Error deleting keys with prefix "${prefix}" from Redis: ${error.message}`);
            return false;
        }
    }
    normalizeSequelizeValue(value, depth = 30, seen = new WeakSet()) {
        if (depth <= 0) {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map((val) => this.normalizeSequelizeValue(val, depth - 1, seen));
        }
        if (value && typeof value === "object") {
            if (seen.has(value)) {
                return "[Circular]";
            }
            seen.add(value);
            const normalized = {};
            for (const key of Object.keys(value).sort()) {
                if (key === "Transaction") {
                    continue;
                }
                normalized[key] = this.normalizeSequelizeValue(value[key], depth - 1, seen);
            }
            const symbolKeys = Object.getOwnPropertySymbols(value);
            for (const sym of symbolKeys) {
                const opKey = `$${sym.description ?? sym.toString()}`;
                normalized[opKey] = this.normalizeSequelizeValue(value[sym], depth - 1, seen);
            }
            return normalized;
        }
        return value;
    }
    serializeCacheKeyOptions(options) {
        const serializeInclude = (include) => {
            if (typeof include === "function") {
                return { model: include.name };
            }
            if (Array.isArray(include)) {
                return include.map(serializeInclude);
            }
            if (include && typeof include === "object") {
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
exports.RedisCacheUtils = RedisCacheUtils;
//# sourceMappingURL=RedisCacheUtils.js.map