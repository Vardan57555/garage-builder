import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {AddonFromDB, CacheEntry} from "@agents/tools/io/IAddonDatabase";
import {InstantiationError} from "@errors/InstantiationError";
import {AddonService} from "@agents/tools/impl/io/AddonService";
import {Addon, ProcessingResult, SelectedAddon} from "@agents/tools/io/IProcessAddon";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import {AddonSelectionValidator} from "@agents/tools/validators/AddonSelectionValidator";
import {IPriceCalculatorService} from "@agents/tools/io/PriceCalculatorService";
import {PriceCalculatorService} from "@agents/tools/impl/PriceCalculationNode";
import {AddonMenuItem, ShowAddonsResponse} from "@agents/tools/impl/io/IShowAddons";
import {AddonValidator} from "@agents/tools/validators/AddonValidator";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";

const logger: pino.Logger = createLogger(module);


/**
 * AddonManager: Handles fetching, caching, and filtering of addon data
 * with type safety and consistent error handling
 */
export class AddonServiceImpl implements AddonService
{
    private static instance: AddonService;
    private static readonly CACHE_DURATION: number = 15 * 60 * 1000;
    private static readonly FETCH_PROCEDURE: string = "getAllAddonOptions()";
    private static readonly FETCH_CONTEXT: string = "all_addons";
    private static readonly MIN_COST: number = 0;
    private readonly addonTypeMatchers: Record<string, (keyword: string, type: string, label: string) => boolean>;
    private cache: CacheEntry<AddonFromDB[]> | null = null;
    private readonly calculator: IPriceCalculatorService;

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
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonServiceImpl.getInstance() instead of new.");
        }

        this.calculator = PriceCalculatorService.getInstance();
        this.addonTypeMatchers = this.initializeTypeMatchers();
    }

    /**
     * Gets the singleton instance of AddonService.
     *
     * @returns The singleton instance of AddonService.
     */

    public static getInstance(): AddonService
    {
        if(!AddonServiceImpl.instance)
        {
            AddonServiceImpl.instance = new AddonServiceImpl(Enforce);
        }

        return AddonServiceImpl.instance;
    }

    /**
     * Retrieves addons with automatic caching (15 minute TTL)
     * Used by: ShowAddonsNode, ProcessAddonsNode
     */

    public async getAddonsWithCache(): Promise<AddonFromDB[]>
    {
        if (this.isCacheValid())
        {
            logger.debug(`[AddonServiceImpl] Cache hit (${this.cache!.data.length} items)`);
            return this.cache!.data;
        }

        logger.info("[AddonServiceImpl] Cache miss or expired, fetching fresh data");

        try
        {
            const data: AddonFromDB[] = await this.fetchFromDatabase();
            this.cache = { data, timestamp: Date.now() };
            return data;
        }
        catch (error)
        {
            logger.error("[AddonServiceImpl] Error fetching addons:", error);
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
        logger.info("[AddonServiceImpl] Fetching addons from database");

        const result = await ProcedureExecutor.getProcedureData<any>(
            [],
            AddonServiceImpl.FETCH_PROCEDURE,
            AddonServiceImpl.FETCH_CONTEXT
        );

        if (!result?.length)
        {
            logger.warn("[AddonServiceImpl] No addons found in database");
            return [];
        }

        return this.transformAndValidateAddons(result);
    }

    /**
     * Invalidates cache (call after database mutations)
     */
    public clearCache(): void
    {
        logger.info("[AddonServiceImpl] Cache cleared");
        this.cache = null;
    }

    /**
     * Main parse method: orchestrates multiple parsing strategies
     */
    public parse(userInput: string, addonsMenu: Addon[]): SelectedAddon[]
    {
        logger.info(`[AddonParser] Parsing: "${userInput}" from ${addonsMenu.length} available addons`);

        if (addonsMenu.length === 0) {
            logger.warn(`[AddonParser] No addons available`);
            return [];
        }

        if (this.isNumericSelection(userInput)) {
            const result = this.parseNumericSelections(userInput, addonsMenu);
            if (result.length > 0) {
                return result;
            }
        }

        let result = this.parseQuantitySelections(userInput, addonsMenu);
        if (result.length > 0) {
            return result;
        }

        result = this.parseKeywordOnlySelection(userInput, addonsMenu);
        if (result.length > 0) {
            return result;
        }

        logger.warn(`[AddonParser] No matches found for: "${userInput}"`);
        return [];
    }

    /**
     * Process user addon selection request
     */
    public async process(state: LeadAgentStateType): Promise<ProcessingResult>
    {
        logger.info(`[AddonsProcessor] Session ${state.sessionId} - Processing selection`);

        try
        {
            const userInput = state.messages[state.messages.length - 1]?.content as string | undefined;

            if (!AddonSelectionValidator.hasValidInput(userInput))
            {
                return this.createResponse("Please specify which addons you'd like.", "__end__", [], state.basePrice);
            }

            if (AddonSelectionValidator.isUserDecline(userInput!))
            {
                logger.info(`[AddonsProcessor] User declined addons`);
                return this.createResponse(undefined, "generate_visualization", [], state.basePrice, true);
            }

            const addonsMenu = (state as any).addonsMenu as Addon[] | undefined;
            if (AddonSelectionValidator.hasValidAddonMenu(addonsMenu))
            {
                logger.warn(`[AddonsProcessor] No addons menu in state`);
                return this.createResponse("Error: Addon menu not available.", "__end__", [], state.basePrice);
            }

            const selectedAddons: SelectedAddon[] = this.parse(userInput!, addonsMenu!);

            if (selectedAddons.length === 0)
            {
                logger.warn(`[AddonsProcessor] No addons matched user input`);
                return this.createResponse(
                    `I didn't catch that. Try:\n• "1" or "1, 2" to select by number\n• "2 windows" to specify quantity\n• "no" to skip`,
                    "__end__",
                    [],
                    state.basePrice
                );
            }

            const finalPrice: number = this.calculator.calculateTotalPrice(state.basePrice || 0, selectedAddons);

            return this.createResponse(undefined, "generate_visualization", selectedAddons, finalPrice, true);
        }
        catch (error)
        {
            logger.error(`[AddonsProcessor] Unexpected error:`, error);
            return this.createResponse("❌ Error processing addons.", "__end__", [], state.basePrice);
        }
    }

    /**
     * Main orchestration method
     */
    public async execute(state: LeadAgentStateType): Promise<ShowAddonsResponse>
    {
        logger.info(`[ShowAddonsOrchestrator] Session ${state.sessionId} - Preparing addon display`);

        try
        {
            const addonsMenu: AddonMenuItem[] = await this.getAddonsMenu();

            if (!AddonValidator.hasItems(addonsMenu))
            {
                logger.info(`[ShowAddonsOrchestrator] No addons to display`);
                return this.buildNoAddonsResponse();
            }

            if (!AddonValidator.hasValidPricingData(state.basePrice))
            {
                logger.warn(`[ShowAddonsOrchestrator] Invalid pricing data`);
                return this.buildErrorResponse();
            }

            const currentParams: string = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
            const addonDisplay: string = this.formatMenu(addonsMenu);
            const promptMessage: string = this.buildPromptMessage(currentParams, addonDisplay,);

            logger.info(`[ShowAddonsOrchestrator] Successfully prepared ${addonsMenu.length} addons for display`);

            return this.buildSuccessResponse(state, addonsMenu, promptMessage);
        }
        catch (error)
        {
            logger.error(`[ShowAddonsOrchestrator] Error during execution:`, error);
            return this.buildErrorResponse();
        }
    }

    /**
     * Fetch and process addons from a database
     */
    public async getAddonsMenu(): Promise<AddonMenuItem[]>
    {
        try {
            logger.debug(`[AddonDataProvider] Fetching addons from database`);

            const allAddons: AddonFromDB[] = await this.getAddonsWithCache();

            if (allAddons.length === 0)
            {
                logger.warn(`[AddonDataProvider] No addons available in database`);
                return [];
            }

            logger.debug(`[AddonDataProvider] Retrieved ${allAddons.length} addons from database`);

            const limitedAddons: AddonFromDB[] = this.getLimitedAddonsByType(allAddons, 10);
            const menuItems: AddonMenuItem[] = this.transformToMenuItems(limitedAddons);

            logger.info(`[AddonDataProvider] Built menu with ${menuItems.length} addons ` + `(limited from ${allAddons.length} total)`);

            return menuItems;
        }
        catch (error)
        {
            logger.error(`[AddonDataProvider] Failed to fetch addons:`, error);
            throw error;
        }
    }

    /**
     * Format entire menu for display
     */
    public formatMenu(addons: AddonMenuItem[]): string
    {
        if (addons.length === 0)
        {
            return "";
        }

        return addons.map((addon, idx) => this.formatAddonItem(addon, idx)).join("\n\n");
    }

    /**
     * Build the complete prompt message
     */
    public buildPromptMessage(currentParams: string, addonDisplay: string): string
    {
        return (
            `${currentParams}\n\n` +
            `✨ **Would you like to add any optional features?**\n\n` +
            `${addonDisplay}\n\n` +
            `**Examples:**\n` +
            `• "1" or "1, 2" - Select by number\n` +
            `• "2 windows" - Select by name and quantity\n` +
            `• "add 3 doors and 2 windows" - Multiple addons\n` +
            `• "no" or "skip" - No addons\n\n` +
            `What would you like to add?`
        );
    }

    /**
     * Build a fallback message when no addons available
     */
    public buildFallbackMessage(): string
    {
        return "✓ Price calculated. No additional options available at this time.";
    }

    /**
     * Build an error message
     */
    public buildErrorMessage(): string
    {
        return "✓ Price calculated. Ready to finalize your quote.";
    }

    /**
     * Transform raw addon data into menu format
     */
    private transformToMenuItems(addons: any[]): AddonMenuItem[]
    {
        return addons.map(addon => ({
            id: addon.id,
            label: addon.label,
            type: addon.type,
            cost: addon.cost,
            description: addon.description || "",
        }));
    }


    /**
     * Build response when no addons available
     */
    private buildNoAddonsResponse(): ShowAddonsResponse
    {
        return {response: this.buildFallbackMessage(), nextStep: "__end__"};
    }


    /**
     * Format single addon for display
     */
    private formatAddonItem(addon: AddonMenuItem, index: number): string
    {
        const costDisplay: string = addon.cost > 0 ? `$${addon.cost.toFixed(2)}` : "Included";
        const typeLabel: string = addon.type ? ` [${addon.type}]` : "";
        const description: string = addon.description ? `\n   ${addon.description}` : "";

        return `${index + 1}. ${addon.label}${typeLabel} - ${costDisplay}${description}`;
    }

    /**
     * Build error response
     */
    private buildErrorResponse(): ShowAddonsResponse
    {
        return {response: this.buildErrorMessage(), nextStep: "__end__"};
    }

    /**
     * Build a successful response with addons
     */
    private buildSuccessResponse(state: LeadAgentStateType, addonsMenu: AddonMenuItem[], promptMessage: string): ShowAddonsResponse
    {
        return {
            response: promptMessage,
            addonsMenu,
            pricingData: state.pricingData,
            basePrice: state.basePrice,
            finalPrice: state.basePrice,
            nextStep: "__end__",
        };
    }

    /**
     * Helper to create consistent response structure
     */
    private createResponse(response: string | undefined, nextStep: string, selectedAddons: SelectedAddon[], finalPrice: number, priceCalculated: boolean = false): ProcessingResult
    {
        const result: ProcessingResult = {
            selectedAddons,
            finalPrice,
            priceCalculated,
            nextStep,
        };

        if (response)
        {
            result.response = response;
        }

        return result;
    }

    /**
     * Initialize addon type matching rules
     */
    private initializeTypeMatchers(): Record<string, (keyword: string, type: string, label: string) => boolean>
    {
        return {
            window: (keyword, type) => keyword.includes('window') && type.includes('window'),
            door: (keyword, type) =>
                keyword.includes('door') && !keyword.includes('walkin') &&
                type.includes('door') && !type.includes('walkin'),
            walkin: (keyword, type) => keyword.includes('walkin') && type.includes('walkin'),
            brace: (keyword, type) => keyword.includes('brace') && type.includes('brace'),
            cupola: (keyword, type) => keyword.includes('cupola') && type.includes('cupola'),
            sectional: (keyword, _, label) => keyword.includes('sectional') && label.includes('sectional'),
        };
    }

    /**
     * Normalize text for consistent matching
     */

    private normalizeText(text: string): string
    {
        return text
            .toLowerCase()
            .trim()
            .replace(/[_\s-]+/g, '')
            .replace(/s$/, '');
    }

    /**
     * Check if user input looks like numeric selections
     */

    private isNumericSelection(input: string): boolean
    {
        return /^[\d,\s]+$/.test(input.trim());
    }

    /**
     * Parse numeric selections from user input (e.g., "1, 2, 3")
     */

    private parseNumericSelections(input: string, addonsMenu: Addon[]): SelectedAddon[]
    {
        const numberMatches: RegExpMatchArray = input.match(/\d+/g);

        if (!numberMatches?.length)
        {
            return [];
        }

        const validIndices: number[] = numberMatches
            .map(n => parseInt(n, 10) - 1)
            .filter(idx => idx >= 0 && idx < addonsMenu.length);

        if (validIndices.length === 0)
        {
            return [];
        }

        logger.info(`[AddonParser] Selected ${validIndices.length} addons by numeric index`);
        return validIndices.map(idx => addonsMenu[idx]);
    }

    /**
     * Match addon by fields or type categories
     */
    private matchAddonByKeyword(addon: Addon, normalizedKeyword: string, normalizedType: string): boolean
    {
        const normalizedLabel: string = this.normalizeText(addon.label || "");
        const normalizedName: string = this.normalizeText(addon.name || "");

        if (normalizedLabel === normalizedKeyword ||
            normalizedName === normalizedKeyword ||
            normalizedLabel.includes(normalizedKeyword) ||
            normalizedName.includes(normalizedKeyword) ||
            normalizedKeyword.includes(normalizedLabel) ||
            normalizedKeyword.includes(normalizedName))
        {
            return true;
        }

        return Object.values(this.addonTypeMatchers).some(matcher =>
            matcher(normalizedKeyword, normalizedType, normalizedLabel)
        );
    }

    /**
     * Find addons matching a keyword
     */
    private findMatchingAddons(keyword: string, addonsMenu: Addon[]): Addon[]
    {
        const normalizedKeyword: string = this.normalizeText(keyword);

        return addonsMenu.filter(addon =>
        {
            const normalizedType: string = this.normalizeText(addon.type || "");
            return this.matchAddonByKeyword(addon, normalizedKeyword, normalizedType);
        });
    }

    /**
     * Parse quantity + keyword patterns (e.g., "2 windows", "add 3 doors")
     */
    private parseQuantitySelections(input: string, addonsMenu: Addon[]): SelectedAddon[]
    {
        const quantityPattern = /(?:add|also|and|get|want|need)?\s*(\d+)\s+([\w_]+(?:\s+[\w_]+)*)/gi;
        const matches: RegExpExecArray[] = [...input.matchAll(quantityPattern)];

        if (matches.length === 0)
        {
            return [];
        }

        const selected: SelectedAddon[] = [];

        matches.forEach((match, idx) => {
            const quantity: number = parseInt(match[1], 10);
            const keyword: string = match[2].trim();
            const matchingAddons: Addon[] = this.findMatchingAddons(keyword, addonsMenu);

            logger.debug(`[AddonParser] Quantity match ${idx}: quantity=${quantity}, keyword="${keyword}", matches=${matchingAddons.length}`);

            for (let i = 0; i < quantity; i++)
            {
                const addon: Addon = matchingAddons[i % matchingAddons.length];
                selected.push({
                    ...addon,
                    id: `${addon.id}_${Date.now()}_${i}`,
                });
            }
        });

        return selected;
    }

    /**
     * Fallback: keyword-only matching
     */
    private parseKeywordOnlySelection(input: string, addonsMenu: Addon[]): SelectedAddon[]
    {
        const normalizedInput: string = this.normalizeText(input);
        const matches: Addon[] = addonsMenu.filter(addon => {
            const normalizedLabel: string = this.normalizeText(addon.label || "");
            const normalizedName: string = this.normalizeText(addon.name || "");

            return normalizedLabel.includes(normalizedInput) ||
                normalizedName.includes(normalizedInput) ||
                normalizedInput.includes(normalizedLabel) ||
                normalizedInput.includes(normalizedName);
        });

        return matches.length > 0 ? [matches[0]] : [];
    }

    /**
     * Transforms raw database rows into typed addon objects
     */
    private transformAndValidateAddons(rows: any[]): AddonFromDB[]
    {
        const addons = rows
            .map(row => this.mapRowToAddon(row))
            .filter(addon => addon.cost > AddonServiceImpl.MIN_COST);

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
            cost: Math.max(parseFloat(row.cost) || 0, AddonServiceImpl.MIN_COST),
            description: row.description ?? "",
            category: row.category ?? "",
        };
    }

    /**
     * Logs aggregated statistics about fetched addons
     */
    private logAddonStatistics(addons: AddonFromDB[]): void
    {
        logger.info(`[AddonServiceImpl] Fetched ${addons.length} addons`);

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
        return age < AddonServiceImpl.CACHE_DURATION;
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

        logger.debug(`[AddonServiceImpl] ${type}: showing ${selected.length}/${items.length}`);
        return selected;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}


/**
 * NODE: Process user's addon selections
 */
export const processAddonsSelectionNode = async (state: LeadAgentStateType): Promise<ProcessingResult> =>
{
    const processor: AddonService = AddonServiceImpl.getInstance();
    return processor.process(state);
};


/**
 * NODE: Show available addons after price calculation
 */
export const showAddonsNode = async (state: LeadAgentStateType): Promise<ShowAddonsResponse> =>
{
    const processor: AddonService = AddonServiceImpl.getInstance();
    return processor.execute(state);
};
