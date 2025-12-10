import {CacheEntry, ColorDisplayEntry, ColorNodeResponse, ColorOption, DataSource} from "@agents/tools/io/IColorChoice";
import {InstantiationError} from "@errors/InstantiationError";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {Constants} from "@common/io/Constants";
import {ColorService} from "@agents/tools/impl/io/ColorService";
import {LeadAgentStateType} from "@agents/LeadAgentState";
import {LeadAgentHelpers} from "@agents/LeadAgentHelpers";
import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
import {ColorValidator} from "@agents/tools/validators/ColorValidator";
const logger: pino.Logger = createLogger(module);

/**
 * ColorCache: Manages color data caching with TTL
 */
export class ColorServiceImpl implements ColorService
{
    private static instance: ColorService;
    private static readonly CACHE_DURATION: number = 15 * 60 * 1000;
    private cache: CacheEntry<ColorOption[]> | null = null;
    private static readonly MAX_SAMPLES: number = 5;
    private static readonly INDIFFERENCE_PATTERNS: RegExp = /^(any|whatever|don't care|idc|idk|no preference|none)$/i;
    private static readonly DEFAULT_COLOR_NAME:string = "white";
    private colorOptions: ColorOption[];
    private lowerInput: string;
    private static readonly DEFAULT_COLOR:string = "White";
    private static readonly COLORS_PER_CATEGORY = 5;
    private categoryKeywordMap: Map<string, string> | null = null;

    constructor(enforce: () => void)
    {
        if(enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ColorServiceImpl.getInstance() instead of new.");
        }
    }

    /**
     * Gets the singleton instance of BuildingService.
     *
     * @returns The singleton instance of BuildingService.
     */

    public static getInstance(): ColorService
    {
        if(!ColorServiceImpl.instance)
        {
            ColorServiceImpl.instance = new ColorServiceImpl(Enforce);
        }

        return ColorServiceImpl.instance;
    }

    /**
     * Checks if the cache is valid and not expired
     */
    private isCacheValid(): boolean
    {
        if (!this.cache)
        {
            return false;
        }
        const age: number = Date.now() - this.cache.timestamp;
        return age < ColorServiceImpl.CACHE_DURATION;
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
        const colors: ColorOption[] = await this.fetch();

        this.cache = {
            data: colors.length > 0 ? colors : Constants.FALLBACK_COLORS,
            timestamp: Date.now(),
        };

        logger.info(`[ColorCache] Cached ${this.cache.data.length} colors (TTL: ${ColorServiceImpl.CACHE_DURATION}ms)`);
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


    /**
     * Groups colors by category with keyword-based matching
     */
    public group(colors: ColorOption[], limitPerCategory: number = 8): Map<string, ColorOption[]>
    {
        logger.info(`[ColorGrouper] Grouping ${colors.length} colors (limit: ${limitPerCategory}/category)`);

        const grouped = new Map<string, ColorOption[]>();
        Object.keys(Constants.COLOR_CATEGORIES).forEach(category =>
        {
            grouped.set(category, []);
        });

        colors.forEach(color => {
            const category: string = this.findMatchingCategory(color, grouped, limitPerCategory) ?? "⚪ Neutrals";

            const categoryList: ColorOption[] = grouped.get(category)!;
            if (categoryList.length < limitPerCategory)
            {
                categoryList.push(color);
            }
        });

        this.logGroupResults(grouped);
        return grouped;
    }


    /**
     * Fetches from a database with fallback strategy
     */
    public async fetch(): Promise<ColorOption[]>
    {
        logger.info("[ColorFetcher] Starting fetch with fallback strategy");

        for (const source of Constants.DATA_SOURCES)
        {
            const colors: ColorOption[] = await this.tryDataSource(source);
            if (colors)
            {
                return colors;
            }
        }

        logger.warn("[ColorFetcher] All database sources failed, using fallback colors");
        this.logSamples(Constants.FALLBACK_COLORS);
        return Constants.FALLBACK_COLORS;
    }


    /**
     * Detects color from user input using multi-strategy matching
     * Returns null if no match found
     */

    public detect(userInput: string, colorOptions: ColorOption[]): ColorOption | null
    {
        if (!ColorValidator.validateInput(userInput) || !ColorValidator.validateOptions(colorOptions))
        {
            return null;
        }

        this.lowerInput = userInput.toLowerCase().trim();
        this.colorOptions = colorOptions;
        return this.match();
    }

    /**
     * Executes a matching strategy chain
     */

    public match(): ColorOption | null
    {
        logger.info(`[ColorMatcher] Input: "${this.lowerInput}" | Available: ${this.colorOptions.length} colors`);

        if (this.colorOptions.length === 0)
        {
            logger.error("[ColorMatcher] No color options provided");
            return null;
        }

        return (
            this.tryIndifferenceMatch() ??
            this.tryNumberMatch() ??
            this.tryExactMatch() ??
            this.tryKeywordMatch() ??
            this.tryWordMatch() ??
            this.logNoMatch()
        );
    }

    /**
     * Creates a success response with color selection prompt
     */
    public createSelectionResponse(currentParams: string, colorMenu: string, instructions: string, displayColors: ColorOption[]): ColorNodeResponse
    {
        return {
            response: this.buildPrompt(
                currentParams,
                colorMenu,
                instructions
            ),
            userFriendlyParams: {},
            currentField: "color",
            colorOptions: displayColors,
            nextStep: "__end__",
        };
    }

    /**
     * Creates skip response (no colors available)
     */
    public createSkipResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse
    {
        logger.warn("[ColorNodeState] No colors available, skipping selection");
        return { userFriendlyParams, nextStep: "calculate_price"};
    }

    /**
     * Creates error fallback response
     */
    public createErrorResponse(userFriendlyParams: Record<string, any>): ColorNodeResponse
    {
        const params = { ...userFriendlyParams, color: ColorServiceImpl.DEFAULT_COLOR };
        return {
            response: `Proceeding with default color (${ColorServiceImpl.DEFAULT_COLOR}).`,
            userFriendlyParams: params,
            nextStep: "calculate_price",
        };
    }


    /**
     * Builds categorized a color menu with numbering and pricing
     */
    public buildColorMenu(groupedColors: Map<string, ColorOption[]>): { menu: string; displayEntries: ColorDisplayEntry[]; }
    {
        const displayEntries: ColorDisplayEntry[] = [];
        let menu: string = "🎨 **CHOOSE YOUR BUILDING COLOR:**\n\n";
        let colorIndex: number = 1;

        for (const [category, colors] of groupedColors.entries())
        {
            if (colors.length === 0)
            {
                continue;
            }

            menu += `**${category}:**\n`;

            colors.forEach(color =>
            {
                const costDisplay: string = this.formatCostDisplay(color.cost);
                const display = `  ${colorIndex}. ■ ${color.name} ${color.hex_value}${costDisplay}`;

                displayEntries.push({
                    index: colorIndex,
                    category,
                    color,
                    display,
                });

                menu += display + "\n";
                colorIndex++;
            });

            menu += "\n";
        }

        return { menu, displayEntries };
    }

    /**
     * Formats cost display for UI
     */
    private formatCostDisplay(cost: number): string
    {
        return cost > 0 ? ` +$${cost.toFixed(2)}` : " (included)";
    }

    /**
     * Generates selection instructions
     */
    public buildInstructions(): string
    {
        return (
            `**Examples:**\n` +
            `• "1" - Select by number\n` +
            `• "red" or "barn red" - Select by color name\n` +
            `• "white" - Select by keyword\n` +
            `• "any" or "skip" - Use default (${ColorServiceImpl.DEFAULT_COLOR})\n`
        );
    }

    /**
     * Constructs complete color selection prompt
     */
    public buildPrompt(currentParams: string, colorMenu: string, instructions: string): string
    {
        return (`${currentParams}\n\n` + colorMenu + instructions + `\nWhich color do you prefer?`);
    }

    /**
     * Transforms a single database row to ColorOption
     */
    public transformRow(row: any): ColorOption
    {
        return {
            id: parseInt(row.id),
            name: row.name ?? "Unknown",
            hex_value: row.hex_value ?? "#000000",
            red_value: parseInt(row.red_value) || 0,
            green_value: parseInt(row.green_value) || 0,
            blue_value: parseInt(row.blue_value) || 0,
            cost: parseFloat(row.cost) || 0,
        };
    }

    /**
     * Transforms an array of rows to ColorOptions
     */
    public transformRows(rows: any[]): ColorOption[]
    {
        return rows.map(row => this.transformRow(row));
    }

    /**
     * Validates color has required fields
     */
    public isValid(color: ColorOption): boolean
    {
        return !!(
            color.id &&
            color.name &&
            color.hex_value &&
            color.red_value !== undefined &&
            color.green_value !== undefined &&
            color.blue_value !== undefined &&
            color.cost !== undefined
        );
    }


    /**
     * Executes color selection node workflow
     */
    public async execute(state: LeadAgentStateType): Promise<ColorNodeResponse>
    {
        logger.info(`[ColorNodeManager] Session ${state.sessionId} - Starting color selection`);

        const colors: ColorOption[] = await this.loadColors();
        if (!colors)
        {
            return this.createSkipResponse(state.userFriendlyParams);
        }

        const groupedColors: Map<string, ColorOption[]> = this.prepareDisplayColors(colors);
        const displayColors: ColorOption[] = this.flattenDisplayColors(groupedColors);

        logger.info(`[ColorNodeManager] Display: ${displayColors.length} colors (from ${colors.length} total)`);

        const { menu } = this.buildColorMenu(groupedColors);
        const instructions: string = this.buildInstructions();
        const currentParams: string = LeadAgentHelpers.formatCurrentParams(state.userFriendlyParams);

        return this.createSelectionResponse(
            currentParams,
            menu,
            instructions,
            displayColors
        );
    }

    /**
     * Strategy 1: User expressed indifference (any, whatever, don't care, etc.)
     */

    private tryIndifferenceMatch(): ColorOption | null
    {
        if (!ColorServiceImpl.INDIFFERENCE_PATTERNS.test(this.lowerInput))
        {
            return null;
        }

        const defaultColor: ColorOption = this.colorOptions.find(c => c.name.toLowerCase() === ColorServiceImpl.DEFAULT_COLOR_NAME) || this.colorOptions[0];

        logger.info(`[ColorMatcher] Indifference detected, selecting: "${defaultColor.name}"`);
        return defaultColor;
    }

    /**
     * Strategy 2: User entered a number (1, 2, 3, etc.)
     */

    private tryNumberMatch(): ColorOption | null
    {
        const numberMatch: RegExpMatchArray = this.lowerInput.match(/^(\d+)$/);
        if (!numberMatch)
        {
            return null;
        }

        const index: number = parseInt(numberMatch[1]) - 1;

        if (index < 0 || index >= this.colorOptions.length)
        {
            logger.warn(`[ColorMatcher] Number ${numberMatch[1]} out of range (max: ${this.colorOptions.length})`);
            return null;
        }

        const selected: ColorOption = this.colorOptions[index];
        logger.info(`[ColorMatcher] Number match: #${numberMatch[1]} = "${selected.name}" ($${selected.cost})`);
        return selected;
    }

    /**
     * Strategy 3: Exact case-insensitive color name match
     */

    private tryExactMatch(): ColorOption | null
    {
        const exactMatch: ColorOption = this.colorOptions.find(c => c.name.toLowerCase() === this.lowerInput);

        if (exactMatch)
        {
            logger.info(`[ColorMatcher] Exact match: "${exactMatch.name}"`);
            return exactMatch;
        }

        return null;
    }

    /**
     * Strategy 4: User input is a substring of color name
     */

    private tryKeywordMatch(): ColorOption | null
    {
        const keywordMatch: ColorOption = this.colorOptions.find(c => c.name.toLowerCase().includes(this.lowerInput));

        if (keywordMatch)
        {
            logger.info(`[ColorMatcher] Keyword match: "${keywordMatch.name}" contains "${this.lowerInput}"`);
            return keywordMatch;
        }

        return null;
    }

    /**
     * Strategy 5: User input matches individual word in color name
     */

    private tryWordMatch(): ColorOption | null
    {
        const wordMatch: ColorOption = this.colorOptions.find(c =>
        {
            const colorWords: string[] = c.name.toLowerCase().split(/[\s.-]+/);
            return colorWords.some(word => word === this.lowerInput);
        });

        if (wordMatch)
        {
            logger.info(`[ColorMatcher] Word match: "${wordMatch.name}"`);
            return wordMatch;
        }

        return null;
    }

    /**
     * No match found - return null and log
     */

    private logNoMatch(): null
    {
        logger.warn(`[ColorMatcher] No match found for: "${this.lowerInput}"`);
        return null;
    }

    /**
     * Attempts to fetch from single data source
     */
    private  async tryDataSource(source: DataSource): Promise<ColorOption[] | null>
    {
        try
        {
            logger.info(`[ColorFetcher] Attempting: ${source.name}`);

            const result = await ProcedureExecutor.getProcedureData<any>(
                [],
                source.query,
                source.context
            );

            if (!result?.length)
            {
                logger.warn(`[ColorFetcher] ${source.name} returned empty`);
                return null;
            }

            const colors: ColorOption[] = this.transformRows(result);
            logger.info(`[ColorFetcher] ✅ SUCCESS: ${source.name} returned ${colors.length} colors`);
            this.logSamples(colors);

            return colors;
        }
        catch (error)
        {
            logger.error(`[ColorFetcher] ❌ ${source.name} failed:`, error);
            return null;
        }
    }

    private buildCategoryKeywordMap(): Map<string, string> {
        if (this.categoryKeywordMap)
        {
            return this.categoryKeywordMap;
        }

        const map = new Map<string, string>();
        Object.entries(Constants.COLOR_CATEGORIES).forEach(([category, keywords]) => {
            keywords.forEach(kw => map.set(kw.toLowerCase(), category));
        });
        return (this.categoryKeywordMap = map);
    }

    /**
     * Logs sample colors for debugging
     */
    private logSamples(colors: ColorOption[]): void
    {
        const samples: ColorOption[] = colors.slice(0, ColorServiceImpl.MAX_SAMPLES);
        logger.info("[ColorFetcher] Sample colors:");
        samples.forEach((color, idx) =>
        {
            logger.info(`  ${idx + 1}. ${color.name} ${color.hex_value} (cost: $${color.cost})`);
        });
    }

    /**
     * Loads and validates colors from a cache
     */
    private async loadColors(): Promise<ColorOption[] | null>
    {
        try
        {
            const colors: ColorOption[] = await this.get();

            if (colors.length === 0)
            {
                logger.warn("[ColorNodeManager] No colors in database");
                return null;
            }

            logger.info(`[ColorNodeManager] Loaded ${colors.length} colors from cache`);
            return colors;
        }
        catch (error)
        {
            logger.error("[ColorNodeManager] Error loading colors:", error);
            return null;
        }
    }

    /**
     * Prepares display colors with grouping and formatting
     */
    private prepareDisplayColors(allColors: ColorOption[]): Map<string, ColorOption[]>
    {
        return this.group(allColors, ColorServiceImpl.COLORS_PER_CATEGORY);
    }

    /**
     * Extracts a flat array of display colors from a grouped map
     */
    private flattenDisplayColors(groupedColors: Map<string, ColorOption[]>): ColorOption[]
    {
        const displayColors: ColorOption[] = [];
        for (const colors of groupedColors.values())
        {
            displayColors.push(...colors);
        }
        return displayColors;
    }

    /**
     * Attempts to find a matching category for color
     */
    private findMatchingCategory(color: ColorOption, grouped: Map<string, ColorOption[]>, limitPerCategory: number): string | null
    {
        const keywordMap = this.buildCategoryKeywordMap();
        const colorNameLower = color.name.toLowerCase();

        for (const [keyword, category] of keywordMap)
        {
            if (colorNameLower.includes(keyword))
            {
                const list = grouped.get(category)!;
                if (list.length < limitPerCategory)
                {
                    return category;
                }
            }
        }
        return null;
    }

    /**
     * Logs grouping results for debugging
     */
    private  logGroupResults(grouped: Map<string, ColorOption[]>): void
    {
        logger.info("[ColorGrouper] Final grouping:");

        let totalCount: number = 0;
        grouped.forEach((colorList: ColorOption[], category: string) =>
        {
            if (colorList.length === 0)
            {
                return;
            }

            logger.info(`  ${category}: ${colorList.length} colors`);
            logger.debug(`    Range: ${colorList[0].name} → ${colorList[colorList.length - 1].name}`);

            totalCount += colorList.length;
        });

        logger.info(`[ColorGrouper] Total grouped: ${totalCount} colors`);

        if (totalCount === 0)
        {
            logger.error("[ColorGrouper] ERROR: No colors were grouped!");
        }
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void
{
}

const colorNodeManager = ColorServiceImpl.getInstance();

/**
 * NODE: Prompts user for color preference after building specs
 * Called after user has provided building dimensions but before price calculation
 */
export const askForColorNode = async (state: LeadAgentStateType): Promise<ColorNodeResponse> =>
{
    try
    {
        return await colorNodeManager.execute(state);
    }
    catch (error)
    {
        logger.error("[askForColorNode] Unhandled error:", error);
        return colorNodeManager.createErrorResponse(state.userFriendlyParams);
    }
};
