"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAppConfig = validateAppConfig;
exports.validateMySqlConfig = validateMySqlConfig;
exports.validateRedisConfig = validateRedisConfig;
const Constants_1 = require("../../common/io/Constants");
const SetupValidator_1 = require("../../utils/validator/SetupValidator");
const joi_1 = __importDefault(require("joi"));
const appConfigSchema = joi_1.default.object().keys({
    port: joi_1.default.number().greater(0).required(),
    debug: joi_1.default.boolean().default(false),
    start_delay: joi_1.default.number().integer().min(0).required(),
    name: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).required(),
    origins: joi_1.default.object().keys({
        enabled: joi_1.default.boolean().default(false),
        domains: joi_1.default.array().items(joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH)).default([])
    }).required(),
    k8s: joi_1.default.object().keys({
        readiness: joi_1.default.object().keys({
            period: joi_1.default.number().greater(0).required(),
            threshold: joi_1.default.number().greater(0).required()
        }).required(),
        liveness: joi_1.default.object().keys({
            period: joi_1.default.number().greater(0).required(),
            threshold: joi_1.default.number().greater(0).required()
        }).required()
    }).required()
});
const mySqlConfigSchema = joi_1.default.object().keys({
    host: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).hostname().required(),
    port: joi_1.default.number().integer().min(1).max(65535).required(),
    username: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).min(1).required(),
    password: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).min(1).required(),
    database: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).min(1).required(),
    dialect: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).required(),
    logging: joi_1.default.boolean().required(),
    pool: joi_1.default.object().keys({
        max: joi_1.default.number().integer().min(1).required(),
        min: joi_1.default.number().integer().min(0).required(),
        acquire: joi_1.default.number().integer().min(1).required(),
        idle: joi_1.default.number().integer().min(1).required()
    }).required(),
    retry: joi_1.default.object().keys({
        max_retry: joi_1.default.number().integer().min(1).required(),
        match_options: joi_1.default.array().items(joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH)).required()
    }).required()
});
const redisConfigSchema = joi_1.default.object().keys({
    host: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).hostname().required(),
    port: joi_1.default.number().integer().min(1).max(65535).required(),
    password: joi_1.default.string().max(Constants_1.Constants.MAX_STRING_LENGTH).min(1).required(),
    timeout: joi_1.default.number().integer().min(1).required(),
    isLazyConnect: joi_1.default.boolean().required()
});
function validateAppConfig(data) {
    return (0, SetupValidator_1.setupValidator)(data, appConfigSchema);
}
function validateMySqlConfig(data) {
    return (0, SetupValidator_1.setupValidator)(data, mySqlConfigSchema);
}
function validateRedisConfig(data) {
    return (0, SetupValidator_1.setupValidator)(data, redisConfigSchema);
}
//# sourceMappingURL=ConfigValidator.js.map