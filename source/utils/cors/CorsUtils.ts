import Config from "@config/system-config/Config";
import { IAppConfig } from "@config/system-config/io/IAppConfig";
import { ServerError } from "@errors/ServerError";
import { createLogger } from "@utils/logger/Log";
import cors, { CorsOptions, type CorsOptionsDelegate, CorsRequest } from "cors";
import dotenv from "dotenv";
import pino from "pino";

dotenv.config();

const logger: pino.Logger = createLogger(module);

/**
 * Utility class for setting up CORS for the application.
 */
export class CorsUtils
{
    /**
     * Sets up CORS for the application.
     *
     * @returns The CORS middleware.
     */
    public static setupCors(): (req: CorsRequest, res: {
        statusCode?: number | undefined;
        setHeader(key: string, value: string): any;
        end(): any;
    }, next: (err?: any) => any) => void
    {
        try
        {
            const allowCors: RegExp[] = this.getAllowedDomainsRegExp();

            const corsOptions: CorsOptions = {
                optionsSuccessStatus: 200,
                origin: allowCors.length > 0 ? allowCors : "*",
                credentials: true
            };

            return cors(corsOptions);
        }
        catch (error)
        {
            const errMessage: string = `Error setting up CORS ${error.message}`;
            logger.error(errMessage);
            throw new ServerError(ServerError.INTERNAL, errMessage);
        }
    }

    /**
     * Sets up CORS for Socket.IO.
     *
     * @returns The CORS options for Socket.IO.
     */
    public static setupCorsSocket(): CorsOptions | CorsOptionsDelegate
    {
        try
        {
            const allowCors: RegExp[] = this.getAllowedDomainsRegExp();

            return {
                origin: allowCors.length > 0 ? allowCors : "*",
                credentials: true
            };
        }
        catch (error)
        {
            logger.error(`Error setting up CORS for Socket.IO ${error.message}`);

            return;
        }
    }

    /**
     * Gets the allowed CORS domains.
     *
     * @returns The allowed CORS domains.
     */
    public static getAllowedDomains(): string[]
    {
        try
        {
            const appConfig: IAppConfig = Config.getInstance().appConfig;

            return process.env.CORS_DOMAINS ? process.env.CORS_DOMAINS.split(",") : appConfig.origins.domains;
        }
        catch (error)
        {
            logger.error(`Error getting CORS domains ${error.message}`);

            return [];
        }
    }

    /**
     * Gets the allowed CORS domains as regular expressions.
     *
     * @returns The allowed CORS domains.
     */
    private static getAllowedDomainsRegExp(): RegExp[]
    {
        try
        {
            const appConfig: IAppConfig = Config.getInstance().appConfig;
            const enabled: boolean = Boolean(process.env.CORS_ENABLED) || appConfig.origins.enabled;

            if (!enabled)
            {
                return [];
            }

            const domains: string[] = process.env.CORS_DOMAINS ? process.env.CORS_DOMAINS.split(",") : appConfig.origins.domains;

            const allowCors: RegExp[] = [];

            for (const regex of domains)
            {
                try
                {
                    allowCors.push(new RegExp(regex));
                }
                catch (exception)
                {
                    logger.error(exception);
                }
            }

            return allowCors;
        }
        catch (error)
        {
            logger.error(`Error getting CORS domains RegExp: ${error.message}`);

            return [];
        }
    }
}
