"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpError = void 0;
const Log_1 = require("../utils/logger/Log");
const http2_1 = require("http2");
const CustomError_1 = require("./CustomError");
const logger = (0, Log_1.createLogger)(module);
class HttpError extends CustomError_1.CustomError {
    static NOT_SUPPORTED_METHOD = "NOT_SUPPORTED_METHOD";
    static NOT_FOUND = "NOT_FOUND";
    static NOT_AUTHORIZED = "NOT_AUTHORIZED";
    static NOT_FIRST_ATTEMPT = "NOT_FIRST_ATTEMPT";
    constructor(code, message, fields, info, data) {
        super("HttpError");
        this.code = code;
        this.message = message;
        this.status = this.getStatus();
        this.fields = fields;
        this.info = info;
        this.data = data;
    }
    getStatus() {
        const statusMap = {
            [HttpError.NOT_SUPPORTED_METHOD]: http2_1.constants.HTTP_STATUS_METHOD_NOT_ALLOWED,
            [HttpError.NOT_FOUND]: http2_1.constants.HTTP_STATUS_NOT_FOUND,
            [HttpError.NOT_AUTHORIZED]: http2_1.constants.HTTP_STATUS_UNAUTHORIZED,
            [HttpError.NOT_FIRST_ATTEMPT]: http2_1.constants.HTTP_STATUS_UNAUTHORIZED
        };
        const status = statusMap[this.code];
        if (!status) {
            logger.warn(`Unknown error status code ${this.code}`);
            return http2_1.constants.HTTP_STATUS_BAD_REQUEST;
        }
        return status;
    }
}
exports.HttpError = HttpError;
//# sourceMappingURL=HttpError.js.map