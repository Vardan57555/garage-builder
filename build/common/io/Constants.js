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
}
exports.Constants = Constants;
//# sourceMappingURL=Constants.js.map