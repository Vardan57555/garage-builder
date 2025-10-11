import { CustomError } from "@errors/CustomError";
import { HttpError } from "@errors/HttpError";
import { ErrorInfo } from "@errors/io/ErrorInfo";
import { ServerError } from "@errors/ServerError";
import { NextFunction, Request, Response } from "express";
import Config from "../../config/system-config/Config";

/**
 * Middleware to handle 404 errors.
 * Forwards a `HttpError` with a `NOT_FOUND` code and a message indicating the requested path was not found.
 *
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export function error404Handler(req: Request, res: Response, next: NextFunction): void
{
    next(new HttpError(HttpError.NOT_FOUND, `page for '${req.path}' not found`));
}

/**
 * Middleware to handle errors and format the error response.
 * Converts known errors to `ServerError` or `HttpError` and formats the response JSON.
 *
 * @param err - The error object.
 * @param req - The Express request object.
 * @param res - The Express response object.
 * @param next - The next middleware function in the stack.
 */
export function errorPageHandler(err: CustomError, req: Request, res: Response, next: NextFunction): void
{
    if ("ETIMEDOUT" === err.code)
    {
        err = new ServerError(ServerError.REQUEST_TIMEOUT, "Internal server request timeout");
    }

    const errorResponse: {
        success?: boolean;
        errors?: ErrorInfo[];
    } = { success: false };
    const message: string = err.message ? err.message.replace(new RegExp("\"", "g"), "'") : null;

    let errorForwarded: string[] = [Config.getInstance().appConfig.name];

    if (err["forwarded"])
    {
        errorForwarded = errorForwarded.concat(err["forwarded"]);
    }

    errorResponse.errors = [
        {
            code: err.code,
            name: err.name,
            forwarded: errorForwarded,
            service: Config.getInstance().appConfig.name,
            message: message,
            fields: err.fields,
            info: err.info,
            stack: typeof err.stack === "string" ? err.stack.split("\n") : err.stack
        }
    ];

    if (err.data)
    {
        errorResponse["data"] = err.data;
    }

    res.status(err["status"] || 500);
    res.json(errorResponse);
}

/**
 * Middleware to check if the HTTP method is supported.
 * Forwards a `HttpError` with a `NOT_SUPPORTED_METHOD` code if the method is not supported.
 *
 * @param methods - The list of supported HTTP methods.
 * @returns A middleware function that checks the HTTP method.
 */
export function supportedHttpMethods(...methods: string[]): (req: Request, res: Response, next: NextFunction) => void
{
    return (req: Request, res: Response, next: NextFunction) =>
    {
        if (methods.includes(req.method))
        {
            next();
        }
        else
        {
            next(new HttpError(HttpError.NOT_SUPPORTED_METHOD, `Endpoint does not support http '${req.method}' method.`));
        }
    };
}
