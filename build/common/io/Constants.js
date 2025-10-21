"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
class Constants {
    static SIGINT = "SIGINT";
    static SIGTERM = "SIGTERM";
    static UUIDV4 = "uuidv4";
    static MAX_STRING_LENGTH = 255;
    static SEPARATOR = "-";
    static DEFAULT_JWT_EXPIRATION = "1d";
    static DAY_IN_HOURS = 24 * 60 * 60;
    static X_API_KEY = "X-API-KEY";
    static CONTENT_TYPE = "Content-Type";
    static ACCEPT_ENCODING = "accept-encoding";
    static OBJECT = "object";
    static UNDEFINED = "undefined";
    static EMPTY_STRING = "";
    static NULL = null;
    static MAX_PAGE_SIZE = 100;
    static MIN_PAGE_SIZE = 1;
    static MATCHERS = {
        UUID_V4: /^[0-9(a-f|A-F)]{8}-[0-9(a-f|A-F)]{4}-4[0-9(a-f|A-F)]{3}-[89ab][0-9(a-f|A-F)]{3}-[0-9(a-f|A-F)]{12}$/i
    };
    static ENVIRONMENTS = {
        PRODUCTION: "production",
        STAGING: "staging",
        DEVELOPMENT: "development"
    };
    static ESCAPE_KEYS = [
        'map_id',
        'length',
        'width',
        'id',
        'peak_braces',
        'jtrim',
        'end_cross_bracing'
    ];
    static LABEL_NAMES = {
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
    static AGENT_TYPES = {
        STRUCTURED_CHAT: "structured-chat-zero-shot-react-description"
    };
    static PRICING_COMPONENTS = [
        { name: "End Panels", key: "end", extractor: (p) => p.end?.end_close_cost ?? 0 },
        { name: "Garage Door", key: "garage_door", extractor: (p) => p.garage_door?.cost ?? 0 },
    ];
    static ROOF_NAMES = {
        1: "Vertical",
        2: "Regular",
        3: "Boxed-Eave"
    };
    static ROOF_PRICE_KEYS = {
        1: 'vertical_roof_cost',
        3: 'box_style_cost'
    };
    static NUMERIC_FIELDS = ["width", "length", "height", "utility_length", "gauge"];
    static ROOF_TYPE_MAPPING = {
        vertical: 1,
        regular: 2,
        standard: 2,
        box: 3,
        boxed: 3,
        economy: 3,
    };
    static REQUIRED_FIELDS = [
        "width",
        "length",
        "height",
        "state_name",
        "roof_type",
        "gauge",
    ];
    static FIELD_PROMPTS = {
        garage_type: "What type of garage do you need?",
        width: "What width do you need for your garage (in feet)?",
        length: "What length do you need (in feet)?",
        height: "What height do you need (in feet)?",
        state_name: "Which state are you located in?",
        roof_type: "Which roof style would you prefer?\n  • Vertical (best weather protection)\n  • Regular (standard horizontal panels)\n  • Box (economy option)",
        manufacturer_name: "Do you have a preferred manufacturer? (optional, press Enter to use default)",
        utility_length: "Utility/lean-to length? (optional)",
        building_type: "Building type? (garage/carport/barn)",
        gauge: "Metal gauge preference? (12/14 or blank for standard)",
        is_barn: "Is this a barn style? (yes/no)",
    };
    static INTENT_PROMPT = `You are an intent classifier for a garage/building pricing service.
         Analyze if the user wants pricing for a garage, carport, barn, metal building, or any similar structure.
         Return ONLY "YES" if they want building pricing, or "NO" if it's just general chat.
         User input: "{input}"
         Answer (YES or NO):`.trim();
    static INTENT_KEYWORDS = new Set(["garage", "carport", "barn", "building", "price", "quote", "cost"]);
}
exports.Constants = Constants;
//# sourceMappingURL=Constants.js.map