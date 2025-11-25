import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { GenerationResult, HealthCheckResult, QuoteBreakdown, VisualizationResponse } from "@agents/tools/impl/io/IVisualization";
import { IGarageImageGenerator, } from "@agents/tools/io/IVisualizationNode";
import {WorkflowBuilder} from "@agents/tools/impl/WorkflowBuilderNode";
import {ComfyUIClient} from "@agents/tools/impl/ComfyUIClientNode";
import {PromptBuilder} from "@agents/tools/impl/PromptBuilderNode";
import {GarageImageGenerator} from "@agents/tools/impl/GarageImageGeneratorNode";
import {QuoteResponseFormatter} from "@agents/tools/impl/QuoteResponseFormatterNode";
import {PriceCalculatorService} from "@agents/tools/impl/PriceCalculationNode";
import {IPriceCalculatorService} from "@agents/tools/io/PriceCalculatorService";
const logger: pino.Logger = createLogger(module);

/**
 * Orchestrates garage visualization workflow
 */
class VisualizationOrchestrator
{
    private readonly generator: IGarageImageGenerator;
    private readonly calculator: IPriceCalculatorService;

    constructor(comfyuiUrl: string = "http://localhost:8188")
    {
        this.generator = GarageImageGenerator.getInstance(comfyuiUrl);
        this.calculator = PriceCalculatorService.getInstance();
    }

    /**
     * Orchestrate visualization and quote generation
     */
    async generateVisualization(state): Promise<VisualizationResponse>
    {
        logger.info(`[VisualizationOrchestrator] Session ${state.sessionId} - Starting visualization`);

        try
        {
            const params = state.userFriendlyParams as UserFriendlyParams;
            const selectedAddons = state.selectedAddons || [];
            const basePrice = state.basePrice || 0;

            if (!params.width || !params.length || !params.height) {
                logger.error("[VisualizationOrchestrator] Missing required dimensions");
                throw new Error("Missing required dimensions");
            }

            const health: HealthCheckResult = await this.generator.checkHealth();
            if (!health.healthy)
            {
                logger.warn(`[VisualizationOrchestrator] ComfyUI unavailable: ${health.message}`);
            }

            let imageUrl: string | null = null;
            let base64Image: string | null = null;

            const result: GenerationResult = await this.generator.generate(params, 3);
            if (result.success && result.base64)
            {
                logger.info("[VisualizationOrchestrator] ✅ Image generated successfully");
                base64Image = result.base64;
                imageUrl = result.imageUrl || null;
            }
            else
            {
                logger.warn(`[VisualizationOrchestrator] Generation failed: ${result.error}`);
            }

            const breakdown: QuoteBreakdown = this.calculator.calculateBreakdown(
                basePrice,
                params.width,
                params.length,
                selectedAddons
            );

            const response: string = QuoteResponseFormatter.formatFinalQuote(
                params,
                breakdown,
                selectedAddons,
                base64Image
            );

            return {
                response,
                finalPrice: breakdown.finalTotal,
                generatedImageUrl: imageUrl,
                generatedImageBase64: base64Image,
                nextStep: "__end__",
            };
        }
        catch (error)
        {
            logger.error("[VisualizationOrchestrator] Error:", error);
            return {
                response: `FINAL QUOTE\n\nFinal Price: $${(state.finalPrice || state.basePrice || 0).toFixed(2)}`,
                finalPrice: state.finalPrice || state.basePrice || 0,
                nextStep: "__end__",
            };
        }
    }
}

/**
 * NODE: Generate garage visualization and final quote
 */
export const generateGarageVisualizationNode = async (state: any): Promise<VisualizationResponse> => {
    const comfyuiUrl = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
    const orchestrator = new VisualizationOrchestrator(comfyuiUrl);
    return orchestrator.generateVisualization(state);
};

/**
 * Export classes for testing and customization
 */
export {
    VisualizationOrchestrator,
    GarageImageGenerator,
    ComfyUIClient,
    WorkflowBuilder,
    PromptBuilder,
    QuoteResponseFormatter,
    GenerationResult,
    HealthCheckResult,
    QuoteBreakdown,
    VisualizationResponse,
};
