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
    const addonPatterns = [
        /\b(add|also|and)\s+(\d+\s+)?(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)/i,
        /\b(\d+)\s+(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
        /\b(window|door|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
    ];

    return addonPatterns.some(pattern => pattern.test(input));
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

    // ✅ CRITICAL FIX: Check for addon keywords FIRST
    // This prevents "2 windows" from matching car count pattern
    if (isAddonRequest(input)) {
        logger.info(`[detectParameterUpdateFromInput] Detected addon request - skipping parameter detection`);
        return null;  // Let addon processor handle it
    }

    // Building type detection
    const buildingMatch = input.match(/\b(garage|shed|barn)\b/i);
    if (buildingMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched building_type: ${buildingMatch[1]}`);
        return { field: "building_type", value: buildingMatch[1].toLowerCase() };
    }

    // ✅ FIXED: Car count pattern - only match if NOT preceded by addon keywords
    // Pattern: "2 cars", "3 car", "5-car garage" (but NOT "2 car windows")
    const carCountMatch = input.match(/(?<!window\s)(?<!door\s)(?<!brace\s)(\d+)\s*cars?(?!\s+window|\s+door|\s+brace)/i);
    if (carCountMatch) {
        // Double-check it's not an addon context
        const beforeCarCount = input.substring(0, carCountMatch.index);
        if (!isAddonRequest(beforeCarCount)) {
            logger.info(`[detectParameterUpdateFromInput] Matched cars: ${carCountMatch[1]}`);
            return { field: "garage_type", value: `${carCountMatch[1]}-car` };
        } else {
            logger.info(`[detectParameterUpdateFromInput] Car count found but in addon context - skipping`);
            return null;
        }
    }

    const garageTypeMatch = input.match(/\b(truck|rv)\s*(?:garage|building)?\b/i);
    if (garageTypeMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched garage_type: ${garageTypeMatch[1]}`);
        return { field: "garage_type", value: garageTypeMatch[1].toLowerCase() };
    }

    const widthMatch = input.match(/(?:make|change|set|width)?\s*width\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*wide/i);
    if (widthMatch) {
        const val = parseFloat(widthMatch[1] || widthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] Matched width: ${val}`);
        return { field: "width", value: val };
    }

    const lengthMatch = input.match(/(?:make|change|set|length)?\s*length\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*(?:long|length)/i);
    if (lengthMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched length: ${lengthMatch[1] || lengthMatch[2]}`);
        return { field: "length", value: parseFloat(lengthMatch[1] || lengthMatch[2]) };
    }

    const heightMatch = input.match(/(?:make|change|set|height)?\s*height\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*(?:tall|high|height)/i);
    if (heightMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched height: ${heightMatch[1] || heightMatch[2]}`);
        return { field: "height", value: parseFloat(heightMatch[1] || heightMatch[2]) };
    }

    const stateMatch = input.match(/(?:in|from|state:?)\s*([A-Za-z\s]+?)(?:\s|$|\.)/i);
    if (stateMatch) {
        const state = stateMatch[1].trim();
        if (state.length > 0 && state.length <= 20) {
            logger.info(`[detectParameterUpdateFromInput] Matched state: ${state}`);
            return { field: "state_name", value: state };
        }
    }

    if (/^\d+$/.test(lowerInput)) {
        const gaugeValue = parseInt(lowerInput, 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] Matched gauge: ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    const gaugeWithGaMatch = input.match(/(\d+)\s*ga(?:uge)?/i);
    if (gaugeWithGaMatch) {
        const gaugeValue = parseInt(gaugeWithGaMatch[1], 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] Matched gauge (with GA): ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    const utilityMatch = input.match(/utility\s*(?:length|section)?\s*(\d+(?:\.\d+)?)\s*(?:ft|feet)?/i);
    if (utilityMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched utility_length: ${utilityMatch[1]}`);
        return { field: "utility_length", value: parseFloat(utilityMatch[1]) };
    }

    if (lowerInput === "vertical" || lowerInput === "regular" || lowerInput === "box" || lowerInput === "a-frame") {
        logger.info(`[detectParameterUpdateFromInput] Matched roof (direct): ${lowerInput}`);
        return { field: "roof_type", value: lowerInput };
    }

    const roofMatch = input.match(/(?:make|change|want|prefer)?\s*(vertical|regular|box|a-frame)\s*(?:roof|style)?/i);
    if (roofMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched roof (pattern): ${roofMatch[1]}`);
        return { field: "roof_type", value: roofMatch[1].toLowerCase() };
    }

    logger.info(`[detectParameterUpdateFromInput] No match found`);
    return null;
}
