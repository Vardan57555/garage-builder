"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createLogger = createLogger;
const node_path_1 = __importDefault(require("node:path"));
const pino_1 = __importDefault(require("pino"));
const Constants_1 = require("../../common/io/Constants");
const dotenv_1 = __importDefault(require("dotenv"));
const node_process_1 = __importDefault(require("node:process"));
dotenv_1.default.config();
const transport = pino_1.default.transport({
    target: "pino-loki",
    options: {
        batching: true,
        interval: 5,
        labels: {
            app: node_process_1.default.env.APP_NAME,
            env: node_process_1.default.env.NODE_ENV || Constants_1.Constants.ENVIRONMENTS.DEVELOPMENT
        },
        host: node_process_1.default.env.LOKI_HOST,
        basicAuth: {
            username: node_process_1.default.env.LOKI_USERNAME,
            password: node_process_1.default.env.LOKI_PASSWORD
        }
    }
});
function logFactory(loggerName) {
    const isProduction = false && node_process_1.default.env.NODE_ENV === Constants_1.Constants.ENVIRONMENTS.PRODUCTION;
    return (0, pino_1.default)({
        name: loggerName,
        formatters: {
            level: (level) => ({ level })
        },
        base: undefined,
        timestamp: pino_1.default.stdTimeFunctions.isoTime
    }, isProduction ? transport : undefined);
}
function createLogger(name) {
    let loggerName;
    if (name != null) {
        if ("string" === typeof (name)) {
            loggerName = name;
        }
        else {
            loggerName = name.filename.split(node_path_1.default.sep).slice(-2).join(node_path_1.default.sep);
        }
    }
    return logFactory(loggerName);
}
const logger = logFactory("unhandled");
node_process_1.default.on("uncaughtException", (err) => {
    if (err && err.stack) {
        logger.error(err, err.message);
    }
    else {
        logger.error("uncaughtException, no stack trace available");
    }
});
node_process_1.default.on("unhandledRejection", (err) => {
    if (err && err.stack) {
        logger.error(err, err.message);
    }
    else {
        logger.error("unhandledRejection, no stack trace available");
    }
});
//# sourceMappingURL=Log.js.map