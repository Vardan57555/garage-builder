import {ColorOption} from "@agents/tools/io/IColorChoice";

export interface IColorCache
{
    /**
     * Retrieves cached colors or fetches fresh ones.
     */
    get(): Promise<ColorOption[]>;

    /**
     * Invalidates the current cache.
     */
    clear(): void;
}
