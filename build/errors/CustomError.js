"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomError = void 0;
class CustomError extends Error {
    status;
    code;
    name;
    message;
    data;
    info;
    fields;
    constructor(name, message = "", code, fields, info, data) {
        super(message);
        this.name = name;
        this.message = message;
        this.code = code;
        this.fields = fields;
        this.data = data;
        this.info = info;
        Error.captureStackTrace(this, this.constructor);
    }
}
exports.CustomError = CustomError;
//# sourceMappingURL=CustomError.js.map