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
 * Schema for the Auth configuration.
 */

const authConfigSchema: ObjectSchema = joi.object().keys({
    jwt_secret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    callbackUrl: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    sessionSecret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    frontend_url: joi.string().required(),
    reviro_host: joi.string().required()
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
 * Schema for OpenAi configuration.
 */
const openAiConfigSchema: ObjectSchema = joi.object().keys({
    apiKey: joi.string().max(Constants.MAX_STRING_LENGTH).required()
});


/**
 * Schema for the authentication configuration.
 */
export function validateAuthConfig(data: {}): ValidationResult
{
    return setupValidator(data, authConfigSchema);
}

/**
 * Schema for onboarding configuration.
 */
const onboardingConfigSchema: ObjectSchema = joi.object().keys({
    self_onboarding_host: joi.string().required(),
    request_body_limit: joi.string().required()
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
 * Schema for the OpenAI configuration.
 */
export function validateOpenAiConfig(data: {}): ValidationResult
{
    return setupValidator(data, openAiConfigSchema);
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
 * Validates the onboarding configuration.
 *
 * @param data - The onboarding configuration data to validate.
 * @returns The validation result.
 */
export function validateCommonConfig(data: {}): ValidationResult
{
    return setupValidator(data, onboardingConfigSchema);
}
