"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidationError = void 0;
const Log_1 = require("../utils/logger/Log");
const http2_1 = require("http2");
const CustomError_1 = require("./CustomError");
const logger = (0, Log_1.createLogger)(module);
class ValidationError extends CustomError_1.CustomError {
    static INPUT = "INPUT";
    static OUTPUT = "OUTPUT";
    static DUPLICATE_ENTRY = "DUPLICATE_ENTRY";
    constructor(code, message, fields, info, data) {
        super("ValidationError");
        this.code = code;
        this.message = message;
        this.status = this.getStatus();
        this.fields = fields;
        this.info = info;
        this.data = data;
    }
    getStatus() {
        const statusMap = {
            [ValidationError.INPUT]: http2_1.constants.HTTP_STATUS_BAD_REQUEST,
            [ValidationError.OUTPUT]: http2_1.constants.HTTP_STATUS_INTERNAL_SERVER_ERROR,
            [ValidationError.DUPLICATE_ENTRY]: http2_1.constants.HTTP_STATUS_CONFLICT
        };
        const retStatus = statusMap[this.code || ""] || http2_1.constants.HTTP_STATUS_BAD_REQUEST;
        if (!statusMap[this.code || ""]) {
            logger.warn(`Unknown error status code ${this.code}`);
        }
        return retStatus;
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=ValidationError.js.map