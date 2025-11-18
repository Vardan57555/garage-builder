import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export interface ColorOption {
    id: number;
    name: string;
    hex_value: string;
    red_value: number;
    green_value: number;
    blue_value: number;
    cost: number;
}

/**
 * ✅ HARDCODED FALLBACK COLORS
 */
const FALLBACK_COLORS: ColorOption[] = [
    { id: 1, name: "White", hex_value: "#ffffff", red_value: 255, green_value: 255, blue_value: 255, cost: 0 },
    { id: 2, name: "Black", hex_value: "#313232", red_value: 49, green_value: 50, blue_value: 50, cost: 0 },
    { id: 3, name: "Barn Red", hex_value: "#6A2210", red_value: 106, green_value: 34, blue_value: 16, cost: 250 },
    { id: 4, name: "Burgundy", hex_value: "#452210", red_value: 69, green_value: 34, blue_value: 34, cost: 200 },
    { id: 5, name: "Royal Blue", hex_value: "#1D548B", red_value: 29, green_value: 84, blue_value: 139, cost: 250 },
    { id: 6, name: "Evergreen", hex_value: "#1E3C22", red_value: 30, green_value: 60, blue_value: 34, cost: 200 },
    { id: 7, name: "Pewter Gray", hex_value: "#979290", red_value: 151, green_value: 146, blue_value: 144, cost: 150 },
    { id: 8, name: "Clay", hex_value: "#99846F", red_value: 153, green_value: 132, blue_value: 111, cost: 180 },
    { id: 9, name: "Pebble Beige", hex_value: "#fae4bb", red_value: 250, green_value: 228, blue_value: 187, cost: 150 },
    { id: 10, name: "Earth Brown", hex_value: "#4D331B", red_value: 77, green_value: 51, blue_value: 27, cost: 200 },
];

/**
 * ✅ FETCH FROM YOUR DATABASE USING EXISTING PROCEDURES
 */
async function fetchColorsFromDB(): Promise<ColorOption[]> {
    try {
        logger.info("[fetchColorsFromDB] 🗄️  Fetching colors using YOUR existing procedures...");

        logger.info("[fetchColorsFromDB] 🔍 Trying method 1: getColor() procedure");

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [],
                "CALL getColor()",
                "colors_from_procedure"
            );

            if (result && result.length > 0) {
                logger.info(`[fetchColorsFromDB] ✅ SUCCESS: getColor() returned ${result.length} colors`);

                const colors = result.map((row: any) => ({
                    id: parseInt(row.id),
                    name: row.name || "Unknown",
                    hex_value: row.hex_value || "#000000",
                    red_value: parseInt(row.red_value) || 0,
                    green_value: parseInt(row.green_value) || 0,
                    blue_value: parseInt(row.blue_value) || 0,
                    cost: parseFloat(row.cost) || 0,
                }));

                logger.info(`[fetchColorsFromDB] ✅ Processed ${colors.length} colors`);
                logColorSamples(colors);
                return colors;
            } else {
                logger.warn("[fetchColorsFromDB] ⚠️  getColor() returned empty");
            }
        } catch (err) {
            logger.error("[fetchColorsFromDB] ❌ getColor() error:", err);
        }

        logger.info("[fetchColorsFromDB] 🔍 Trying method 2: Direct data_colors query");

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [],
                "SELECT * FROM data_colors ORDER BY name",
                "data_colors_direct"
            );

            if (result && result.length > 0) {
                logger.info(`[fetchColorsFromDB] ✅ SUCCESS: data_colors has ${result.length} colors`);

                const colors = result.map((row: any) => ({
                    id: parseInt(row.id),
                    name: row.name || "Unknown",
                    hex_value: row.hex_value || "#000000",
                    red_value: parseInt(row.red_value) || 0,
                    green_value: parseInt(row.green_value) || 0,
                    blue_value: parseInt(row.blue_value) || 0,
                    cost: parseFloat(row.cost) || 0,
                }));

                logger.info(`[fetchColorsFromDB] ✅ Processed ${colors.length} colors from data_colors`);
                logColorSamples(colors);
                return colors;
            } else {
                logger.warn("[fetchColorsFromDB] ⚠️  data_colors is empty");
            }
        } catch (err) {
            logger.error("[fetchColorsFromDB] ❌ data_colors query error:", err);
        }

        logger.info("[fetchColorsFromDB] 🔍 Trying method 3: colors table");

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [],
                "SELECT * FROM colors ORDER BY name",
                "colors_table"
            );

            if (result && result.length > 0) {
                logger.info(`[fetchColorsFromDB] ✅ SUCCESS: colors table has ${result.length} colors`);

                const colors = result.map((row: any) => ({
                    id: parseInt(row.id),
                    name: row.name || "Unknown",
                    hex_value: row.hex_value || "#000000",
                    red_value: parseInt(row.red_value) || 0,
                    green_value: parseInt(row.green_value) || 0,
                    blue_value: parseInt(row.blue_value) || 0,
                    cost: parseFloat(row.cost) || 0,
                }));

                logger.info(`[fetchColorsFromDB] ✅ Processed ${colors.length} colors from colors table`);
                logColorSamples(colors);
                return colors;
            } else {
                logger.warn("[fetchColorsFromDB] ⚠️  colors table is empty");
            }
        } catch (err) {
            logger.error("[fetchColorsFromDB] ❌ colors table error:", err);
        }

        logger.warn("[fetchColorsFromDB] ⚠️  All database methods failed!");
        logger.warn("[fetchColorsFromDB] Using FALLBACK COLORS (10 colors)");
        logColorSamples(FALLBACK_COLORS);

        return FALLBACK_COLORS;

    } catch (error) {
        logger.error("[fetchColorsFromDB] ❌ FATAL ERROR:", error);
        logger.warn("[fetchColorsFromDB] Using FALLBACK COLORS");
        return FALLBACK_COLORS;
    }
}

/**
 * Helper to log color samples
 */
function logColorSamples(colors: ColorOption[]): void {
    if (colors.length > 0) {
        logger.info(`[fetchColorsFromDB] Sample colors:`);
        colors.slice(0, 5).forEach((color, idx) => {
            logger.info(`  ${idx + 1}. ${color.name} ${color.hex_value} (cost: $${color.cost})`);
        });
    }
}

/**
 * Color caching
 */
let colorCache: ColorOption[] | null = null;
let colorCacheTimestamp = 0;
const COLOR_CACHE_DURATION = 15 * 60 * 1000;

/**
 * ✅ Get colors with caching
 */
export async function getColorsWithCache(): Promise<ColorOption[]> {
    const now = Date.now();
    const cacheAge = now - colorCacheTimestamp;

    if (colorCache && cacheAge < COLOR_CACHE_DURATION) {
        logger.debug(`[getColorsWithCache] 🚀 Using CACHED colors (${colorCache.length} items, age: ${cacheAge}ms)`);
        return colorCache;
    }

    logger.info(`[getColorsWithCache] 🔄 Cache expired/empty, fetching FRESH from database...`);
    colorCache = await fetchColorsFromDB();
    colorCacheTimestamp = now;

    if (colorCache.length === 0) {
        logger.error("[getColorsWithCache] ⚠️  No colors returned!");
        return FALLBACK_COLORS;
    }

    logger.info(`[getColorsWithCache] ✅ Loaded ${colorCache.length} colors and cached`);
    return colorCache;
}

/**
 * Group colors by category for display
 */
export function getGroupedColorsByCategory(
    colors: ColorOption[],
    limitPerCategory: number = 8
): Map<string, ColorOption[]> {
    logger.info(`[getGroupedColorsByCategory] Input: ${colors.length} colors, limit: ${limitPerCategory}`);

    const grouped = new Map<string, ColorOption[]>();

    const categories: Record<string, string[]> = {
        "🔴 Reds": ["Red", "Barn", "Burgundy", "Crimson", "Cardinal", "Pink"],
        "🔵 Blues": ["Blue", "Navy", "Slate", "King", "Royal", "Hawaiian"],
        "🟢 Greens": ["Green", "Evergreen", "Forest"],
        "⚫ Grays": ["Gray", "Grey", "Pewter", "Quaker", "Charcoal", "Zinc"],
        "⚪ Neutrals": ["White", "Black", "Beige", "Tan", "Sandstone", "Clay", "Brown"],
        "🟤 Earth": ["Earth", "Rawhide", "Copper", "Koko"],
    };

    Object.keys(categories).forEach(cat => {
        grouped.set(cat, []);
        logger.debug(`[getGroupedColorsByCategory] Initialized category: ${cat}`);
    });

    colors.forEach((color, idx) => {
        logger.debug(`[getGroupedColorsByCategory] Processing color ${idx}: ${color.name}`);

        let wasGrouped = false;

        for (const [category, keywords] of Object.entries(categories)) {
            const currentList = grouped.get(category)!;

            if (currentList.length >= limitPerCategory) {
                continue;
            }

            const matches = keywords.some(kw =>
                color.name.toLowerCase().includes(kw.toLowerCase())
            );

            if (matches) {
                currentList.push(color);
                grouped.set(category, currentList);
                wasGrouped = true;
                logger.debug(`[getGroupedColorsByCategory] ✅ Added "${color.name}" to ${category}`);
                break;
            }
        }

        if (!wasGrouped) {
            const neutrals = grouped.get("⚪ Neutrals")!;
            if (neutrals.length < limitPerCategory) {
                neutrals.push(color);
                grouped.set("⚪ Neutrals", neutrals);
                logger.debug(`[getGroupedColorsByCategory] ✅ Added "${color.name}" to Neutrals (fallback)`);
            }
        }
    });

    logger.info(`[getGroupedColorsByCategory] Final groups:`);
    grouped.forEach((colorList, category) => {
        logger.info(`  ${category}: ${colorList.length} colors`);
        if (colorList.length > 0) {
            logger.info(`    First: ${colorList[0].name}, Last: ${colorList[colorList.length - 1].name}`);
        }
    });

    let totalColors = 0;
    grouped.forEach((colorList) => {
        totalColors += colorList.length;
    });
    logger.info(`[getGroupedColorsByCategory] Total colors in groups: ${totalColors}`);

    if (totalColors === 0) {
        logger.error(`[getGroupedColorsByCategory] ❌ ERROR: No colors were grouped!`);
    }

    return grouped;
}

