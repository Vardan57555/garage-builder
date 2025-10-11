import { ICommonConfig } from "@config/system-config/io/ICommonConfig";
import { IRabbitConnectionConfig } from "@config/system-config/io/IRabbitConnectionConfig";
import { IRabbitExchangeConfig } from "@config/system-config/io/IRabbitExchangeConfig";
import { IRabbitQueueConfig } from "@config/system-config/io/IRabbitQueueConfig";
import { ISocketConfig } from "@config/system-config/io/ISocketConfig";
import { InstantiationError } from "@errors/InstantiationError";

import { createLogger } from "@utils/logger/Log";
import fs from "fs";
import { ValidationResult } from "joi";
import path from "path";
import pino from "pino";
import {
    validateAppConfig,
    validateAuthConfig,
    validateCommonConfig,
    validateOpenAiConfig,
    validatePostgresConfig,
    validateRabbitConnectionConfig,
    validateRabbitQueueConfig,
    validateRabbitSystemExchangeConfig,
    validateRedisConfig,
    validateReviewsConfig,
    validateSocketConfig,
    validateStripeConfig,
    validateYandexAuthConfig
} from "./ConfigValidator";
import { IAppConfig } from "./io/IAppConfig";
import { IAuthConfig, IYandexAuthConfig } from "./io/IAuthConfig";
import { IPostgresConfig } from "./io/IPostgresConfig";
import { IRedisConfig } from "./io/IRedisConfig";

import { IReviewsConfig } from "./io/IReviewsConfig";
import { IStripeConfig } from "./io/IStripeConfig";
import { IOpenAiConfig } from "@config/system-config/io/IOpenAi";

const logger: pino.Logger = createLogger(module);

/**
 * Class responsible for reading the system configuration files.
 * This class follows the Singleton pattern to ensure only one instance is created.
 * It reads and validates configuration files for the application, Redis connection, PostgreSQL connection
 */
export default class Config
{
    private static instance: Config;
    private readonly _appConfig: IAppConfig;
    private readonly _socketConfig: ISocketConfig;
    private readonly _postgresConfig: IPostgresConfig;
    private readonly _openAiConfig: IOpenAiConfig;
    private readonly _redisConfig: IRedisConfig;
    private readonly _authConfig: IAuthConfig;
    private readonly _yandexAuthConfig: IYandexAuthConfig;
    private readonly _reviewsConfig: IReviewsConfig;
    private readonly _stripeConfig: IStripeConfig;
    private readonly _rabbitConnectionConfig: IRabbitConnectionConfig;
    private readonly _rabbitExchangeConfig: IRabbitExchangeConfig;
    private readonly _rabbitQueueConfig: IRabbitQueueConfig;
    private readonly _commonConfig: ICommonConfig;

    /**
     * Constructs a new instance of the Config class.
     * @param enforce - A function to enforce the Singleton pattern.
     * @throws If the enforce function is not provided or configuration files cannot be read.
     */
    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use Config.getInstance() instead of new.");
        }

        try
        {
            this._appConfig = this.readConfigFile<IAppConfig>("app.json", validateAppConfig);
            this._socketConfig = this.readConfigFile<ISocketConfig>("socket.json", validateSocketConfig);
            this._postgresConfig = this.readConfigFile<IPostgresConfig>("postgres.json", validatePostgresConfig);
            this._openAiConfig = this.readConfigFile<IOpenAiConfig>("openAi.json", validateOpenAiConfig);
            this._redisConfig = this.readConfigFile<IRedisConfig>("redis-config.json", validateRedisConfig);
            this._rabbitConnectionConfig = this.readConfigFile<IRabbitConnectionConfig>("rabbit-connection.json", validateRabbitConnectionConfig);
            this._rabbitExchangeConfig = this.readConfigFile<IRabbitExchangeConfig>("rabbit-system-exchange.json", validateRabbitSystemExchangeConfig);
            this._rabbitQueueConfig = this.readConfigFile<IRabbitQueueConfig>("rabbit-queue.json", validateRabbitQueueConfig);
            this._authConfig = this.readConfigFile<IAuthConfig>("auth.json", validateAuthConfig);
            this._yandexAuthConfig = this.readConfigFile<IYandexAuthConfig>("yandex-auth.json", validateYandexAuthConfig);
            this._reviewsConfig = this.readConfigFile<IReviewsConfig>("google-apis.json", validateReviewsConfig);
            this._stripeConfig = this.readConfigFile<IStripeConfig>("stripe.json", validateStripeConfig);
            this._commonConfig = this.readConfigFile<ICommonConfig>("common.json", validateCommonConfig);
        }
        catch (error)
        {
            logger.error(`Error reading config file ${error.message}`);
        }
    }

    /**
     * Gets the application configuration.
     * @returns The application configuration.
     */
    public get appConfig(): IAppConfig
    {
        return this._appConfig;
    }

    /**
     * Gets the socket configuration.
     * @returns The socket configuration.
     */
    public get socketConfig(): ISocketConfig
    {
        return this._socketConfig;
    }

    /**
     * Gets the PostgreSQL configuration.
     * @returns The PostgreSQL configuration.
     */
    public get postgresConfig(): IPostgresConfig
    {
        return this._postgresConfig;
    }

    /**
     * Gets the OpenAI configuration.
     * @returns The OpenAI configuration.
     */
    public get openAiConfig(): IOpenAiConfig
    {
        return this._openAiConfig;
    }

    /**
     * Gets the Redis configuration.
     * @returns The Redis configuration
     */
    public get redisConfig(): IRedisConfig
    {
        return this._redisConfig;
    }

    /**
     * Gets the RabbitMQ connection configuration.
     * @returns The RabbitMQ connection configuration.
     */
    public get rabbitConnectionConfig(): IRabbitConnectionConfig
    {
        return this._rabbitConnectionConfig;
    }

    /**
     * Gets the RabbitMQ location exchange configuration.
     * @returns The RabbitMQ location exchange configuration.
     */
    public get rabbitExchangeConfig(): IRabbitExchangeConfig
    {
        return this._rabbitExchangeConfig;
    }

    /**
     * Gets the RabbitMQ queue configuration.
     * @returns The RabbitMQ queue configuration.
     */
    public get rabbitQueueConfig(): IRabbitQueueConfig
    {
        return this._rabbitQueueConfig;
    }

    /**
     * Gets the authentication configuration.
     * @returns The authentication configuration.
     */
    public get authConfig(): IAuthConfig
    {
        return this._authConfig;
    }

    /**
     * Gets the authentication configuration.
     * @returns The authentication configuration.
     */
    public get yandexAuthConfig(): IYandexAuthConfig
    {
        return this._yandexAuthConfig;
    }

    /**
     * Gets the places configuration.
     * @returns The reviews configuration.
     */
    public get reviewsConfig(): IReviewsConfig
    {
        return this._reviewsConfig;
    }

    /**
     * Gets the stripe configuration.
     * @returns The stripe configuration.
     */
    public get stripeConfig(): IStripeConfig
    {
        return this._stripeConfig;
    }

    /**
     * Gets the common configuration.
     * @returns The common configuration.
     */
    public get commonConfig(): ICommonConfig
    {
        return this._commonConfig;
    }

    /**
     * Gets the single instance of the Config class.
     * @returns The single instance of the Config class.
     */
    public static getInstance(): Config
    {
        if (!Config.instance)
        {
            Config.instance = new Config(Enforce);
        }

        return Config.instance;
    }

    /**
     * Reads and validates a configuration image.
     * @param fileName - The name of the configuration image.
     * @param validate - The validation function for the configuration data.
     * @returns The validated configuration data.
     * @throws If the configuration image is not found or validation fails.
     */
    private readConfigFile = <T>(fileName: string, validate: (data: {}) => ValidationResult<T>): T =>
    {
        const fileFullName: string = path.join(__dirname, "..", "..", "configs", fileName);

        if (!fs.existsSync(fileFullName))
        {
            throw new Error(`Config file '${fileName}' not found`);
        }

        const rawData: string = fs.readFileSync(fileFullName, "utf-8");
        const jsonData = JSON.parse(rawData);

        const validationResult: ValidationResult = validate(jsonData);

        if (validationResult.error)
        {
            logger.error(`Error validating config file '${fileName}' ${validationResult.error.message}`);
            throw validationResult.error;
        }

        return validationResult.value;
    };
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
