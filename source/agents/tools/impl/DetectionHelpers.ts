import { UserFriendlyParams } from "@agents/tools/io/IChat";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * Detect if user wants to reset conversation
 */
export function detectResetIntent(input: string): boolean {
    const resetPatterns = [
        /\b(start over|new quote|reset|clear|fresh start|begin again)\b/i,
        /\b(quit|exit|done with this)\b/i,
    ];
    return resetPatterns.some((p) => p.test(input));
}

/**
 * ✅ FIXED: Check for addon keywords FIRST before dimension patterns
 * This prevents "2 windows" from being interpreted as "2 cars"
 */
function isAddonRequest(input: string): boolean {
    // ✅ PRIORITY: Specific addon patterns with quantities
    const addonPatterns = [
        // "add 2 doors", "2 windows", "3 braces"
        /\b(?:add|also|get|want|need)?\s*(\d+)\s+(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
        // Just the keywords without quantity
        /\b(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
    ];

    const isAddon = addonPatterns.some(p => p.test(input));

    // ✅ CRITICAL: If contains "car" or "garage" as primary subject, NOT an addon
    const isCarRelated = /\b(\d+)\s*(?:car|cars)\s*(?:garage)?\b/i.test(input);

    if (isCarRelated && !input.match(/\b(?:add|also)\s+\d+\s+(?:window|door|brace)/i)) {
        return false; // "2 cars" or "3 car garage" = NOT addon
    }

    return isAddon;
}

/**
 * Detect parameter updates from user input
 * ✅ FIXED: Addon check happens FIRST, preventing misinterpretation
 */
export async function detectParameterUpdateFromInput(input: string): Promise<{
    field: keyof UserFriendlyParams;
    value: any;
} | null> {
    logger.info(`[detectParameterUpdateFromInput] Checking: "${input}"`);

    const lowerInput = input.toLowerCase().trim();

    // ============================================================================
    // PRIORITY 1: ADDON REQUESTS (must check first)
    // ============================================================================
    if (isAddonRequest(input)) {
        logger.info(`[detectParameterUpdateFromInput] ✅ ADDON REQUEST - skipping parameter detection`);
        return null;
    }

    // ============================================================================
    // PRIORITY 2: EXPLICIT DIMENSION KEYWORDS (before car count!)
    // ============================================================================
    // Match: "width 20", "width: 20", "width = 20", "20 width"
    const widthMatch = input.match(/width\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+wide|w\b)/i);
    if (widthMatch) {
        const val = parseFloat(widthMatch[1] || widthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT width: ${val}`);
        return { field: "width", value: val };
    }

    // Match: "length 20", "length: 20", "20 length", "20 feet long"
    const lengthMatch = input.match(/length\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+long|l\b)/i);
    if (lengthMatch) {
        const val = parseFloat(lengthMatch[1] || lengthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT length: ${val}`);
        return { field: "length", value: val };
    }

    // Match: "height 10", "height: 10", "10 height", "10 feet tall"
    const heightMatch = input.match(/height\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+tall|h\b)/i);
    if (heightMatch) {
        const val = parseFloat(heightMatch[1] || heightMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT height: ${val}`);
        return { field: "height", value: val };
    }

    // ============================================================================
    // PRIORITY 3: BUILDING TYPE
    // ============================================================================
    const buildingMatch = input.match(/\b(garage|shed|barn)\b/i);
    if (buildingMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Building type: ${buildingMatch[1]}`);
        return { field: "building_type", value: buildingMatch[1].toLowerCase() };
    }

    // ============================================================================
    // PRIORITY 4: CAR COUNT (now safe - explicit dimensions checked first)
    // ============================================================================
    // Only match "X cars" or "X-car garage" where X is clearly a car count
    // NOT when it's part of dimension keywords
    const carCountMatch = input.match(/(?<!window\s)(?<!door\s)(?<!brace\s)(\d+)\s*-?cars?(?!\s+window|\s+door|\s+brace)/i);
    if (carCountMatch) {
        const beforeCarCount = input.substring(0, carCountMatch.index);
        if (!isAddonRequest(beforeCarCount)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Car count: ${carCountMatch[1]}`);
            return { field: "garage_type", value: `${carCountMatch[1]}-car` };
        } else {
            logger.info(`[detectParameterUpdateFromInput] Car count found but in addon context - skipping`);
            return null;
        }
    }

    // ============================================================================
    // PRIORITY 5: SPECIALIZED GARAGE TYPES
    // ============================================================================
    const garageTypeMatch = input.match(/\b(truck|rv)\s*(?:garage|building)?\b/i);
    if (garageTypeMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Garage type: ${garageTypeMatch[1]}`);
        return { field: "garage_type", value: garageTypeMatch[1].toLowerCase() };
    }

    // ============================================================================
    // PRIORITY 6: STATE
    // ============================================================================
    const stateMatch = input.match(/(?:in|from|state)\s*[:=]?\s*([A-Za-z\s]+?)(?:\s|$|\.)/i);
    if (stateMatch) {
        const state = stateMatch[1].trim();
        if (state.length > 0 && state.length <= 20 && !/^\d+$/.test(state)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ State: ${state}`);
            return { field: "state_name", value: state };
        }
    }

    // ============================================================================
    // PRIORITY 7: GAUGE (only when it's explicitly a gauge number)
    // ============================================================================
    // Match: "16", "14GA", "gauge 18"
    const gaugeWithGaMatch = input.match(/(?:gauge\s*)?(\d+)\s*ga?(?:uge)?/i);
    if (gaugeWithGaMatch) {
        const gaugeValue = parseInt(gaugeWithGaMatch[1], 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Gauge: ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    // Only standalone number if it's a valid gauge
    if (/^\d+$/.test(lowerInput)) {
        const gaugeValue = parseInt(lowerInput, 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Gauge (standalone): ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    // ============================================================================
    // PRIORITY 8: UTILITY LENGTH
    // ============================================================================
    const utilityMatch = input.match(/utility\s*(?:length|section)?\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if (utilityMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Utility length: ${utilityMatch[1]}`);
        return { field: "utility_length", value: parseFloat(utilityMatch[1]) };
    }

    // ============================================================================
    // PRIORITY 9: ROOF TYPE (only explicit keywords or direct match)
    // ============================================================================
    const roofDirectMatch = lowerInput.match(/^(vertical|regular|box|a-frame)$/);
    if (roofDirectMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Roof (direct): ${roofDirectMatch[0]}`);
        return { field: "roof_type", value: roofDirectMatch[0] };
    }

    // Match: "vertical roof", "box roof", etc.
    const roofMatch = input.match(/(?:roof|style)\s*[:=]?\s*(vertical|regular|box|a-frame)|(?:vertical|regular|box|a-frame)\s+roof/i);
    if (roofMatch) {
        const roofType = (roofMatch[1] || roofMatch[0]).toLowerCase().match(/(vertical|regular|box|a-frame)/)?.[0];
        if (roofType) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Roof: ${roofType}`);
            return { field: "roof_type", value: roofType };
        }
    }

    logger.info(`[detectParameterUpdateFromInput] ❌ No match found`);
    return null;
}
