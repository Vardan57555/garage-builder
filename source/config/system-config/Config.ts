import { InstantiationError } from "@errors/InstantiationError";
import { createLogger } from "@utils/logger/Log";
import fs from "fs";
import { ValidationResult } from "joi";
import path from "path";
import pino from "pino";
import {
    validateAppConfig,
    validateCommonConfig,
    validateMySqlConfig,
    validateAuthConfig,
    validateOpenAiConfig
} from "./ConfigValidator";
import { IAppConfig } from "./io/IAppConfig";
import { IMySqlConfig } from "./io/IMySqlConfig";
import {ICommonConfig} from "@config/system-config/io/ICommonConfig";
import { IAuthConfig } from "./io/IAuthConfig";
import {IOpenAiConfig} from "@config/system-config/io/IOpenAi";


const logger: pino.Logger = createLogger(module);

/**
 * Class responsible for reading the system configuration files.
 * This class follows the Singleton pattern to ensure only one instance is created.
 * It reads and validates configuration files for the application, Redis connection, MySQL connection
 */
export default class Config
{
    private static instance: Config;
    private readonly _appConfig: IAppConfig;
    private readonly _mySqlConfig: IMySqlConfig;
    private readonly _openAiConfig: IOpenAiConfig;
    private readonly _authConfig: IAuthConfig;
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
            this._mySqlConfig = this.readConfigFile<IMySqlConfig>("mysql.json", validateMySqlConfig);
            this._authConfig = this.readConfigFile<IAuthConfig>("auth.json", validateAuthConfig);
            this._openAiConfig = this.readConfigFile<IOpenAiConfig>("openAi.json", validateOpenAiConfig);
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
     * Gets the MySQL configuration.
     * @returns The MySQL configuration.
     */
    public get mysqlConfig(): IMySqlConfig
    {
        return this._mySqlConfig;
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
     * Gets the common configuration.
     * @returns The common configuration.
     */
    public get commonConfig(): ICommonConfig
    {
        return this._commonConfig;
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
