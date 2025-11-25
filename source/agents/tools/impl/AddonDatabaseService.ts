import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {AddonFromDB, CacheEntry} from "@agents/tools/io/IAddonDatabase";
import {IAddonDatabaseService} from "@agents/tools/impl/io/IAddonDatabaseService";
import {InstantiationError} from "@errors/InstantiationError";

const logger: pino.Logger = createLogger(module);


/**
 * AddonManager: Handles fetching, caching, and filtering of addon data
 * with type safety and consistent error handling
 */
export class AddonManager implements IAddonDatabaseService
{
    private static instance: IAddonDatabaseService;
    private static readonly CACHE_DURATION: number = 15 * 60 * 1000;
    private static readonly FETCH_PROCEDURE: string = "getAllAddonOptions()";
    private static readonly FETCH_CONTEXT: string = "all_addons";
    private static readonly MIN_COST: number = 0;

    private cache: CacheEntry<AddonFromDB[]> | null = null;

    /**
     * Private constructor to enforce a Singleton pattern.
     *
     * @param enforce - Function to enforce a Singleton pattern.
     * @throws Error if instantiation is attempted directly.
     */


    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonManager.getInstance() instead of new.");
        }
    }


    /**
     * Gets the singleton instance of BuildingService.
     *
     * @returns The singleton instance of BuildingService.
     */

    public static getInstance(): IAddonDatabaseService
    {
        if(!AddonManager.instance)
        {
            AddonManager.instance = new AddonManager(Enforce);
        }

        return AddonManager.instance;
    }

    /**
     * Retrieves addons with automatic caching (15 minute TTL)
     * Used by: ShowAddonsNode, ProcessAddonsNode
     */

    public async getAddonsWithCache(): Promise<AddonFromDB[]>
    {
        if (this.isCacheValid())
        {
            logger.debug(`[AddonManager] Cache hit (${this.cache!.data.length} items)`);
            return this.cache!.data;
        }

        logger.info("[AddonManager] Cache miss or expired, fetching fresh data");

        try
        {
            const data: AddonFromDB[] = await this.fetchFromDatabase();
            this.cache = { data, timestamp: Date.now() };
            return data;
        }
        catch (error)
        {
            logger.error("[AddonManager] Error fetching addons:", error);
            return this.cache?.data ?? [];
        }
    }

    /**
     * Returns limited addons per type to prevent UI overwhelming (e.g., 75K+ options)
     * Sorts by cost ascending within each type
     */
    public getLimitedAddonsByType(addons: AddonFromDB[], limitPerType: number = 10): AddonFromDB[]
    {
        const typeGroups = this.partitionByType(addons);

        return Array.from(typeGroups.entries()).flatMap(
            ([type, items]) => this.selectTopItems(items, type, limitPerType)
        );
    }

    /**
     * Fetches addons from a database and transforms raw data
     */

    public async fetchFromDatabase(): Promise<AddonFromDB[]>
    {
        logger.info("[AddonManager] Fetching addons from database");

        const result = await ProcedureExecutor.getProcedureData<any>(
            [],
            AddonManager.FETCH_PROCEDURE,
            AddonManager.FETCH_CONTEXT
        );

        if (!result?.length)
        {
            logger.warn("[AddonManager] No addons found in database");
            return [];
        }

        return this.transformAndValidateAddons(result);
    }

    /**
     * Invalidates cache (call after database mutations)
     */
    public clearCache(): void
    {
        logger.info("[AddonManager] Cache cleared");
        this.cache = null;
    }

    /**
     * Transforms raw database rows into typed addon objects
     */
    private transformAndValidateAddons(rows: any[]): AddonFromDB[]
    {
        const addons = rows
            .map(row => this.mapRowToAddon(row))
            .filter(addon => addon.cost > AddonManager.MIN_COST);

        this.logAddonStatistics(addons);
        return addons;
    }

    /**
     * Maps a single database row to addon interface
     */
    private mapRowToAddon(row: any): AddonFromDB
    {
        return {
            id: String(row.id),
            name: row.name ?? "Unknown",
            label: row.label ?? row.name ?? "Unknown",
            type: row.type ?? "other",
            cost: Math.max(parseFloat(row.cost) || 0, AddonManager.MIN_COST),
            description: row.description ?? "",
            category: row.category ?? "",
        };
    }

    /**
     * Logs aggregated statistics about fetched addons
     */
    private logAddonStatistics(addons: AddonFromDB[]): void
    {
        logger.info(`[AddonManager] Fetched ${addons.length} addons`);

        const typeDistribution: Map<string, number> = this.groupByType(addons);
        typeDistribution.forEach((count, type) =>
        {
            logger.info(`  - ${type}: ${count} addon(s)`);
        });
    }

    /**
     * Groups addons by type and returns frequency map
     */
    private groupByType(addons: AddonFromDB[]): Map<string, number>
    {
        return addons.reduce((acc, addon) => {
            acc.set(addon.type, (acc.get(addon.type) ?? 0) + 1);
            return acc;
        }, new Map<string, number>());
    }

    /**
     * Checks if the cache is valid and not expired
     */
    private isCacheValid(): boolean
    {
        if (!this.cache)
        {
            return false
        }
        const age: number = Date.now() - this.cache.timestamp;
        return age < AddonManager.CACHE_DURATION;
    }

    /**
     * Partitions addons into type-based groups
     */
    private partitionByType(addons: AddonFromDB[]): Map<string, AddonFromDB[]>
    {
        return addons.reduce((acc, addon) =>
        {
            if (!acc.has(addon.type))
            {
                acc.set(addon.type, []);
            }
            acc.get(addon.type)!.push(addon);
            return acc;
        }, new Map<string, AddonFromDB[]>());
    }

    /**
     * Selects and logs top N items from a group
     */
    private selectTopItems(items: AddonFromDB[], type: string, limit: number): AddonFromDB[]
    {
        const selected: AddonFromDB[] = items.sort((a, b) => a.cost - b.cost).slice(0, limit);

        logger.debug(`[AddonManager] ${type}: showing ${selected.length}/${items.length}`);
        return selected;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}

