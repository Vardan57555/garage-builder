import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { ColorOption } from "@agents/tools/io/IColorChoice";
import {Constants} from "@common/io/Constants";
const logger: pino.Logger = createLogger(module);

/**
 * ColorGrouper: Groups colors by category with keyword matching
 */
export class ColorGrouper
{
    /**
     * Attempts to find a matching category for color
     */
    private static findMatchingCategory(color: ColorOption, grouped: Map<string, ColorOption[]>, limitPerCategory: number): string | null
    {
        for (const [category, keywords] of Object.entries(Constants.COLOR_CATEGORIES))
        {
            const categoryList: ColorOption[] = grouped.get(category)!;

            if (categoryList.length >= limitPerCategory) {
                continue;
            }

            const matches: boolean = keywords.some(kw => color.name.toLowerCase().includes(kw.toLowerCase()));

            if (matches)
            {
                return category;
            }
        }

        return null;
    }

    /**
     * Groups colors by category with keyword-based matching
     */
    static group(colors: ColorOption[], limitPerCategory: number = 8): Map<string, ColorOption[]>
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
                logger.debug(`[ColorGrouper] Added "${color.name}" to ${category}`);
            }
        });

        this.logGroupResults(grouped);
        return grouped;
    }

    /**
     * Logs grouping results for debugging
     */
    private static logGroupResults(grouped: Map<string, ColorOption[]>): void
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

