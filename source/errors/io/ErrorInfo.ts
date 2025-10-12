/**
 * Error information object.
 */
export interface ErrorInfo
{
    name?: string;
    code?: string;
    service?: string;
    timestamp?: number;
    forwarded?: string[];
    message?: string;
    fields?: string[];
    info?: Record<string, any>;
    stack?: string | string[];
}

/**
 * Enum for different resource types.
 */
export enum ResourceTypes
{
    CUSTOMER = "CUSTOMER",
    USER = "USER",
    REVIEWER = "REVIEWER",
    COMPANY = "COMPANY",
    LOCATION = "LOCATION",
    PARTNER = "PARTNER",
    GROUP = "GROUP",
    ROLE = "ROLE",
    PERMISSION = "PERMISSION",
    ITEM = "ITEM",
    ORDER = "ORDER",
}
