import { AddonFromDB } from "@agents/tools/io/IAddonDatabase";

export interface IAddonDatabaseService {
    /**
     * Fetch addons from database (NO CACHE)
     */
    fetchFromDatabase(): Promise<AddonFromDB[]>;

    /**
     * Fetch addons with automatic caching (15 min TTL)
     */
    getAddonsWithCache(): Promise<AddonFromDB[]>;

    /**
     * Limit addons by type (e.g. 10 per type)
     */
    getLimitedAddonsByType(
        addons: AddonFromDB[],
        limitPerType?: number
    ): AddonFromDB[];

    /**
     * Clears the cache (should be called after DB modifications)
     */
    clearCache(): void;
}
