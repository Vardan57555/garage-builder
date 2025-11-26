import {AddonMenuItem} from "@agents/tools/impl/io/IShowAddons";
import pino from "pino";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class AddonValidator
{
    /**
     * Validate addon menu has items
     */
    static hasItems(addons: AddonMenuItem[]): boolean
    {
        return Array.isArray(addons) && addons.length > 0;
    }

    /**
     * Validate pricing data in state
     */
    static hasValidPricingData(basePrice: number | undefined): boolean
    {
        if (basePrice === undefined || basePrice === null)
        {
            logger.warn(`[AddonValidator] Invalid basePrice`);
            return false;
        }

        return true;
    }
}
