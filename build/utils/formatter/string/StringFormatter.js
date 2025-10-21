"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StringFormatter = void 0;
const Log_1 = require("../../logger/Log");
const logger = (0, Log_1.createLogger)(module);
class StringFormatter {
    static toJson(dataRaw) {
        try {
            return JSON.parse(dataRaw);
        }
        catch (err) {
            logger.error(`Failed to parse message as JSON: '${dataRaw}'`);
            return null;
        }
    }
    static toBase64(data) {
        try {
            return data.toString("base64");
        }
        catch (err) {
            logger.error(`Failed to parse message as base64: '${data}'`);
            return null;
        }
    }
}
exports.StringFormatter = StringFormatter;
//# sourceMappingURL=StringFormatter.js.map