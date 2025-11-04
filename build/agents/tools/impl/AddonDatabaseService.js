"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAddonsWithCache = getAddonsWithCache;
exports.getLimitedAddonsByType = getLimitedAddonsByType;
exports.clearAddonCache = clearAddonCache;
const ProcedureExecutor_1 = require("../../../utils/procedure/ProcedureExecutor");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
async function fetchAddonsFromDB() {
    try {
        logger.info("[fetchAddonsFromDB] Fetching all addons from database");
        const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([], "getAllAddonOptions()", "all_addons");
        if (!result || result.length === 0) {
            logger.warn("[fetchAddonsFromDB] No addons found in database");
            return [];
        }
        const addons = result
            .map((row) => ({
            id: String(row.id),
            name: row.name || "Unknown",
            label: row.label || row.name || "Unknown",
            type: row.type || "other",
            cost: parseFloat(row.cost) || 0,
            description: row.description || "",
            category: row.category || "",
        }))
            .filter(addon => addon.cost > 0);
        logger.info(`[fetchAddonsFromDB] ✅ Fetched ${addons.length} paid addons`);
        const typeCount = new Map();
        addons.forEach(addon => {
            typeCount.set(addon.type, (typeCount.get(addon.type) || 0) + 1);
        });
        typeCount.forEach((count, type) => {
            logger.info(`  - ${type}: ${count} addon(s)`);
        });
        return addons;
    }
    catch (error) {
        logger.error("[fetchAddonsFromDB] Error fetching addons:", error);
        return [];
    }
}
let addonCache = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 15 * 60 * 1000;
async function getAddonsWithCache() {
    const now = Date.now();
    if (addonCache && (now - cacheTimestamp) < CACHE_DURATION) {
        logger.debug(`[getAddonsWithCache] Using cached addons (${addonCache.length} items)`);
        return addonCache;
    }
    logger.info("[getAddonsWithCache] Cache expired or empty, fetching fresh addons");
    addonCache = await fetchAddonsFromDB();
    cacheTimestamp = now;
    return addonCache;
}
function getLimitedAddonsByType(addons, limitPerType = 10) {
    const grouped = new Map();
    addons.forEach(addon => {
        if (!grouped.has(addon.type)) {
            grouped.set(addon.type, []);
        }
        grouped.get(addon.type).push(addon);
    });
    const limited = [];
    grouped.forEach((items, type) => {
        const sorted = items.sort((a, b) => a.cost - b.cost).slice(0, limitPerType);
        limited.push(...sorted);
        logger.debug(`[getLimitedAddonsByType] ${type}: showing ${sorted.length}/${items.length} options`);
    });
    return limited;
}
function clearAddonCache() {
    logger.info("[clearAddonCache] Clearing addon cache");
    addonCache = null;
    cacheTimestamp = 0;
}
//# sourceMappingURL=AddonDatabaseService.js.map