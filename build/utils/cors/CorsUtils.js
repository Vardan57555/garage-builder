"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CorsUtils = void 0;
const Config_1 = __importDefault(require("../../config/system-config/Config"));
const ServerError_1 = require("../../errors/ServerError");
const Log_1 = require("../logger/Log");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const logger = (0, Log_1.createLogger)(module);
class CorsUtils {
    static setupCors() {
        try {
            const allowCors = this.getAllowedDomainsRegExp();
            const corsOptions = {
                optionsSuccessStatus: 200,
                origin: allowCors.length > 0 ? allowCors : "*",
                credentials: true
            };
            return (0, cors_1.default)(corsOptions);
        }
        catch (error) {
            const errMessage = `Error setting up CORS ${error.message}`;
            logger.error(errMessage);
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, errMessage);
        }
    }
    static setupCorsSocket() {
        try {
            const allowCors = this.getAllowedDomainsRegExp();
            return {
                origin: allowCors.length > 0 ? allowCors : "*",
                credentials: true
            };
        }
        catch (error) {
            logger.error(`Error setting up CORS for Socket.IO ${error.message}`);
            return;
        }
    }
    static getAllowedDomains() {
        try {
            const appConfig = Config_1.default.getInstance().appConfig;
            return process.env.CORS_DOMAINS ? process.env.CORS_DOMAINS.split(",") : appConfig.origins.domains;
        }
        catch (error) {
            logger.error(`Error getting CORS domains ${error.message}`);
            return [];
        }
    }
    static getAllowedDomainsRegExp() {
        try {
            const appConfig = Config_1.default.getInstance().appConfig;
            const enabled = Boolean(process.env.CORS_ENABLED) || appConfig.origins.enabled;
            if (!enabled) {
                return [];
            }
            const domains = process.env.CORS_DOMAINS ? process.env.CORS_DOMAINS.split(",") : appConfig.origins.domains;
            const allowCors = [];
            for (const regex of domains) {
                try {
                    allowCors.push(new RegExp(regex));
                }
                catch (exception) {
                    logger.error(exception);
                }
            }
            return allowCors;
        }
        catch (error) {
            logger.error(`Error getting CORS domains RegExp: ${error.message}`);
            return [];
        }
    }
}
exports.CorsUtils = CorsUtils;
//# sourceMappingURL=CorsUtils.js.map