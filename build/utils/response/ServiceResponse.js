"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceResponse = void 0;
const Log_1 = require("../logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ServiceResponse {
    _originalResponse;
    _status = 200;
    _outcome = null;
    _pages;
    _success = true;
    _errors = [];
    constructor(response, success = true) {
        this._originalResponse = response;
        this._success = success;
    }
    setStatus(status) {
        this._status = status;
        return this;
    }
    setOutcome(data, pages, errors) {
        this._outcome = data;
        if (errors && errors.length > 0) {
            this._errors = errors;
        }
        if (pages != null) {
            this._pages = pages;
        }
        return this;
    }
    send() {
        if (this._originalResponse) {
            const responseData = {
                success: this._success,
                data: this._outcome || undefined,
                errors: this._errors.length ? this._errors : undefined
            };
            if (this._pages) {
                responseData.pages = this._pages;
            }
            this._originalResponse.status(this._status).json(responseData);
            this.clear();
        }
        else {
            logger.warn("ServiceResponse already closed, response has been sent.");
        }
        return this;
    }
    clear() {
        this._originalResponse = null;
        this._outcome = null;
        this._errors = [];
    }
}
exports.ServiceResponse = ServiceResponse;
//# sourceMappingURL=ServiceResponse.js.map