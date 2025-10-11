"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerError = void 0;
const Log_1 = require("../utils/logger/Log");
const http2_1 = require("http2");
const CustomError_1 = require("./CustomError");
const logger = (0, Log_1.createLogger)(module);
class ServerError extends CustomError_1.CustomError {
    static INTERNAL = "INTERNAL";
    static REQUEST_TIMEOUT = "REQUEST_TIMEOUT";
    static NOT_FOUND = "NOT_FOUND";
    static CONFLICT = "CONFLICT";
    static FORBIDDEN = "FORBIDDEN";
    constructor(code, message, fields, data) {
        super("ServerError");
        this.code = code;
        this.message = message;
        this.status = this.getStatus();
        this.fields = fields;
        this.data = data;
    }
    getStatus() {
        const statusMap = {
            [ServerError.INTERNAL]: http2_1.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            [ServerError.NOT_FOUND]: http2_1.constants.HTTP_STATUS_NOT_FOUND,
            [ServerError.REQUEST_TIMEOUT]: http2_1.constants.HTTP_STATUS_GATEWAY_TIMEOUT,
            [ServerError.CONFLICT]: http2_1.constants.HTTP_STATUS_CONFLICT,
            [ServerError.FORBIDDEN]: http2_1.constants.HTTP_STATUS_FORBIDDEN
        };
        const retStatus = statusMap[this.code || ""] || http2_1.constants.HTTP_STATUS_BAD_REQUEST;
        if (!statusMap[this.code || ""]) {
            logger.warn(`Unknown error status code ${this.code}`);
        }
        return retStatus;
    }
}
exports.ServerError = ServerError;
//# sourceMappingURL=ServerError.js.map