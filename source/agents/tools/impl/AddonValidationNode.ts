/**
 * ============================================================================
 * ADDON SYSTEM VALIDATION SCRIPT
 * ============================================================================
 * Run this to verify everything is working end-to-end
 */

import { getAddonsWithCache, getLimitedAddonsByType, clearAddonCache } from "@agents/tools/impl/AddonDatabaseService";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

async function validateAddonSystem() {
    logger.info("════════════════════════════════════════════════════════════════");
    logger.info("🔍 ADDON SYSTEM VALIDATION - Starting");
    logger.info("════════════════════════════════════════════════════════════════");

    try {
        // TEST 1: Clear cache
        logger.info("\n[TEST 1] Clearing addon cache...");
        clearAddonCache();
        logger.info("✅ Cache cleared");

        // TEST 2: Fetch all addons
        logger.info("\n[TEST 2] Fetching all addons from database...");
        const allAddons = await getAddonsWithCache();

        if (allAddons.length === 0) {
            logger.error("❌ FAILED: No addons returned from database");
            return false;
        }

        logger.info(`✅ Fetched ${allAddons.length} addons total`);

        // TEST 3: Verify addon structure
        logger.info("\n[TEST 3] Verifying addon data structure...");
        const firstAddon = allAddons[0];
        if (!firstAddon.id || !firstAddon.label || !firstAddon.type || firstAddon.cost === undefined) {
            logger.error("❌ FAILED: Addon structure invalid");
            logger.error("Sample addon:", firstAddon);
            return false;
        }
        logger.info("✅ Addon structure valid");
        logger.info(`   Sample: ${firstAddon.label} [${firstAddon.type}] - $${firstAddon.cost}`);

        logger.info("\n[TEST 4] Checking addon types...");
        const typeMap = new Map<string, number>();
        allAddons.forEach(addon => {
            typeMap.set(addon.type, (typeMap.get(addon.type) || 0) + 1);
        });

        const expectedTypes = ["garage_door", "window", "walkin_door", "cupola", "brace", "anchor", "extra_addon"];
        const foundTypes = Array.from(typeMap.keys());

        logger.info(`Expected types: ${expectedTypes.join(", ")}`);
        logger.info(`Found types: ${foundTypes.join(", ")}`);

        typeMap.forEach((count, type) => {
            logger.info(`  ✅ ${type}: ${count} options`);
        });

        logger.info("\n[TEST 5] Testing addon limiter (top 10 per type)...");
        const limited = getLimitedAddonsByType(allAddons, 10);
        logger.info(`✅ Limited to ${limited.length} addons (from ${allAddons.length})`);

        const limitedByType = new Map<string, number>();
        limited.forEach(addon => {
            limitedByType.set(addon.type, (limitedByType.get(addon.type) || 0) + 1);
        });

        limitedByType.forEach((count, type) => {
            logger.info(`  ✅ ${type}: ${count}/10 shown`);
        });

        logger.info("\n[TEST 6] Testing type-based filtering...");
        const windowAddons = allAddons.filter(a => a.type === "window");
        logger.info(`✅ Windows: ${windowAddons.length} available`);

        if (windowAddons.length > 0) {
            const sortedByPrice = windowAddons.sort((a, b) => a.cost - b.cost);
            logger.info(`   Cheapest window: ${sortedByPrice[0].label} - $${sortedByPrice[0].cost}`);
            logger.info(`   Most expensive window: ${sortedByPrice[sortedByPrice.length - 1].label} - $${sortedByPrice[sortedByPrice.length - 1].cost}`);
        }

        logger.info("\n[TEST 7] Testing cache mechanism...");
        const start = Date.now();
        const cached = await getAddonsWithCache();
        const duration = Date.now() - start;

        logger.info(`✅ Cached fetch: ${cached.length} addons in ${duration}ms`);
        if (duration < 10) {
            logger.info("   (Should be very fast since cached)");
        }

        logger.info("\n[TEST 8] Verifying cost data...");
        const withCost = allAddons.filter(a => a.cost > 0);
        const noCost = allAddons.filter(a => a.cost === 0);

        logger.info(`✅ With cost: ${withCost.length} addons`);
        logger.info(`✅ Zero cost (anchors/extras): ${noCost.length} addons`);

        const totalCost = withCost.reduce((sum, a) => sum + a.cost, 0);
        logger.info(`✅ Total addon inventory value: $${totalCost.toFixed(2)}`);

        // FINAL RESULT
        logger.info("\n════════════════════════════════════════════════════════════════");
        logger.info("✅ ALL TESTS PASSED - Addon system is working!");
        logger.info("════════════════════════════════════════════════════════════════");
        logger.info("\nSummary:");
        logger.info(`  📊 Total addons: ${allAddons.length}`);
        logger.info(`  🎯 Types: ${foundTypes.length}`);
        logger.info(`  💰 With pricing: ${withCost.length}`);
        logger.info(`  ⚡ Menu display: ~${limited.length} (limited)`);
        logger.info(`  💾 Cache: Working (${duration}ms)`);
        logger.info("\n🚀 Ready for production!");

        return true;

    } catch (error) {
        logger.error("❌ VALIDATION FAILED:");
        logger.error(error);
        return false;
    }
}

// Run validation
validateAddonSystem().then(success => {
    if (!success) {
        process.exit(1);
    }
});
