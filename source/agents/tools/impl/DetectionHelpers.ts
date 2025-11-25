import { UserFriendlyParams } from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * Detection result with field and value
 */
interface DetectionResult {
    field: keyof UserFriendlyParams;
    value: any;
}

/**
 * RESET_PATTERNS: Keywords indicating conversation reset
 */
const RESET_PATTERNS = [
    /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
    /\b(quit|exit|done with this)\b/i,
];

/**
 * ADDON_PATTERNS: Identifies addon requests (windows, doors, braces, etc.)
 * Prevents misinterpretation of "2 windows" as "2 car garage"
 */
const ADDON_PATTERNS = [
    /\b(?:add|also|get|want|need)?\s*(\d+)\s+(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
    /\b(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
];

/**
 * VALID_GAUGES: Allowed gauge values
 */
const VALID_GAUGES = [14, 16, 18, 20];

/**
 * COLOR_KEYWORDS: Searchable color options
 */
const COLOR_KEYWORDS = [
    "red",
    "barn red",
    "burgundy",
    "crimson",
    "blue",
    "royal blue",
    "navy",
    "green",
    "evergreen",
    "gray",
    "grey",
    "pewter",
    "white",
    "black",
    "beige",
    "brown",
];

/**
 * IntentDetector: Identifies high-level user intentions
 */
export class IntentDetector {
    /**
     * Detects if user wants to reset/restart conversation
     */
    static detectReset(input: string): boolean
    {
        const isReset: boolean = RESET_PATTERNS.some(p => p.test(input));
        if (isReset)
        {
            logger.info("[IntentDetector] Reset intent detected");
        }
        return isReset;
    }

    /**
     * Detects if user is requesting addons (windows, doors, etc.)
     * Must check BEFORE dimension patterns to prevent misinterpretation
     */

    static detectAddon(input: string): boolean
    {
        const hasAddonKeyword: boolean = ADDON_PATTERNS.some(p => p.test(input));
        const hasCarKeyword: boolean = /\b(\d+)\s*(?:car|cars)\s*(?:garage)?\b/i.test(input);

        if (hasCarKeyword && !input.match(/\b(?:add|also)\s+\d+\s+(?:window|door|brace)/i))
        {
            return false;
        }

        return hasAddonKeyword;
    }
}

/**
 * ParameterExtractor: Extracts typed values from user input using regex patterns
 */
class ParameterExtractor
{
    /**
     * Extracts numeric value from match groups
     */

    private static extractNumeric(match: RegExpMatchArray, groups: number[]): number | null
    {
        for (const group of groups)
        {
            const value: string = match[group];
            if (value)
            {
                return parseFloat(value);
            }
        }
        return null;
    }

    /**
     * Extracts dimension (width, length, height)
     */

    static extractDimension(input: string, dimensionName: string): DetectionResult | null
    {
        const pattern = new RegExp(
            `${dimensionName}\\s*[:=]?\\s*(\\d+(?:\\.\\d+)?)`+
            `|(\\d+)\\s*(?:ft|feet)?(?:\\s+${dimensionName === "width" ? "wide|w" : dimensionName === "length" ? "long|l" : "tall|h"}\\b)`,
            "i"
        );

        const match: RegExpMatchArray = input.match(pattern);

        if (!match)
        {
            return null;
        }

        const value: number = this.extractNumeric(match, [1, 2]);

        if (value === null)
        {
            return null;
        }

        logger.info(`[ParameterExtractor] ${dimensionName}: ${value}`);

        return {field: dimensionName as keyof UserFriendlyParams, value,};
    }

    /**
     * Extracts single-word enum value (building type, gauge, roof)
     */
    static extractEnum(input: string, pattern: RegExp, validValues: string[], fieldName: keyof UserFriendlyParams): DetectionResult | null
    {
        const match: RegExpMatchArray = input.match(pattern);

        if (!match)
        {
            return null;
        }

        const value: string = match[1]?.toLowerCase() || match[0]?.toLowerCase();

        if (!validValues.includes(value))
        {
            return null;
        }

        logger.info(`[ParameterExtractor] ${fieldName}: ${value}`);
        return { field: fieldName, value };
    }

    /**
     * Extracts numeric enum (gauge: 14, 16, 18, 20)
     */
    static extractNumericEnum(input: string, pattern: RegExp, validValues: number[], fieldName: keyof UserFriendlyParams): DetectionResult | null
    {
        const match: RegExpMatchArray = input.match(pattern);

        if (!match)
        {
            return null;
        }

        const value: number = parseInt(match[1], 10);

        if (!validValues.includes(value))
        {
            return null;
        }

        logger.info(`[ParameterExtractor] ${fieldName}: ${value}`);
        return { field: fieldName, value };
    }

    /**
     * Extracts state name with validation
     */
    static extractState(input: string): DetectionResult | null
    {
        const match = input.match(/(?:in|from|state)\s*[:=]?\s*([A-Za-z\s]+?)(?:\s|$|\.)/i);

        if (!match)
        {
            return null;
        }

        const state: string = match[1].trim();

        if (state.length === 0 || state.length > 20 || /^\d+$/.test(state))
        {
            return null;
        }

        logger.info(`[ParameterExtractor] state_name: ${state}`);
        return { field: "state_name", value: state };
    }

    /**
     * Extracts color with keyword matching
     */
    static extractColor(input: string): DetectionResult | null
    {
        const hasColorIntent = /(?:color|paint|change\s+color|make.*(?:color|red|blue|green|white|black))/i.test(input);

        if (!hasColorIntent)
        {
            return null;
        }

        const lowerInput: string = input.toLowerCase();

        for (const keyword of COLOR_KEYWORDS)
        {
            if (lowerInput.includes(keyword))
            {
                logger.info(`[ParameterExtractor] color: ${keyword}`);
                return { field: "color", value: keyword };
            }
        }

        logger.info("[ParameterExtractor] color: pending (generic request)");
        return { field: "color", value: "pending" };
    }

    /**
     * Extracts garage car count with addon context awareness
     */
    static extractGarageType(input: string, isAddon: boolean): DetectionResult | null
    {
        const match: RegExpMatchArray = input.match(/(?<!window\s)(?<!door\s)(?<!brace\s)(\d+)\s*-?cars?(?!\s+window|\s+door|\s+brace)/i);

        if (!match)
        {
            return null;
        }

        if (isAddon)
        {
            logger.info("[ParameterExtractor] Car count in addon context, skipping");
            return null;
        }

        const carCount: string = match[1];
        logger.info(`[ParameterExtractor] garage_type: ${carCount}-car`);
        return { field: "garage_type", value: `${carCount}-car` };
    }

    /**
     * Extracts truck/rv garage designation
     */
    static extractGarageDesignation(input: string): DetectionResult | null
    {
        const match: RegExpMatchArray = input.match(/\b(truck|rv)\s*(?:garage|building)?\b/i);

        if (!match)
        {
            return null;
        }

        const designation: string = match[1].toLowerCase();
        logger.info(`[ParameterExtractor] garage_type: ${designation}`);
        return { field: "garage_type", value: designation };
    }

    /**
     * Extracts utility length parameter
     */
    static extractUtilityLength(input: string): DetectionResult | null
    {
        const match: RegExpMatchArray = input.match(/utility\s*(?:length|section)?\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
        if (!match)
        {
            return null;
        }

        const value: number = parseFloat(match[1]);
        logger.info(`[ParameterExtractor] utility_length: ${value}`);
        return { field: "utility_length", value };
    }

    /**
     * Extracts gauge with both contextual and standalone patterns
     */
    static extractGauge(input: string): DetectionResult | null
    {
        let result: DetectionResult = this.extractNumericEnum(input, /(?:gauge\s*)?(\d+)\s*ga?(?:uge)?/i, VALID_GAUGES, "gauge");
        if (result)
        {
            return result;
        }

        if (/^\d+$/.test(input.trim()))
        {
            const value = parseInt(input.trim(), 10);
            if (VALID_GAUGES.includes(value))
            {
                logger.info(`[ParameterExtractor] gauge (standalone): ${value}`);
                return { field: "gauge", value };
            }
        }

        return null;
    }

    /**
     * Extracts roof type
     */
    static extractRoof(input: string): DetectionResult | null
    {
        const directMatch: RegExpMatchArray = input.toLowerCase().match(/^(vertical|regular|box|a-frame)$/);

        if (directMatch)
        {
            logger.info(`[ParameterExtractor] roof_type: ${directMatch[0]}`);
            return { field: "roof_type", value: directMatch[0] };
        }

        const contextMatch = input.match(/(?:roof|style)\s*[:=]?\s*(vertical|regular|box|a-frame)|(?:vertical|regular|box|a-frame)\s+roof/i);

        if (!contextMatch)
        {
            return null;
        }

        const roofType: string = (contextMatch[1] || contextMatch[0]).toLowerCase().match(/(vertical|regular|box|a-frame)/)?.[0];

        if (!roofType)
        {
            return null;
        }

        logger.info(`[ParameterExtractor] roof_type: ${roofType}`);
        return { field: "roof_type", value: roofType };
    }
}

/**
 * ParameterDetector: Main API for parameter extraction from user input
 * Implements priority-based detection strategy
 */
class ParameterDetector
{
    /**
     * Detects parameters from user input with intelligent priority
     *
     * Priority order:
     * 1. Addon requests (prevent misinterpretation)
     * 2. Dimensions (width, length, height)
     * 3. Building type (garage, shed, barn)
     * 4. Garage type (car count, truck, rv)
     * 5. State, gauge, color, utility length, roof
     */
    static detect(input: string): DetectionResult | null
    {
        if (!input?.trim())
        {
            logger.warn("[ParameterDetector] Empty input");
            return null;
        }

        logger.info(`[ParameterDetector] Analyzing: "${input}"`);

        const isAddon: boolean = IntentDetector.detectAddon(input);

        if (isAddon)
        {
            logger.info("[ParameterDetector] Addon request detected, skipping");
            return null;
        }

        for (const dimension of ["width", "length", "height"])
        {
            const result: DetectionResult = ParameterExtractor.extractDimension(input, dimension);

            if (result)
            {
                return result;
            }
        }

        const buildingMatch: RegExpMatchArray = input.match(/\b(garage|shed|barn)\b/i);

        if (buildingMatch)
        {
            return {field: "building_type", value: buildingMatch[1].toLowerCase(),};
        }

        let result: DetectionResult = ParameterExtractor.extractGarageType(input, isAddon);

        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractGarageDesignation(input);
        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractState(input);

        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractGauge(input);

        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractColor(input);

        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractUtilityLength(input);

        if (result)
        {
            return result;
        }

        result = ParameterExtractor.extractRoof(input);

        if (result)
        {
            return result;
        }

        logger.info("[ParameterDetector] No parameters detected");
        return null;
    }
}

/**
 * Gauge extraction helper (used by both patterns and direct input)
 */

function extractGauge(input: string): DetectionResult | null
{
    let result: DetectionResult = ParameterExtractor.extractNumericEnum(input, /(?:gauge\s*)?(\d+)\s*ga?(?:uge)?/i, VALID_GAUGES, "gauge");

    if (result)
    {
        return result;
    }

    if (/^\d+$/.test(input.trim()))
    {
        const value: number = parseInt(input.trim(), 10);

        if (VALID_GAUGES.includes(value))
        {
            logger.info(`[ParameterDetector] gauge (standalone): ${value}`);
            return { field: "gauge", value };
        }
    }

    return null;
}

ParameterExtractor.extractGauge = extractGauge;

/**
 * Detects parameter updates from user input with intelligent extraction
 *
 * @param input - User input string
 * @returns Detected parameter or null if no match
 */
export async function detectParameterUpdateFromInput(input: string): Promise<DetectionResult | null>
{
    return ParameterDetector.detect(input);
}
