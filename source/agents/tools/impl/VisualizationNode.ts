import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import {GarageImageGenerator} from "@agents/tools/impl/GarageImageGeneratorNode";
import {QuoteResponseFormatter} from "@agents/tools/impl/QuoteResponseFormatterNode";
import {PriceCalculatorService} from "@agents/tools/impl/PriceCalculationNode";
import {GenerationResult, HealthCheckResult, QuoteBreakdown, VisualizationResponse } from "../io/IVisualization";
import {IGarageImageGenerator} from "@agents/tools/impl/io/IVisualizationNode";
import {IPriceCalculatorService} from "@agents/tools/impl/io/PriceCalculatorService";
import process from "node:process";
const logger: pino.Logger = createLogger(module);

/**
 * Orchestrates garage visualization workflow
 */
class VisualizationOrchestrator
{
    private readonly generator: IGarageImageGenerator;
    private readonly calculator: IPriceCalculatorService;

    constructor(comfyuiUrl: string = process.env.COMFYUI_URL || "http://localhost:8188")
    {
        this.generator = GarageImageGenerator.getInstance(comfyuiUrl);
        this.calculator = PriceCalculatorService.getInstance();
    }

    async generateVisualization(state): Promise<VisualizationResponse>
    {
        logger.info(`[VisualizationOrchestrator] Session ${state.sessionId} - Starting visualization`);

        try
        {
            const params = state.userFriendlyParams as UserFriendlyParams;
            const selectedAddons = state.selectedAddons || [];
            const basePrice = state.basePrice || 0;

            logger.info(`[VisualizationOrchestrator] Received params:`, {
                width: params?.width,
                length: params?.length,
                height: params?.height,
                roof_type: params?.roof_type,
                color: params?.color || state.color,
                gauge: params?.gauge,
                building_type: params?.building_type,
                state_name: params?.state_name,
                basePrice,
                addonsCount: selectedAddons.length,
                addons: selectedAddons.map(a => a.label)
            });

            const finalColor = params?.color || state.color || "White";
            const mergedParams: UserFriendlyParams = {
                ...params,
                color: finalColor,
            };

            if (!mergedParams.width || !mergedParams.length || !mergedParams.height) {
                logger.error("[VisualizationOrchestrator] Missing required dimensions:", {
                    width: mergedParams.width,
                    length: mergedParams.length,
                    height: mergedParams.height,
                });
                throw new Error(
                    `Missing dimensions - W: ${mergedParams.width}, L: ${mergedParams.length}, H: ${mergedParams.height}`
                );
            }

            const health: HealthCheckResult = await this.generator.checkHealth();
            if (!health.healthy)
            {
                logger.warn(`[VisualizationOrchestrator] ComfyUI unavailable: ${health.message}`);
            }

            let imageUrl: string | null = null;
            let base64Image: string | null = null;

            logger.info(`[VisualizationOrchestrator] Generating image with ${selectedAddons.length} addon(s)`);
            const result: GenerationResult = await this.generator.generate(
                mergedParams,
                selectedAddons,
                3
            );

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
                mergedParams.width,
                mergedParams.length,
                selectedAddons
            );

            const response: string = QuoteResponseFormatter.formatFinalQuote(
                mergedParams,
                breakdown,
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
                response: `FINAL QUOTE\n\nFinal Price: $${(state.finalPrice || state.basePrice || 0).toFixed(2)}\n\nError generating visualization: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
    const comfyuiUrl: string = process.env.COMFYUI_URL || "http://127.0.0.1:8188";
    const orchestrator = new VisualizationOrchestrator(comfyuiUrl);
    return orchestrator.generateVisualization(state);
};

/**
 * Export classes for testing and customization
 */
export {
    VisualizationOrchestrator,
};
