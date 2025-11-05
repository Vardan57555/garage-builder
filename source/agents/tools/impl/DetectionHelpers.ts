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
        /\b(?:add|also|get|want|need)?\s*(\d+)\s+(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
        /\b(window|garage\s+door|walk.?in|brace|anchor|cupola|truss)s?\b/i,
    ];

    const isAddon = addonPatterns.some(p => p.test(input));

    const isCarRelated = /\b(\d+)\s*(?:car|cars)\s*(?:garage)?\b/i.test(input);

    if (isCarRelated && !input.match(/\b(?:add|also)\s+\d+\s+(?:window|door|brace)/i)) {
        return false;
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

    if (isAddonRequest(input)) {
        logger.info(`[detectParameterUpdateFromInput] ✅ ADDON REQUEST - skipping parameter detection`);
        return null;
    }

    const widthMatch = input.match(/width\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+wide|w\b)/i);
    if (widthMatch) {
        const val = parseFloat(widthMatch[1] || widthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT width: ${val}`);
        return { field: "width", value: val };
    }

    const lengthMatch = input.match(/length\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+long|l\b)/i);
    if (lengthMatch) {
        const val = parseFloat(lengthMatch[1] || lengthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT length: ${val}`);
        return { field: "length", value: val };
    }

    const heightMatch = input.match(/height\s*[:=]?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?(?:\s+tall|h\b)/i);
    if (heightMatch) {
        const val = parseFloat(heightMatch[1] || heightMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] ✅ EXPLICIT height: ${val}`);
        return { field: "height", value: val };
    }

    const buildingMatch = input.match(/\b(garage|shed|barn)\b/i);
    if (buildingMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Building type: ${buildingMatch[1]}`);
        return { field: "building_type", value: buildingMatch[1].toLowerCase() };
    }

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

    const garageTypeMatch = input.match(/\b(truck|rv)\s*(?:garage|building)?\b/i);
    if (garageTypeMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Garage type: ${garageTypeMatch[1]}`);
        return { field: "garage_type", value: garageTypeMatch[1].toLowerCase() };
    }

    const stateMatch = input.match(/(?:in|from|state)\s*[:=]?\s*([A-Za-z\s]+?)(?:\s|$|\.)/i);
    if (stateMatch) {
        const state = stateMatch[1].trim();
        if (state.length > 0 && state.length <= 20 && !/^\d+$/.test(state)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ State: ${state}`);
            return { field: "state_name", value: state };
        }
    }

    const gaugeWithGaMatch = input.match(/(?:gauge\s*)?(\d+)\s*ga?(?:uge)?/i);
    if (gaugeWithGaMatch) {
        const gaugeValue = parseInt(gaugeWithGaMatch[1], 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Gauge: ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    if (/^\d+$/.test(lowerInput)) {
        const gaugeValue = parseInt(lowerInput, 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] ✅ Gauge (standalone): ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    const utilityMatch = input.match(/utility\s*(?:length|section)?\s*[:=]?\s*(\d+(?:\.\d+)?)/i);
    if (utilityMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Utility length: ${utilityMatch[1]}`);
        return { field: "utility_length", value: parseFloat(utilityMatch[1]) };
    }

    const roofDirectMatch = lowerInput.match(/^(vertical|regular|box|a-frame)$/);
    if (roofDirectMatch) {
        logger.info(`[detectParameterUpdateFromInput] ✅ Roof (direct): ${roofDirectMatch[0]}`);
        return { field: "roof_type", value: roofDirectMatch[0] };
    }

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
