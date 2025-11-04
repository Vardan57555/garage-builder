import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

export interface AddonFromDB {
    id: string;
    name: string;
    label: string;
    type: string;
    cost: number;
    description?: string;
    category?: string;
}

/**
 * ✅ Fetch ALL addons using single procedure
 */
async function fetchAddonsFromDB(): Promise<AddonFromDB[]> {
    try {
        logger.info("[fetchAddonsFromDB] Fetching all addons from database");

        const result = await ProcedureExecutor.getProcedureData<any>(
            [],
            "getAllAddonOptions()",
            "all_addons"
        );

        if (!result || result.length === 0) {
            logger.warn("[fetchAddonsFromDB] No addons found in database");
            return [];
        }

        const addons: AddonFromDB[] = result
            .map((row: any) => ({
                id: String(row.id),
                name: row.name || "Unknown",
                label: row.label || row.name || "Unknown",
                type: row.type || "other",
                cost: parseFloat(row.cost) || 0,
                description: row.description || "",
                category: row.category || "",
            }))
            // ✅ Filter out zero-cost addons
            .filter(addon => addon.cost > 0);

        logger.info(`[fetchAddonsFromDB] ✅ Fetched ${addons.length} paid addons`);

        // Log breakdown by type
        const typeCount = new Map<string, number>();
        addons.forEach(addon => {
            typeCount.set(addon.type, (typeCount.get(addon.type) || 0) + 1);
        });

        typeCount.forEach((count, type) => {
            logger.info(`  - ${type}: ${count} addon(s)`);
        });

        return addons;
    } catch (error) {
        logger.error("[fetchAddonsFromDB] Error fetching addons:", error);
        return [];
    }
}

/**
 * ✅ Cache addons in memory to avoid repeated database calls
 * CACHE_DURATION: 15 minutes
 */
let addonCache: AddonFromDB[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

/**
 * ✅ PRIMARY EXPORT: Get all addons with caching
 * Used by: ShowAddonsNode, ProcessAddonsNode
 */
export async function getAddonsWithCache(): Promise<AddonFromDB[]> {
    const now = Date.now();

    // Return cached if still valid
    if (addonCache && (now - cacheTimestamp) < CACHE_DURATION) {
        logger.debug(`[getAddonsWithCache] Using cached addons (${addonCache.length} items)`);
        return addonCache;
    }

    logger.info("[getAddonsWithCache] Cache expired or empty, fetching fresh addons");
    addonCache = await fetchAddonsFromDB();
    cacheTimestamp = now;
    return addonCache;
}

/**
 * ✅ Get addons limited by type (top N per type)
 * Prevents overwhelming user with 75K+ options
 */
export function getLimitedAddonsByType(addons: AddonFromDB[], limitPerType: number = 10): AddonFromDB[] {
    const grouped = new Map<string, AddonFromDB[]>();

    // Group addons by type
    addons.forEach(addon => {
        if (!grouped.has(addon.type)) {
            grouped.set(addon.type, []);
        }
        grouped.get(addon.type)!.push(addon);
    });

    // Sort by cost and take top N from each type
    const limited: AddonFromDB[] = [];
    grouped.forEach((items, type) => {
        const sorted = items.sort((a, b) => a.cost - b.cost).slice(0, limitPerType);
        limited.push(...sorted);
        logger.debug(`[getLimitedAddonsByType] ${type}: showing ${sorted.length}/${items.length} options`);
    });

    return limited;
}

/**
 * ✅ UTILITY: Clear addon cache (call after database updates)
 */
export function clearAddonCache(): void {
    logger.info("[clearAddonCache] Clearing addon cache");
    addonCache = null;
    cacheTimestamp = 0;
}
