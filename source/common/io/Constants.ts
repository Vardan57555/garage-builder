import { GuidVersions } from "joi";
import {PricingComponent} from "@agents/tools/io/IChat";

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
    public static readonly ESCAPE_KEYS: string[] = [
        'map_id',
        'length',
        'width',
        'id',
        'peak_braces',
        'jtrim',
        'end_cross_bracing'
    ];

    public static readonly LABEL_NAMES: Record<string, string> = {
        fourth_center_cost: "4ft on Center",
        risk_cost: "Risk Category II",
        cert_pac_cost: "Certification Package",
        ground_certificate: "Ground Certification",
        overhang: "1' Overhang on Sides",
        jtrim: "J-Trims",
        interior_anchor: "Interior Anchor",
        peak_braces: "Peak Braces",
        end_cross_bracing: "End Cross Bracing"
    };
    public static readonly AGENT_TYPES = {
        STRUCTURED_CHAT: "structured-chat-zero-shot-react-description"
    } as const;

    public static readonly PRICING_COMPONENTS: PricingComponent[] = [
        { name: "End Panels", key: "end", extractor: (p) => p.end?.end_close_cost ?? 0 },
        { name: "Garage Door", key: "garage_door", extractor: (p) => p.garage_door?.cost ?? 0 },
    ];
}
