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

const socketConfigSchema: ObjectSchema = joi.object().keys({
    socket_path: joi.string().required()
});

/**
 * Schema for the Postgres configuration.
 */
const postgresConfigSchema: ObjectSchema = joi.object().keys({
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

const authConfigSchema: ObjectSchema = joi.object().keys({
    clientId: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    clientSecret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    jwt_secret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    callbackUrl: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    sessionSecret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    frontend_url: joi.string().required(),
    reviro_host: joi.string().required()
});

/**
 * Schema for yandex configuration.
 */
const yandexAuthConfigSchema: ObjectSchema = joi.object().keys({
    clientId: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    clientSecret: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    callbackUrl: joi.string().max(Constants.MAX_STRING_LENGTH).required()
});

/**
 * Schema for reviews configuration.
 */
const placesConfigSchema: ObjectSchema = joi.object().keys({
    apiKey: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    review_page_url: joi.string().max(Constants.MAX_STRING_LENGTH).required(),
    reviews_callback_url: joi.string().max(Constants.MAX_STRING_LENGTH).required()
});

/**
 * Schema for OpenAi configuration.
 */
const openAiConfigSchema: ObjectSchema = joi.object().keys({
    apiKey: joi.string().max(Constants.MAX_STRING_LENGTH).required()
});

/**
 * Schema for stripe configuration.
 */
const stripeConfigSchema: ObjectSchema = joi.object().keys({
    secretKeyReviro: joi.string().required(),
    secretKeySocialWave: joi.string().required(),
    startupBoxFee: joi.number().required(),
    product_id: joi.string().required(),
    webhookSecret: joi.string().required()
});

/**
 * Schema for RabbitMQ connection configuration.
 */
const rabbitConnectionConfigSchema: ObjectSchema = joi.object().keys({
    host: joi.string().required(),
    heartbeatSeconds: joi.number().min(2).required(),
    reconnectSeconds: joi.number().min(2).required(),
    options: joi.object().keys({
        noDelay: joi.boolean().default(true),
        keepAlive: joi.boolean().default(true),
        clientProperties: joi.any()
    }).required()
});

/**
 * Schema for RabbitMQ system exchange configuration.
 */
const rabbitSystemExchangeConfigSchema: ObjectSchema = joi.object().keys({
    systemChangesExchangeName: joi.string().required(),
    metricsChangesExchangeName: joi.string().required(),
    exchangeType: joi.string().required(),
    systemChangesRoutingKey: joi.string().required(),
    paymentChangesRoutingKey: joi.string().required(),
    notificationChangesRoutingKey: joi.string().required(),
    metricsChangesRoutingKey: joi.string().required(),
    summarizeReviewChangesRoutingKey: joi.string().required(),
    outscraperWebhookChangesRoutingKey: joi.string().required(),
    fileGenerationChangesRoutingKey: joi.string().required()
});

/**
 * Schema for RabbitMQ queue configuration.
 */
const rabbitQueueSchema: ObjectSchema = joi.object().keys({
    notificationCommandQueue: joi.string().required(),
    paymentCommandQueue: joi.string().required(),
    metricsCommandQueue: joi.string().required(),
    outscraperWebhookCommandQueue: joi.string().required(),
    summarizeReviewCommandQueue: joi.string().required(),
    fileGenerationCommandQueue: joi.string().required()
});

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
 * Validates the socket configuration.
 *
 * @param data - The application configuration data to validate.
 * @returns The validation result.
 */
export function validateSocketConfig(data: {}): ValidationResult
{
    return setupValidator(data, socketConfigSchema);
}

/**
 * Validates the Postgres configuration.
 *
 * @param data - The Postgres configuration data to validate.
 * @returns The validation result.
 */
export function validatePostgresConfig(data: {}): ValidationResult
{
    return setupValidator(data, postgresConfigSchema);
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

/**
 * Schema for the authentication configuration.
 */
export function validateAuthConfig(data: {}): ValidationResult
{
    return setupValidator(data, authConfigSchema);
}

/**
 * Schema for the authentication configuration.
 */
export function validateYandexAuthConfig(data: {}): ValidationResult
{
    return setupValidator(data, yandexAuthConfigSchema);
}

/**
 * Schema for the reviews configuration.
 */
export function validateReviewsConfig(data: {}): ValidationResult
{
    return setupValidator(data, placesConfigSchema);
}

/**
 * Schema for the stripe configuration.
 */
export function validateStripeConfig(data: {}): ValidationResult
{
    return setupValidator(data, stripeConfigSchema);
}

/**
 * Schema for the OpenAI configuration.
 */
export function validateOpenAiConfig(data: {}): ValidationResult
{
    return setupValidator(data, openAiConfigSchema);
}

/**
 * Validates the RabbitMQ connection configuration.
 *
 * @param data - The RabbitMQ connection configuration data to validate.
 * @returns The validation result.
 */
export function validateRabbitConnectionConfig(data: {}): ValidationResult
{
    return setupValidator(data, rabbitConnectionConfigSchema);
}

/**
 * Validates the RabbitMQ system exchange configuration.
 *
 * @param data - The RabbitMQ system exchange configuration data to validate.
 * @returns The validation result.
 */
export function validateRabbitSystemExchangeConfig(data: {}): ValidationResult
{
    return setupValidator(data, rabbitSystemExchangeConfigSchema);
}

/**
 * Validates the RabbitMQ queue configuration.
 *
 * @param data - The RabbitMQ queue configuration data to validate.
 * @returns The validation result.
 */
export function validateRabbitQueueConfig(data: {}): ValidationResult
{
    return setupValidator(data, rabbitQueueSchema);
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
