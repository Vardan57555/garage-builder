import path from "node:path";
import pino from "pino";
import { Constants } from "@common/io/Constants";
import type { LokiOptions } from "pino-loki";
import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

const transport = pino.transport<LokiOptions>({
    target: "pino-loki",
    options: {
        batching: true,
        interval: 5,
        labels: {
            app: process.env.APP_NAME,
            env: process.env.NODE_ENV || Constants.ENVIRONMENTS.DEVELOPMENT
        },
        host: process.env.LOKI_HOST,
        basicAuth: {
            username: process.env.LOKI_USERNAME,
            password: process.env.LOKI_PASSWORD
        }
    }
});

/**
 * Factory function to create a pino logger with a specified name.
 *
 * @param loggerName - The name of the logger.
 * @returns A pino.Logger instance.
 */
function logFactory(loggerName: string): pino.Logger
{
    const isProduction: boolean = false && process.env.NODE_ENV === Constants.ENVIRONMENTS.PRODUCTION;

    return pino({
        name: loggerName,
        formatters: {
            level: (level) => ({ level })
        },
        base: undefined,
        timestamp: pino.stdTimeFunctions.isoTime
    }, isProduction ? transport : undefined);
}

/**
 * Creates a logger instance with a specified name.
 *
 * @param name - The name of the logger or the NodeModule.
 * @returns A pino.Logger instance.
 */
export function createLogger(name?: string | NodeModule): pino.Logger
{
    let loggerName: string;

    if (name != null)
    {
        if ("string" === typeof (name))
        {
            loggerName = <string>name;
        }
        else
        {
            loggerName = name.filename.split(path.sep).slice(-2).join(path.sep);
        }
    }

    return logFactory(loggerName);
}

const logger: pino.Logger = logFactory("unhandled");

/**
 * Handles uncaught exceptions by logging the error.
 *
 * @param err - The error object.
 */
process.on("uncaughtException", (err: Error) =>
{
    if (err && err.stack)
    {
        logger.error(err, err.message);
    }
    else
    {
        logger.error("uncaughtException, no stack trace available");
    }
});

/**
 * Handles unhandled promise rejections by logging the error.
 *
 * @param err - The error object.
 */
process.on("unhandledRejection", (err: Error) =>
{
    if (err && err.stack)
    {
        logger.error(err, err.message);
    }
    else
    {
        logger.error("unhandledRejection, no stack trace available");
    }
});
