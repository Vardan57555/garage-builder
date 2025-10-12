"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.error404Handler = error404Handler;
exports.errorPageHandler = errorPageHandler;
exports.supportedHttpMethods = supportedHttpMethods;
const HttpError_1 = require("../../errors/HttpError");
const ServerError_1 = require("../../errors/ServerError");
const Config_1 = __importDefault(require("../../config/system-config/Config"));
function error404Handler(req, res, next) {
    next(new HttpError_1.HttpError(HttpError_1.HttpError.NOT_FOUND, `page for '${req.path}' not found`));
}
function errorPageHandler(err, req, res, next) {
    if ("ETIMEDOUT" === err.code) {
        err = new ServerError_1.ServerError(ServerError_1.ServerError.REQUEST_TIMEOUT, "Internal server request timeout");
    }
    const errorResponse = { success: false };
    const message = err.message ? err.message.replace(new RegExp("\"", "g"), "'") : null;
    let errorForwarded = [Config_1.default.getInstance().appConfig.name];
    if (err["forwarded"]) {
        errorForwarded = errorForwarded.concat(err["forwarded"]);
    }
    errorResponse.errors = [
        {
            code: err.code,
            name: err.name,
            forwarded: errorForwarded,
            service: Config_1.default.getInstance().appConfig.name,
            message: message,
            fields: err.fields,
            info: err.info,
            stack: typeof err.stack === "string" ? err.stack.split("\n") : err.stack
        }
    ];
    if (err.data) {
        errorResponse["data"] = err.data;
    }
    res.status(err["status"] || 500);
    res.json(errorResponse);
}
function supportedHttpMethods(...methods) {
    return (req, res, next) => {
        if (methods.includes(req.method)) {
            next();
        }
        else {
            next(new HttpError_1.HttpError(HttpError_1.HttpError.NOT_SUPPORTED_METHOD, `Endpoint does not support http '${req.method}' method.`));
        }
    };
}
//# sourceMappingURL=CommonMiddleware.js.map