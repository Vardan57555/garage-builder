import { IAddonSelectionParser } from "./io/IProcessAddonNode";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {InstantiationError} from "@errors/InstantiationError";
import {Addon, SelectedAddon} from "@agents/tools/io/IProcessAddon";
const logger: pino.Logger = createLogger(module);

/**
 * Handles parsing and matching of addon selections
 */
export class AddonSelectionParser implements IAddonSelectionParser
{
    private static instance: IAddonSelectionParser;

    private readonly addonTypeMatchers: Record<string, (keyword: string, type: string, label: string) => boolean>;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use AddonManager.getInstance() instead of new.");
        }

        this.addonTypeMatchers = this.initializeTypeMatchers();
    }

    /**
     * Gets the singleton instance of BuildingService.
     *
     * @returns The singleton instance of BuildingService.
     */

    public static getInstance(): IAddonSelectionParser
    {
        if(!AddonSelectionParser.instance)
        {
            AddonSelectionParser.instance = new AddonSelectionParser(Enforce);
        }

        return AddonSelectionParser.instance;
    }

    /**
     * Main parse method: orchestrates multiple parsing strategies
     */
    public parse(userInput: string, addonsMenu: Addon[]): SelectedAddon[] {
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
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}
