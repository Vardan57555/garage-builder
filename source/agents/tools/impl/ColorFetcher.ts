import pino from "pino";
import {createLogger} from "@utils/logger/Log";
import {ColorOption, DataSource} from "@agents/tools/io/IColorChoice";
import {ProcedureExecutor} from "@utils/procedure/ProcedureExecutor";
import {ColorTransformer} from "@agents/tools/impl/ColorTransformer";
import {Constants} from "@common/io/Constants";

const logger: pino.Logger = createLogger(module);

/**
 * ColorFetcher: Attempts to load colors from database with fallback strategy
 */
export class ColorFetcher
{
    private static readonly MAX_SAMPLES: number = 5;

    /**
     * Attempts to fetch from single data source
     */
    private static async tryDataSource(source: DataSource): Promise<ColorOption[] | null>
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

            const colors: ColorOption[] = ColorTransformer.transformRows(result);
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

    /**
     * Logs sample colors for debugging
     */
    private static logSamples(colors: ColorOption[]): void
    {
        const samples: ColorOption[] = colors.slice(0, this.MAX_SAMPLES);
        logger.info("[ColorFetcher] Sample colors:");
        samples.forEach((color, idx) =>
        {
            logger.info(`  ${idx + 1}. ${color.name} ${color.hex_value} (cost: $${color.cost})`);
        });
    }

    /**
     * Fetches from database with fallback strategy
     */
    static async fetch(): Promise<ColorOption[]>
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
}
