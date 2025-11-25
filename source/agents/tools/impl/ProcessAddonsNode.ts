import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import {Addon, ProcessingResult, SelectedAddon} from "@agents/tools/io/IProcessAddon";
import { IAddonSelectionParser } from "@agents/tools/impl/io/IProcessAddonNode";
import {IPriceCalculatorService} from "@agents/tools/io/PriceCalculatorService";
import {PriceCalculatorService} from "@agents/tools/impl/PriceCalculationNode";
import {AddonSelectionParser} from "@agents/tools/impl/AddonSelectionParser";
import {AddonSelectionValidator} from "@agents/tools/validators/AddonSelectionValidator";
const logger: pino.Logger = createLogger(module);

/**
 * Orchestrates addon selection processing
 */
class AddonsSelectionProcessor
{
    private readonly parser: IAddonSelectionParser;
    private readonly calculator: IPriceCalculatorService;

    constructor()
    {
        this.parser = AddonSelectionParser.getInstance();
        this.calculator = PriceCalculatorService.getInstance();
    }

    /**
     * Process user addon selection request
     */
    async process(state: LeadAgentStateType): Promise<ProcessingResult>
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

            const selectedAddons: SelectedAddon[] = this.parser.parse(userInput!, addonsMenu!);

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
}

/**
 * NODE: Process user's addon selections
 */
export const processAddonsSelectionNode = async (state: LeadAgentStateType): Promise<ProcessingResult> =>
{
    const processor = new AddonsSelectionProcessor();
    return processor.process(state);
};
