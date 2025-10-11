import { GuidVersions } from "joi";

/**
 * Global constants for the application.
 */
export class Constants
{
    /**
     * WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING:
     * Do not change the INTERNAL_PARTNER_ID value as it is used in the database.
     * It is used to identify the internal partner in the system.
     * It is used in the database as a foreign key reference.
     * WARNING WARNING WARNING WARNING WARNING WARNING WARNING WARNING:
     */
    public static readonly INTERNAL_PARTNER_ID: string = "internal-admin-partner-id";
    public static readonly GOOGLE_URL: string = "www.google.com";
    public static readonly SIGINT: string = "SIGINT";
    public static readonly SIGTERM: string = "SIGTERM";
    public static readonly UUIDV4: GuidVersions | GuidVersions[] = "uuidv4";
    public static readonly MAX_STRING_LENGTH: number = 255;
    public static readonly SEPARATOR: boolean | "-" | ":" = "-";
    public static readonly DEFAULT_JWT_EXPIRATION: string = "1d";
    public static readonly DAY_IN_HOURS: number = 24 * 60 * 60;
    public static readonly X_API_KEY: string = "X-API-KEY";
    public static readonly CONTENT_TYPE: string = "Content-Type";
    public static readonly ACCEPT_ENCODING: string = "accept-encoding";
    public static readonly OBJECT: string = "object";
    public static readonly UNDEFINED: string = "undefined";
    public static readonly EMPTY_STRING: "" = "";
    public static readonly NULL: null = null;
    public static readonly MAX_PAGE_SIZE: number = 100;
    public static readonly MIN_PAGE_SIZE: number = 1;
    public static readonly MATCHERS: Record<string, RegExp> = {
        UUID_V4: /^[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}$/i
    };
    public static readonly ENVIRONMENTS: Record<string, string> = {
        PRODUCTION: "production",
        STAGING: "staging",
        DEVELOPMENT: "development"
    };
    public static readonly DEFAULTS: Record<string, any> = {
        COMPANY_NAME: "DEFAULT_COMPANY_NAME",
        SOCIAL_CONTRIBUTION_FEE: "1.00"
    };
    public static readonly AGENT_TYPES = {
        STRUCTURED_CHAT: "structured-chat-zero-shot-react-description"
    } as const;
}
