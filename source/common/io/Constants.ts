import { GuidVersions } from "joi";
import {Dimensions, UserFriendlyParams} from "@agents/tools/io/IChat";
import {SessionConfig} from "@utils/session/io/ISession";
import {ColorOption, DataSource} from "@agents/tools/io/IColorChoice";
import {FieldConfig} from "@agents/tools/io/IChoiceHandler";
import {DetectionPattern} from "@agents/tools/io/IDetectBuilding";
import {FieldExtractionConfig} from "@agents/tools/io/IParameterUpdate";

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
                    return 0;
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
        "building_type",
        "color"
    ];

    public static readonly DEFAULT_CONFIG: SessionConfig = {
        SESSION_TIMEOUT: 30 * 60 * 1000,
        CLEANUP_INTERVAL: 5 * 60 * 1000,
        WARNING_THRESHOLD: 5 * 60 * 1000,
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

    public static readonly FALLBACK_COLORS: ColorOption[] = [
        {
            id: 1,
            name: "White",
            hex_value: "#ffffff",
            red_value: 255,
            green_value: 255,
            blue_value: 255,
            cost: 0,
        },
        {
            id: 2,
            name: "Black",
            hex_value: "#313232",
            red_value: 49,
            green_value: 50,
            blue_value: 50,
            cost: 0,
        },
        {
            id: 3,
            name: "Barn Red",
            hex_value: "#6A2210",
            red_value: 106,
            green_value: 34,
            blue_value: 16,
            cost: 250,
        },
        {
            id: 4,
            name: "Burgundy",
            hex_value: "#452210",
            red_value: 69,
            green_value: 34,
            blue_value: 34,
            cost: 200,
        },
        {
            id: 5,
            name: "Royal Blue",
            hex_value: "#1D548B",
            red_value: 29,
            green_value: 84,
            blue_value: 139,
            cost: 250,
        },
        {
            id: 6,
            name: "Evergreen",
            hex_value: "#1E3C22",
            red_value: 30,
            green_value: 60,
            blue_value: 34,
            cost: 200,
        },
        {
            id: 7,
            name: "Pewter Gray",
            hex_value: "#979290",
            red_value: 151,
            green_value: 146,
            blue_value: 144,
            cost: 150,
        },
        {
            id: 8,
            name: "Clay",
            hex_value: "#99846F",
            red_value: 153,
            green_value: 132,
            blue_value: 111,
            cost: 180,
        },
        {
            id: 9,
            name: "Pebble Beige",
            hex_value: "#fae4bb",
            red_value: 250,
            green_value: 228,
            blue_value: 187,
            cost: 150,
        },
        {
            id: 10,
            name: "Earth Brown",
            hex_value: "#4D331B",
            red_value: 77,
            green_value: 51,
            blue_value: 27,
            cost: 200,
        },
    ];

    public static readonly COLOR_CATEGORIES: Record<string, string[]> = {
        "🔴 Reds": ["Red", "Barn", "Burgundy", "Crimson", "Cardinal", "Pink"],
        "🔵 Blues": ["Blue", "Navy", "Slate", "King", "Royal", "Hawaiian"],
        "🟢 Greens": ["Green", "Evergreen", "Forest"],
        "⚫ Grays": ["Gray", "Grey", "Pewter", "Quaker", "Charcoal", "Zinc"],
        "⚪ Neutrals": ["White", "Black", "Beige", "Tan", "Sandstone", "Clay", "Brown"],
        "🟤 Earth": ["Earth", "Rawhide", "Copper", "Koko"],
    };

    public static readonly DATA_SOURCES: DataSource[] = [
    { name: "getColor()", query: "CALL getColor()", context: "colors_from_procedure" },
    { name: "data_colors", query: "SELECT * FROM data_colors ORDER BY name", context: "data_colors_direct" },
    { name: "colors table", query: "SELECT * FROM colors ORDER BY name", context: "colors_table" },
    ];

    public static readonly DEFAULT_FIELDS: FieldConfig[] = [
    {
        name: "roof_type",
        options: [
            {
                value: "vertical",
                label: "Vertical",
                description: "Best weather protection",
            },
            {
                value: "regular",
                label: "Regular",
                description: "Standard horizontal panels",
            },
            { value: "box", label: "Box", description: "Economy option" },
        ],
    },
    {
        name: "building_type",
        options: [
            { value: "garage", label: "Garage", description: "Standard garage" },
            { value: "shed", label: "Shed", description: "Storage shed" },
            { value: "barn", label: "Barn", description: "Agricultural barn" },
        ],
    },
    {
        name: "garage_type",
        options: [
            {
                value: "1-car",
                label: "1-car",
                description: "Single car garage",
            },
            { value: "2-car", label: "2-car", description: "Two car garage" },
            { value: "3-car", label: "3-car", description: "Three car garage" },
        ],
    },
];

    /**
     * Pattern library for building type detection
     * High confidence: explicit type mentions (garage, shed, barn)
     * Medium confidence: generic descriptors (structure, metallic building)
     */

    public static readonly DETECTION_PATTERNS: DetectionPattern[] = [
        { pattern: /\bgarage\b/i, type: "garage", confidence: "high" },
        { pattern: /\bshed\b/i, type: "shed", confidence: "high" },
        { pattern: /\bbarn\b/i, type: "barn", confidence: "high" },
        { pattern: /\bmetallic?\s+building\b/i, type: "garage", confidence: "medium" },
        { pattern: /\bstructure\b/i, type: "garage", confidence: "medium" },
    ];

    static readonly INDECISION_PATTERNS = [
        /\b(any|whatever|anyways|idk|i don't know|doesn't matter|don't care|idc|no preference|surprise me|you pick|all the same|doesn't matter|whatever's fine)\b/i,
        /^(any|whatever|idk|hmm|um|uh)$/i,
    ] as const;

    static readonly CODE_INDICATORS = [
        "def ",
        "import ",
        "```",
        "function ",
        "const ",
        "let ",
        "class ",
        ".replace",
        "pattern ",
        "regex",
    ] as const;

    static readonly NULL_VALUES = ["null", "", "undefined", "none"] as const;

    static readonly VALID_GAUGES = [14, 16, 18, 20] as const;

    static readonly FIELD_DEFAULTS: Record<keyof UserFriendlyParams, any> = {
        roof_type: "regular",
        gauge: 16,
        building_type: "garage",
        state_name: null,
        width: null,
        length: null,
        height: null,
        garage_type: null,
        manufacturer_name: null,
        utility_length: null,
        is_barn: null,
        color: undefined,
        color_hex: undefined,
    };

    static readonly FIELD_EXTRACTION_CONFIGS: Record<
        keyof UserFriendlyParams,
        FieldExtractionConfig
    > = {
        width: {
            instructions: "Extract WIDTH in feet as a number. Valid range: 1-100.",
            examples:
                'USER: "change width to 20" → OUTPUT: 20\nUSER: "make it 30 feet" → OUTPUT: 30',
        },
        length: {
            instructions: "Extract LENGTH in feet as a number. Valid range: 1-200.",
            examples:
                'USER: "30 feet long" → OUTPUT: 30\nUSER: "length 40" → OUTPUT: 40',
        },
        height: {
            instructions: "Extract HEIGHT in feet as a number. Valid range: 1-30.",
            examples:
                'USER: "12 feet tall" → OUTPUT: 12\nUSER: "height 10" → OUTPUT: 10',
        },
        gauge: {
            instructions:
                'Extract GAUGE as a number. VALID ONLY: 14, 16, 18, 20. If user says "any"/"idk"/etc, return 16 (default).',
            examples:
                'USER: "14GA" → OUTPUT: 14\nUSER: "gauge 18" → OUTPUT: 18\nUSER: "any" → OUTPUT: 16',
        },
        state_name: {
            instructions:
                "Extract STATE NAME as text. Examples: Texas, California, New York",
            examples:
                'USER: "I\'m in Texas" → OUTPUT: Texas\nUSER: "California" → OUTPUT: California',
        },
        roof_type: {
            instructions:
                'Extract ROOF TYPE. VALID ONLY: vertical, regular, box, a-frame. If user says "any"/"idk"/etc, return "regular" (default).',
            examples:
                'USER: "I want vertical" → OUTPUT: vertical\nUSER: "box roof" → OUTPUT: box\nUSER: "any" → OUTPUT: regular',
        },
        building_type: {
            instructions:
                'Extract BUILDING TYPE. Valid: garage, shed, barn. If user says "any"/"idk"/etc, return "garage" (default).',
            examples:
                'USER: "make it 3 car" → OUTPUT: 3-car\nUSER: "any" → OUTPUT: garage',
        },
        garage_type: {
            instructions: "Extract GARAGE TYPE",
            examples: "OUTPUT: value",
        },
        manufacturer_name: {
            instructions: "Extract MANUFACTURER NAME",
            examples: "OUTPUT: value",
        },
        utility_length: {
            instructions: "Extract UTILITY LENGTH",
            examples: "OUTPUT: value",
        },
        is_barn: {
            instructions: "Extract IS BARN",
            examples: "OUTPUT: value",
        },
        color: {
            instructions: "Extract COLOR",
            examples: "OUTPUT: value",
        },
        color_hex: {
            instructions: "Extract COLOR HEX",
            examples: "OUTPUT: value",
        },
    };

    static readonly PRICING_CONSTANTS = {
        DEFAULT_MAP_ID: 1,
        DEFAULT_MANUFACTURER_ID: 1,
        DEFAULT_ROOF_ID: 2,
        DEFAULT_GAUGE: 14,
        LABOR_MULTIPLIER: 0.5,
        FOUNDATION_COST_PER_SQFT: 8.5,
        DELIVERY_COST: 750,
        CONTINGENCY_RATE: 0.05,
    } as const;

    static readonly ERROR_MESSAGES = {
        CONVERSION_FAILED: "❌ Failed to convert parameters to technical format.",
        PRICE_CALCULATION_FAILED: "❌ Failed to calculate price.",
        UNKNOWN_ERROR: (message: string) => `❌ Failed to calculate price: ${message}`,
    } as const;
}
