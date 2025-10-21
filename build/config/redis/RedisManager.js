"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisManager = void 0;
const InstantiationError_1 = require("../../errors/InstantiationError");
const Log_1 = require("../../utils/logger/Log");
const dotenv_1 = __importDefault(require("dotenv"));
const ioredis_1 = require("ioredis");
const ServiceManager_1 = require("../ServiceManager");
const Config_1 = __importDefault(require("../system-config/Config"));
const logger = (0, Log_1.createLogger)(module);
dotenv_1.default.config();
class RedisManager extends ServiceManager_1.ServiceManager {
    static instance;
    redisClient;
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PostgresManager.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!RedisManager.instance) {
            RedisManager.instance = new RedisManager(Enforce);
        }
        return RedisManager.instance;
    }
    async connect() {
        const { host, port, timeout, isLazyConnect } = Config_1.default.getInstance().redisConfig;
        try {
            this.redisClient = new ioredis_1.Redis({
                lazyConnect: isLazyConnect,
                connectTimeout: timeout,
                host: process.env.REDIS_HOST || host,
                port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : port,
                family: 6,
                retryStrategy: (times) => Math.min(times * 30, 1000),
                reconnectOnError(error) {
                    const targetErrors = [
                        /READONLY/,
                        /ETIMEDOUT/
                    ];
                    logger.warn(`Redis connection error: ${error.message}`, error);
                    return targetErrors.some((targetError) => targetError.test(error.message));
                }
            });
        }
        catch (error) {
            logger.error(`Unable to connect to the redis: ${error.message}`);
            throw error;
        }
    }
    async gracefulStop() {
        if (this.redisClient) {
            await this.redisClient.quit();
        }
    }
    get getRedisClient() {
        if (!this.redisClient) {
            throw new Error("Redis instance not initialized.");
        }
        return this.redisClient;
    }
}
exports.RedisManager = RedisManager;
function Enforce() {
}
//# sourceMappingURL=RedisManager.js.map