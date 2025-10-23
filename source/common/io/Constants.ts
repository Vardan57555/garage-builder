import { GuidVersions } from "joi";
import {PricingComponent, UserFriendlyParams} from "@agents/tools/io/IChat";
import {SessionConfig} from "@utils/session/io/ISession";

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
    public static readonly EMPTY_STRING: "" = "";
    public static readonly NULL: null = null;
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
    public static readonly PRICING_COMPONENTS: PricingComponent[] = [
        { name: "End Panels", key: "end", extractor: (p) => p.end?.end_close_cost ?? 0 },
        { name: "Garage Door", key: "garage_door", extractor: (p) => p.garage_door?.cost ?? 0 },
    ];
    public static readonly ROOF_NAMES: Record<number, string> = {
        1: "Vertical",
        2: "Regular",
        3: "Boxed-Eave"
    };
    public static readonly ROOF_PRICE_KEYS: Record<number, string> = {
        1: 'vertical_roof_cost',
        3: 'box_style_cost'
    };
    public static readonly NUMERIC_FIELDS: (keyof UserFriendlyParams)[] =
        ["width", "length", "height", "utility_length", "gauge"];
    public static readonly ROOF_TYPE_MAPPING: Record<string, number> = {
        vertical: 1,
        regular: 2,
        standard: 2,
        box: 3,
        boxed: 3,
        economy: 3,
    };
    public static readonly REQUIRED_FIELDS: (keyof UserFriendlyParams)[] = [
        "width",
        "length",
        "height",
        "state_name",
        "roof_type",
        "gauge",
    ]
    public static readonly FIELD_PROMPTS: Record<keyof UserFriendlyParams, string> = {
        garage_type: "What type of garage do you need?",
        width: "What width do you need for your garage (in feet)?",
        length: "What length do you need (in feet)?",
        height: "What height do you need (in feet)?",
        state_name: "Which state are you located in?",
        roof_type:
            "Which roof style would you prefer?\n  • Vertical (best weather protection)\n  • Regular (standard horizontal panels)\n  • Box (economy option)",
        manufacturer_name:
            "Do you have a preferred manufacturer? (optional, press Enter to use default)",
        utility_length: "Utility/lean-to length? (optional)",
        building_type: "Building type? (garage/carport/barn)",
        gauge: "Metal gauge preference? (12/14 or blank for standard)",
        is_barn: "Is this a barn style? (yes/no)",
    };
    public static readonly INTENT_PROMPT: string = `You are an intent classifier for a garage/building pricing service.
         Analyze if the user wants pricing for a garage, carport, barn, metal building, or any similar structure.
         Return ONLY "YES" if they want building pricing, or "NO" if it's just general chat.
         User input: "{input}"
         Answer (YES or NO):`.trim();

    public static readonly INTENT_KEYWORDS: Set<string> = new Set(["garage", "carport", "barn", "building", "price", "quote", "cost"]);
    public static readonly DEFAULT_CONFIG: SessionConfig = {
        SESSION_TIMEOUT: 30 * 60 * 1000,
        CLEANUP_INTERVAL: 5 * 60 * 1000,
        WARNING_THRESHOLD: 5 * 60 * 1000,
    };
}
