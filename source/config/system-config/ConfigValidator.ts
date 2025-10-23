import { Constants } from "@common/io/Constants";
import { setupValidator } from "@utils/validator/SetupValidator";
import joi, { ObjectSchema, ValidationResult } from "joi";

/**
 * Schema for application configuration.
 */
const appConfigSchema: ObjectSchema = joi.object().keys({
    port: joi.number().greater(0).required(),
    debug: joi.boolean().default(false),
    start_delay: joi.number().integer().min(0).required(),
    name: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    origins: joi.object().keys({
        enabled: joi.boolean().default(false),
        domains: joi.array().items(joi.string().max(Constants.MAX_STRING_LENGTH)).default([])
    }).required(),
    k8s: joi.object().keys({
        readiness: joi.object().keys({
            period: joi.number().greater(0).required(),
            threshold: joi.number().greater(0).required()
        }).required(),
        liveness: joi.object().keys({
            period: joi.number().greater(0).required(),
            threshold: joi.number().greater(0).required()
        }).required()
    }).required()
});

/**
 * Schema for the MySQL configuration.
 */
const mySqlConfigSchema: ObjectSchema = joi.object().keys({
    host: joi.string().max(Constants.MAX_STRING_LENGTH).hostname().required(),
    port: joi.number().integer().min(1).max(65535).required(),
    username: joi.string().max(Constants.MAX_STRING_LENGTH).min(1).required(),
    password: joi.string().max(Constants.MAX_STRING_LENGTH).min(1).required(),
    database: joi.string().max(Constants.MAX_STRING_LENGTH).min(1).required(),
    dialect: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    logging: joi.boolean().required(),
    pool: joi.object().keys({
        max: joi.number().integer().min(1).required(),
        min: joi.number().integer().min(0).required(),
        acquire: joi.number().integer().min(1).required(),
        idle: joi.number().integer().min(1).required()
    }).required(),
    retry: joi.object().keys({
        max_retry: joi.number().integer().min(1).required(),
        match_options: joi.array().items(joi.string().max(Constants.MAX_STRING_LENGTH)).required()
    }).required()
});


/**
 * Schema for Redis configuration.
 */
const redisConfigSchema: ObjectSchema = joi.object().keys({
    host: joi.string().max(Constants.MAX_STRING_LENGTH).hostname().required(),
    port: joi.number().integer().min(1).max(65535).required(),
    password: joi.string().max(Constants.MAX_STRING_LENGTH).min(1).required(),
    timeout: joi.number().integer().min(1).required(),
    isLazyConnect: joi.boolean().required()
});

/**
 * Validates the application configuration.
 *
 * @param data - The application configuration data to validate.
 * @returns The validation result.
 */
export function validateAppConfig(data: {}): ValidationResult
{
    return setupValidator(data, appConfigSchema);
}

/**
 * Validates the MySQL configuration.
 *
 * @param data - The MySQL configuration data to validate.
 * @returns The validation result.
 */
export function validateMySqlConfig(data: {}): ValidationResult
{
    return setupValidator(data, mySqlConfigSchema);
}

/**
 * Validates the Redis configuration.
 *
 * @param data - The Redis configuration data to validate.
 * @returns The validation result.
 */
export function validateRedisConfig(data: {}): ValidationResult
{
    return setupValidator(data, redisConfigSchema);
}
