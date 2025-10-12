"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantiationError = void 0;
const Log_1 = require("../utils/logger/Log");
const http2_1 = require("http2");
const CustomError_1 = require("./CustomError");
const logger = (0, Log_1.createLogger)(module);
class InstantiationError extends CustomError_1.CustomError {
    static NOT_INSTANTIABLE = "NOT_INSTANTIABLE";
    constructor(code, message, fields, info, data) {
        super("InstantiationError");
        this.code = code;
        this.message = message;
        this.status = this.getStatus();
        this.fields = fields;
        this.info = info;
        this.data = data;
    }
    getStatus() {
        const statusMap = {
            [InstantiationError.NOT_INSTANTIABLE]: http2_1.constants.HTTP_STATUS_CONFLICT
        };
        const status = statusMap[this.code];
        if (!status) {
            logger.warn(`Unknown error status code ${this.code}`);
            return http2_1.constants.HTTP_STATUS_BAD_REQUEST;
        }
        return status;
    }
}
exports.InstantiationError = InstantiationError;
//# sourceMappingURL=InstantiationError.js.map