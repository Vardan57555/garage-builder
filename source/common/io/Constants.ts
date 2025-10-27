import { GuidVersions } from "joi";
import {Dimensions, UserFriendlyParams} from "@agents/tools/io/IChat";
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
    public static readonly PRICING_COMPONENTS = [
        {
            name: "End Panels",
            key: "end",
            extractor: (pricing: any) => {
                if (!pricing.end) return 0;
                if (Array.isArray(pricing.end)) {
                    return pricing.end.reduce((sum: number, item: any) =>
                        sum + (item.end_close_cost ?? 0), 0
                    );
                }
                return pricing.end.end_close_cost ?? 0;
            }
        },
        {
            name: "Garage Door",
            key: "garage_door",
            extractor: (pricing: any) => {
                if (!pricing.garage_door) return 0;
                if (Array.isArray(pricing.garage_door)) {
                    return pricing.garage_door[0]?.cost ?? 0;
                }
                return pricing.garage_door.cost ?? 0;
            }
        },
        {
            name: "Garage Door Frameout",
            key: "garage_door_frameout",
            extractor: (pricing: any) => {
                if (!pricing.garage_door_frameout) return 0;
                if (Array.isArray(pricing.garage_door_frameout)) {
                    return pricing.garage_door_frameout.reduce((sum: number, item: any) =>
                        sum + (item.dutch_cost ?? 0), 0
                    );
                }
                return pricing.garage_door_frameout.dutch_cost ?? 0;
            }
        },
        {
            name: "Walkin Door Frameout",
            key: "walkin_door_frameout",
            extractor: (pricing: any) => {
                if (!pricing.walkin_door_frameout) return 0;
                if (Array.isArray(pricing.walkin_door_frameout)) {
                    return pricing.walkin_door_frameout.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.walkin_door_frameout.cost ?? 0;
            }
        },
        {
            name: "Window Frameout",
            key: "window_frameout",
            extractor: (pricing: any) => {
                if (!pricing.window_frameout) return 0;
                if (Array.isArray(pricing.window_frameout)) {
                    return pricing.window_frameout.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.window_frameout.cost ?? 0;
            }
        },
        {
            name: "Insulation",
            key: "insulation",
            extractor: (pricing: any) => {
                if (!pricing.insulation) return 0;
                if (Array.isArray(pricing.insulation)) {
                    return pricing.insulation[0]?.cost ?? 0;
                }
                return pricing.insulation.cost ?? 0;
            }
        },
        {
            name: "Certificate",
            key: "certificate",
            extractor: (pricing: any) => {
                if (!pricing.certificate) return 0;
                if (Array.isArray(pricing.certificate)) {
                    return pricing.certificate[0]?.cost ?? 0;
                }
                return pricing.certificate.cost ?? 0;
            }
        },
        {
            name: "Full Length Panel",
            key: "full_length_panel",
            extractor: (pricing: any) => {
                if (!pricing.full_length_panel) return 0;
                if (Array.isArray(pricing.full_length_panel)) {
                    return pricing.full_length_panel.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.full_length_panel.cost ?? 0;
            }
        },
        {
            name: "End Cross Bracing",
            key: "end_cross_bracing",
            extractor: (pricing: any) => {
                if (!pricing.end_cross_bracing) return 0;
                if (Array.isArray(pricing.end_cross_bracing)) {
                    return pricing.end_cross_bracing.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.end_cross_bracing.cost ?? 0;
            }
        },
        {
            name: "Side Cross Bracing",
            key: "side_cross_bracing",
            extractor: (pricing: any) => {
                if (!pricing.side_cross_bracing) return 0;
                if (Array.isArray(pricing.side_cross_bracing)) {
                    return pricing.side_cross_bracing.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.side_cross_bracing.cost ?? 0;
            }
        },
        {
            name: "Side Panels (Full Length)",
            key: "full_length_side",
            extractor: (pricing: any) => {
                if (!pricing.full_length_side) return 0;
                if (Array.isArray(pricing.full_length_side)) {
                    return pricing.full_length_side.reduce((sum: number, item: any) =>
                            sum + (
                                (item.leg_height_cost ?? 0) +
                                (item.side_close_cost ?? 0)
                            ), 0
                    );
                }
                return (pricing.full_length_side.leg_height_cost ?? 0) +
                    (pricing.full_length_side.side_close_cost ?? 0);
            }
        },
        {
            name: "Roof Pitch",
            key: "roof_pitch",
            extractor: (pricing: any) => {
                if (!pricing.roof_pitch) return 0;
                if (Array.isArray(pricing.roof_pitch)) {
                    return pricing.roof_pitch.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.roof_pitch.cost ?? 0;
            }
        },
        {
            name: "Connection Fees",
            key: "connection_fees",
            extractor: (pricing: any) => {
                if (!pricing.connection_fees) return 0;
                if (Array.isArray(pricing.connection_fees)) {
                    return pricing.connection_fees.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? 0), 0
                    );
                }
                return pricing.connection_fees.cost ?? 0;
            }
        },
        {
            name: "Bows",
            key: "bows",
            extractor: (pricing: any) => {
                if (!pricing.bows) return 0;
                if (Array.isArray(pricing.bows)) {
                    return pricing.bows.length > 0
                        ? (pricing.bows[0].double_leg ?? pricing.bows[0].cost ?? 0)
                        : 0;
                }
                return pricing.bows.double_leg ?? pricing.bows.cost ?? 0;
            }
        },
        {
            name: "Braces",
            key: "braces",
            extractor: (pricing: any) => {
                if (!pricing.braces) return 0;
                if (Array.isArray(pricing.braces)) {
                    return pricing.braces.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.bracing_cost ?? item.price ?? 0), 0
                    );
                }
                return pricing.braces.cost ?? pricing.braces.bracing_cost ?? pricing.braces.price ?? 0;
            }
        },
        {
            name: "Trusses",
            key: "trusses",
            extractor: (pricing: any) => {
                if (!pricing.trusses) return 0;
                if (Array.isArray(pricing.trusses)) {
                    return pricing.trusses.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.truss_cost ?? item.truss ?? item.price ?? 0), 0
                    );
                }
                return pricing.trusses.cost ?? pricing.trusses.truss_cost ?? pricing.trusses.truss ?? pricing.trusses.price ?? 0;
            }
        },
        {
            name: "Addons",
            key: "addons",
            extractor: (pricing: any) => {
                if (!pricing.addons) return 0;
                if (Array.isArray(pricing.addons)) {
                    return pricing.addons.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.addon_cost ?? item.price ?? 0), 0
                    );
                }
                return pricing.addons.cost ?? pricing.addons.addon_cost ?? pricing.addons.price ?? 0;
            }
        },
        {
            name: "Addons Width",
            key: "addons_width",
            extractor: (pricing: any) => {
                if (!pricing.addons_width) return 0;
                if (Array.isArray(pricing.addons_width)) {
                    return pricing.addons_width.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.addon_cost ?? item.price ?? 0), 0
                    );
                }
                return pricing.addons_width.cost ?? pricing.addons_width.addon_cost ?? pricing.addons_width.price ?? 0;
            }
        },
        {
            name: "Anchors",
            key: "anchors_cost",
            extractor: (pricing: any) => {
                if (!pricing.anchors_cost) return 0;
                if (Array.isArray(pricing.anchors_cost)) {
                    return pricing.anchors_cost.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.anchor_cost ?? item.price ?? 0), 0
                    );
                }
                return pricing.anchors_cost.cost ?? pricing.anchors_cost.anchor_cost ?? pricing.anchors_cost.price ?? 0;
            }
        },
        {
            name: "Additional Features",
            key: "additional_features",
            extractor: (pricing: any) => {
                if (!pricing.additional_features) return 0;

                if (pricing.additional_features.cost_type === '%') {
                    return 0; // Don't double-count; this is handled separately
                }

                if (Array.isArray(pricing.additional_features)) {
                    return pricing.additional_features.reduce((sum: number, item: any) =>
                        sum + (item.cost ?? item.price ?? 0), 0
                    );
                }
                return pricing.additional_features.cost ?? pricing.additional_features.price ?? 0;
            }
        }
    ]

    public static readonly ROOF_NAMES: Record<number, string> = {
        1: "Vertical",
        2: "Regular",
        3: "Boxed-Eave"
    };
    public static readonly ROOF_PRICE_KEYS: Record<number, string> = {
        1: 'vertical_roof_cost',
        3: 'box_style_cost'
    };

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
        "building_type"
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
    public static readonly BUILDING_ID_MAP: Record<string, number> = {
        'garage': 1,
        'carport': 1,
        'standard': 1,
        '1': 1,
        'lean': 2,
        'lean-to': 2,
        'leantos': 2,
        '2': 2,
        'triple': 3,
        'triple wide': 3,
        '3': 3,
        'rv': 4,
        'rv cover': 4,
        '4': 4,
        'commercial': 6,
        '6': 6,
        'custom': 7,
        '7': 7,
        'clear': 8,
        'clear span': 8,
        'free standing': 8,
        '8': 8,
        'risk': 9,
        'risk ii': 9,
        '9': 9,
    };

    public static readonly GARAGE_TYPE_PATTERNS = [
        [/\b1\s*(?:car|bay)\b|\bone\s*(?:car|bay)\b/i, "1 car garage"],
        [/\b2\s*(?:car|bay)\b|\btwo\s*(?:car|bay)\b/i, "2 car garage"],
        [/\b3\s*(?:car|bay)\b|\bthree\s*(?:car|bay)\b/i, "3 car garage"],
        [/truck\s*garage|garage.*truck|heavy.*truck/i, "truck garage"],
        [/rv\s*garage|rv\s*(?:carport|shelter)|garage.*rv/i, "RV garage"],
        [/barn/i, "barn"],
    ] as const;


    public static readonly SERVICE_COSTS = {
        LABOR_PERCENTAGE: 0.5,
        FOUNDATION_COST_PER_SQFT: 8.5,
        DELIVERY_FLAT_RATE: 750,
        CONTINGENCY_PERCENTAGE: 0.05,
    } as const;

    public static readonly NUMERIC_FIELDS = ["width", "length", "height", "utility_length", "gauge"] as const;

    public static readonly STANDARD_DIMENSIONS: Record<string, Dimensions> = {
        "1 car garage": { width: 12, length: 20, height: 10 },
        "2 car garage": { width: 20, length: 20, height: 10 },
        "3 car garage": { width: 30, length: 20, height: 10 },
        "truck garage": { width: 16, length: 24, height: 12 },
        "rv garage": { width: 14, length: 40, height: 12 },
        barn: { width: 30, length: 40, height: 14 },
        garage: { width: 20, length: 20, height: 10 },
    };

    public static readonly STATE_PATTERNS: Record<string, string> = {
        "texas|tx": "Texas",
        "california|ca": "California",
        "florida|fl": "Florida",
        "new york|ny": "New York",
        "pennsylvania|pa": "Pennsylvania",
        "illinois|il": "Illinois",
        "ohio|oh": "Ohio",
        "georgia|ga": "Georgia",
        "north carolina|nc": "North Carolina",
        "michigan|mi": "Michigan",
        "new jersey|nj": "New Jersey",
        "virginia|va": "Virginia",
        "washington|wa": "Washington",
        "arizona|az": "Arizona",
        "massachusetts|ma": "Massachusetts",
        "tennessee|tn": "Tennessee",
        "maryland|md": "Maryland",
        "missouri|mo": "Missouri",
        "wisconsin|wi": "Wisconsin",
        "colorado|co": "Colorado",
        "minnesota|mn": "Minnesota",
        "south carolina|sc": "South Carolina",
        "alabama|al": "Alabama",
        "louisiana|la": "Louisiana",
        "kentucky|ky": "Kentucky",
        "oregon|or": "Oregon",
        "oklahoma|ok": "Oklahoma",
        "connecticut|ct": "Connecticut",
        "iowa|ia": "Iowa",
        "nevada|nv": "Nevada",
        "arkansas|ar": "Arkansas",
        "mississippi|ms": "Mississippi",
        "kansas|ks": "Kansas",
        "utah|ut": "Utah",
        "new mexico|nm": "New Mexico",
        "nebraska|ne": "Nebraska",
        "idaho|id": "Idaho",
        "maine|me": "Maine",
        "montana|mt": "Montana",
        "rhode island|ri": "Rhode Island",
        "delaware|de": "Delaware",
        "south dakota|sd": "South Dakota",
        "north dakota|nd": "North Dakota",
        "alaska|ak": "Alaska",
        "hawaii|hi": "Hawaii",
        "wyoming|wy": "Wyoming",
        "vermont|vt": "Vermont",
        "new hampshire|nh": "New Hampshire",
        "west virginia|wv": "West Virginia",
    };
}
