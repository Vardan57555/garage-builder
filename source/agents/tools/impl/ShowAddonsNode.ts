import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { LeadAgentHelpers } from "@agents/LeadAgentHelpers";
import {AddonManager} from "@agents/tools/impl/AddonDatabaseService";
import {IAddonDatabaseService} from "@agents/tools/impl/io/IAddonDatabaseService";
import { AddonMenuItem, ShowAddonsResponse } from "./io/IShowAddons";
import {
    IAddonDataProvider,
    IAddonMenuFormatter,
    IAddonValidator,
    IShowAddonsOrchestrator
} from "@agents/tools/io/IShowAddonsNode";
import {AddonFromDB} from "@agents/tools/io/IAddonDatabase";
import {InstantiationError} from "@errors/InstantiationError";
const logger: pino.Logger = createLogger(module);

/**
 * Formats addon data for display
 */
class AddonMenuFormatter implements IAddonMenuFormatter
{

    private static instance: IAddonMenuFormatter;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonMenuFormatter.getInstance() instead of new.");
        }

    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IAddonMenuFormatter
    {
        if(!AddonMenuFormatter.instance)
        {
            AddonMenuFormatter.instance = new AddonMenuFormatter(Enforce);
        }

        return AddonMenuFormatter.instance;
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
    public buildPromptMessage(currentParams: string, addonDisplay: string): string {
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
}

/**
 * Fetches and processes addons from database
 */
class AddonDataProvider implements IAddonDataProvider
{

    private readonly addonManagerInstance: IAddonDatabaseService = AddonManager.getInstance();

    private static instance: IAddonDataProvider;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonDataProvider.getInstance() instead of new.");
        }

    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IAddonDataProvider
    {
        if(!AddonDataProvider.instance)
        {
            AddonDataProvider.instance = new AddonDataProvider(Enforce);
        }

        return AddonDataProvider.instance;
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
     * Fetch and process addons from a database
     */
    public async getAddonsMenu(): Promise<AddonMenuItem[]>
    {
        try {
            logger.debug(`[AddonDataProvider] Fetching addons from database`);

            const allAddons: AddonFromDB[] = await this.addonManagerInstance.getAddonsWithCache();

            if (allAddons.length === 0)
            {
                logger.warn(`[AddonDataProvider] No addons available in database`);
                return [];
            }

            logger.debug(`[AddonDataProvider] Retrieved ${allAddons.length} addons from database`);

            const limitedAddons: AddonFromDB[] = this.addonManagerInstance.getLimitedAddonsByType(allAddons, 10);
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
}

/**
 * Validates addon data
 */
class AddonValidator implements IAddonValidator
{

    private static instance: IAddonValidator;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonValidator.getInstance() instead of new.");
        }

    }

    /**
     * Gets the singleton instance of StateReset.
     *
     * @returns The singleton instance of StateReset.
     */

    public static getInstance(): IAddonValidator
    {
        if(!AddonValidator.instance)
        {
            AddonValidator.instance = new AddonValidator(Enforce);
        }

        return AddonValidator.instance;
    }

    /**
     * Validate addon menu has items
     */
    public hasItems(addons: AddonMenuItem[]): boolean
    {
        return Array.isArray(addons) && addons.length > 0;
    }

    /**
     * Validate pricing data in state
     */
    hasValidPricingData(basePrice: number | undefined): boolean
    {
        if (basePrice === undefined || basePrice === null)
        {
            logger.warn(`[AddonValidator] Invalid basePrice`);
            return false;
        }

        return true;
    }
}

/**
 * Orchestrates showing addons to user
 */
class ShowAddonsOrchestrator implements IShowAddonsOrchestrator
{
    private readonly dataProvider: IAddonDataProvider;
    private readonly validator: IAddonValidator;
    private readonly formatter: IAddonMenuFormatter;

    constructor(dataProvider?: AddonDataProvider, validator?: AddonValidator, formatter?: AddonMenuFormatter)
    {
        this.dataProvider = dataProvider || AddonDataProvider.getInstance();
        this.validator = validator || AddonValidator.getInstance();
        this.formatter = formatter || AddonMenuFormatter.getInstance();
    }

    /**
     * Build response when no addons available
     */
    private buildNoAddonsResponse(): ShowAddonsResponse
    {
        return {response: this.formatter.buildFallbackMessage(), nextStep: "__end__"};
    }

    /**
     * Build error response
     */
    private buildErrorResponse(): ShowAddonsResponse
    {
        return {response: this.formatter.buildErrorMessage(), nextStep: "__end__"};
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
     * Main orchestration method
     */
    async execute(state: LeadAgentStateType): Promise<ShowAddonsResponse>
    {
       logger.info(`[ShowAddonsOrchestrator] Session ${state.sessionId} - Preparing addon display`);

        try
        {
            const addonsMenu: AddonMenuItem[] = await this.dataProvider.getAddonsMenu();

            if (!this.validator.hasItems(addonsMenu))
            {
                logger.info(`[ShowAddonsOrchestrator] No addons to display`);
                return this.buildNoAddonsResponse();
            }

            if (!this.validator.hasValidPricingData(state.basePrice))
            {
                logger.warn(`[ShowAddonsOrchestrator] Invalid pricing data`);
                return this.buildErrorResponse();
            }

            const currentParams: string = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);
            const addonDisplay: string = this.formatter.formatMenu(addonsMenu);
            const promptMessage: string = this.formatter.buildPromptMessage(currentParams, addonDisplay,);

            logger.info(`[ShowAddonsOrchestrator] Successfully prepared ${addonsMenu.length} addons for display`);

            return this.buildSuccessResponse(state, addonsMenu, promptMessage);
        }
        catch (error)
        {
            logger.error(`[ShowAddonsOrchestrator] Error during execution:`, error);
            return this.buildErrorResponse();
        }
    }
}

/**
 * NODE: Show available addons after price calculation
 */
export const showAddonsNode = async (state: LeadAgentStateType): Promise<ShowAddonsResponse> =>
{
    const orchestrator = new ShowAddonsOrchestrator();
    return orchestrator.execute(state);
};

/**
 * Export classes for testing and customization
 */
export {
    ShowAddonsOrchestrator,
    AddonDataProvider,
    AddonMenuFormatter,
    AddonValidator,
    AddonMenuItem,
    ShowAddonsResponse,
};


/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
