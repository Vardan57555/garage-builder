import {CacheEntry, ColorOption} from "@agents/tools/io/IColorChoice";
import { IColorCache } from "./io/IColorDatabaseService";
import {InstantiationError} from "@errors/InstantiationError";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {ColorFetcher} from "@agents/tools/impl/ColorFetcher";
import {Constants} from "@common/io/Constants";
const logger: pino.Logger = createLogger(module);

/**
 * ColorCache: Manages color data caching with TTL
 */
export class ColorCache implements IColorCache
{
    private static instance: IColorCache;
    private static readonly CACHE_DURATION: number = 15 * 60 * 1000;
    private cache: CacheEntry<ColorOption[]> | null = null;


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

    public static getInstance(): IColorCache
    {
        if(!ColorCache.instance)
        {
            ColorCache.instance = new ColorCache(Enforce);
        }

        return ColorCache.instance;
    }

    /**
     * Checks if cache is valid and not expired
     */
    private isCacheValid(): boolean
    {
        if (!this.cache)
        {
            return false;
        }
        const age: number = Date.now() - this.cache.timestamp;
        return age < ColorCache.CACHE_DURATION;
    }

    /**
     * Retrieves cached colors or fetches fresh
     */
    public async get(): Promise<ColorOption[]>
    {
        if (this.isCacheValid())
        {
            logger.debug(`[ColorCache] Hit (${this.cache!.data.length} items, age: ${Date.now() - this.cache!.timestamp}ms)`);
            return this.cache!.data;
        }

        logger.info("[ColorCache] Miss or expired, fetching fresh data");
        const colors: ColorOption[] = await ColorFetcher.fetch();

        this.cache = {
            data: colors.length > 0 ? colors : Constants.FALLBACK_COLORS,
            timestamp: Date.now(),
        };

        logger.info(`[ColorCache] Cached ${this.cache.data.length} colors (TTL: ${ColorCache.CACHE_DURATION}ms)`);
        return this.cache.data;
    }

    /**
     * Invalidates cache
     */
    public clear(): void
    {
        logger.info("[ColorCache] Cleared");
        this.cache = null;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
