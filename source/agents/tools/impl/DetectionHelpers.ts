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
 * Detect parameter updates from user input
 */
export async function detectParameterUpdateFromInput(input: string): Promise<{
    field: keyof UserFriendlyParams;
    value: any;
} | null> {
    logger.info(`[detectParameterUpdateFromInput] Checking: "${input}"`);

    const lowerInput = input.toLowerCase().trim();

    // ✅ BUILDING TYPE (e.g., "garage", "shed", "barn")
    const buildingMatch = input.match(/\b(garage|shed|barn)\b/i);
    if (buildingMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched building_type: ${buildingMatch[1]}`);
        return { field: "building_type", value: buildingMatch[1].toLowerCase() };
    }

    // ✅ Car count (e.g., "2 cars", "5 car garage")
    const carCountMatch = input.match(/(\d+)\s*cars?/i);
    if (carCountMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched cars: ${carCountMatch[1]}`);
        return { field: "garage_type", value: `${carCountMatch[1]}-car` };
    }

    // ✅ Garage type keywords (e.g., "truck garage", "rv garage")
    const garageTypeMatch = input.match(/\b(truck|rv)\s*(?:garage|building)?\b/i);
    if (garageTypeMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched garage_type: ${garageTypeMatch[1]}`);
        return { field: "garage_type", value: garageTypeMatch[1].toLowerCase() };
    }

    // ✅ Width (e.g., "make width 20", "width 20", "20 ft wide")
    const widthMatch = input.match(/(?:make|change|set|width)?\s*width\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*wide/i);
    if (widthMatch) {
        const val = parseFloat(widthMatch[1] || widthMatch[2]);
        logger.info(`[detectParameterUpdateFromInput] Matched width: ${val}`);
        return { field: "width", value: val };
    }

    // ✅ Length (e.g., "length 30", "make length 25", "30 ft long")
    const lengthMatch = input.match(/(?:make|change|set|length)?\s*length\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*(?:long|length)/i);
    if (lengthMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched length: ${lengthMatch[1] || lengthMatch[2]}`);
        return { field: "length", value: parseFloat(lengthMatch[1] || lengthMatch[2]) };
    }

    // ✅ Height (e.g., "height 12", "make height 10", "12 ft tall")
    const heightMatch = input.match(/(?:make|change|set|height)?\s*height\s*(?:to)?\s*(\d+(?:\.\d+)?)|(\d+)\s*(?:ft|feet)?\s*(?:tall|high|height)/i);
    if (heightMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched height: ${heightMatch[1] || heightMatch[2]}`);
        return { field: "height", value: parseFloat(heightMatch[1] || heightMatch[2]) };
    }

    // ✅ STATE (e.g., "Texas", "California", "TX", "CA")
    const stateMatch = input.match(/(?:in|from|state:?)\s*([A-Za-z\s]+?)(?:\s|$|\.)/i);
    if (stateMatch) {
        const state = stateMatch[1].trim();
        if (state.length > 0 && state.length <= 20) {
            logger.info(`[detectParameterUpdateFromInput] Matched state: ${state}`);
            return { field: "state_name", value: state };
        }
    }

    // ✅ GAUGE (e.g., "14", "14GA", "16 gauge", "18GA")
    // Check if input is ONLY a number (to avoid matching other numbers)
    if (/^\d+$/.test(lowerInput)) {
        const gaugeValue = parseInt(lowerInput, 10);
        // Valid gauges are typically 14, 16, 18, 20
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] Matched gauge: ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    // ✅ GAUGE with GA suffix (e.g., "14GA", "16GA")
    const gaugeWithGaMatch = input.match(/(\d+)\s*ga(?:uge)?/i);
    if (gaugeWithGaMatch) {
        const gaugeValue = parseInt(gaugeWithGaMatch[1], 10);
        if ([14, 16, 18, 20].includes(gaugeValue)) {
            logger.info(`[detectParameterUpdateFromInput] Matched gauge (with GA): ${gaugeValue}`);
            return { field: "gauge", value: gaugeValue };
        }
    }

    // ✅ UTILITY LENGTH (e.g., "utility 4", "utility section 6 ft")
    const utilityMatch = input.match(/utility\s*(?:length|section)?\s*(\d+(?:\.\d+)?)\s*(?:ft|feet)?/i);
    if (utilityMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched utility_length: ${utilityMatch[1]}`);
        return { field: "utility_length", value: parseFloat(utilityMatch[1]) };
    }

    // ✅ ROOF TYPE (exact match first)
    if (lowerInput === "vertical" || lowerInput === "regular" || lowerInput === "box" || lowerInput === "a-frame") {
        logger.info(`[detectParameterUpdateFromInput] Matched roof (direct): ${lowerInput}`);
        return { field: "roof_type", value: lowerInput };
    }

    // ✅ ROOF TYPE (pattern match)
    const roofMatch = input.match(/(?:make|change|want|prefer)?\s*(vertical|regular|box|a-frame)\s*(?:roof|style)?/i);
    if (roofMatch) {
        logger.info(`[detectParameterUpdateFromInput] Matched roof (pattern): ${roofMatch[1]}`);
        return { field: "roof_type", value: roofMatch[1].toLowerCase() };
    }

    logger.info(`[detectParameterUpdateFromInput] No match found`);
    return null;
}

/**
 * Detect addon selections from user input (used after price calculation)
 * Examples: "add 2 windows", "1 door", "3 braces", "windows and doors"
 */
export function detectAddonSelectionFromInput(input: string): Array<{
    type: string;
    quantity: number;
}> | null {
    logger.info(`[detectAddonSelectionFromInput] Checking: "${input}"`);

    // ✅ CHECK FOR "NO ADDONS" INTENT FIRST - This is the KEY FIX
    if (/(no|skip|none|without|don't need|don't want|nope|nah)/i.test(input)) {
        logger.info(`[detectAddonSelectionFromInput] User declined addons`);
        return [];  // ← Return EMPTY ARRAY (not null) to indicate "user said no"
    }

    const addons: Array<{ type: string; quantity: number }> = [];

    // ✅ WINDOWS (e.g., "2 windows", "add 3 windows", "windows")
    const windowMatch = input.match(/(?:add|want|need)?\s*(\d*)\s*windows?/i);
    if (windowMatch) {
        const qty = windowMatch[1] ? parseInt(windowMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} window(s)`);
        addons.push({ type: "window", quantity: qty });
    }

    // ✅ DOORS (e.g., "2 doors", "add door", "doors")
    const doorMatch = input.match(/(?:add|want|need)?\s*(\d*)\s*doors?/i);
    if (doorMatch) {
        const qty = doorMatch[1] ? parseInt(doorMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} door(s)`);
        addons.push({ type: "door", quantity: qty });
    }

    // ✅ GARAGE DOORS (e.g., "1 garage door", "extra garage door")
    const garageDoorMatch = input.match(/(?:add|want|need|extra)?\s*(\d*)\s*garage\s*doors?/i);
    if (garageDoorMatch) {
        const qty = garageDoorMatch[1] ? parseInt(garageDoorMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} garage door(s)`);
        addons.push({ type: "garage_door", quantity: qty });
    }

    // ✅ WALK-IN DOORS (e.g., "walk in door", "walkin door", "2 walkin doors")
    const walkinDoorMatch = input.match(/(?:add|want|need)?\s*(\d*)\s*walk.?in\s*doors?/i);
    if (walkinDoorMatch) {
        const qty = walkinDoorMatch[1] ? parseInt(walkinDoorMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} walk-in door(s)`);
        addons.push({ type: "walkin_door", quantity: qty });
    }

    // ✅ BRACES (e.g., "3 braces", "add braces", "extra braces")
    const braceMatch = input.match(/(?:add|want|need|extra)?\s*(\d*)\s*braces?/i);
    if (braceMatch) {
        const qty = braceMatch[1] ? parseInt(braceMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} brace(s)`);
        addons.push({ type: "braces", quantity: qty });
    }

    // ✅ CUPOLA (e.g., "cupola", "add cupola", "1 cupola")
    const cupolaMatch = input.match(/(?:add|want|need)?\s*(\d*)\s*cupolas?/i);
    if (cupolaMatch) {
        const qty = cupolaMatch[1] ? parseInt(cupolaMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} cupola(s)`);
        addons.push({ type: "cupola", quantity: qty });
    }

    // ✅ ANCHORS (e.g., "anchors", "add anchors", "2 anchor kits")
    const anchorMatch = input.match(/(?:add|want|need)?\s*(\d*)\s*anchors?/i);
    if (anchorMatch) {
        const qty = anchorMatch[1] ? parseInt(anchorMatch[1], 10) : 1;
        logger.info(`[detectAddonSelectionFromInput] Detected ${qty} anchor(s)`);
        addons.push({ type: "anchors", quantity: qty });
    }

    if (addons.length === 0) {
        logger.info(`[detectAddonSelectionFromInput] No addons detected`);
        return null;
    }

    logger.info(`[detectAddonSelectionFromInput] Detected ${addons.length} addon type(s)`);
    return addons;
}
