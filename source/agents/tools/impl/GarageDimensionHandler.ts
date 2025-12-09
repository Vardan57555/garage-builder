import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { UserFriendlyParams } from "@agents/tools/io/IChat";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import { DimensionManager } from "@agents/tools/impl/DimensionManager";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ FIXED: Smart garage vs dimension detection
 * Prevents "garage for two cars" from being treated as dimension extraction
 */
export class GarageDimensionHandler {
    private static instance: GarageDimensionHandler;

    private constructor() {}

    public static getInstance(): GarageDimensionHandler {
        if (!GarageDimensionHandler.instance) {
            GarageDimensionHandler.instance = new GarageDimensionHandler();
        }
        return GarageDimensionHandler.instance;
    }

    /**
     * ✅ CRITICAL: Detect GARAGE intent (NOT dimension)
     * "i want garage for two cars" → garage_type: "2-car"
     * Should NOT extract dimensions from this
     */
    public async detectGarageIntent(userInput: string): Promise<{
        isGarageIntent: boolean;
        garageType?: string;
        carCount?: number;
        confidence: 'high' | 'medium' | 'low';
        reasoning: string;
    }> {
        if (!userInput?.trim()) {
            return {
                isGarageIntent: false,
                confidence: 'low',
                reasoning: 'Empty input'
            };
        }

        logger.info(`[GarageDimensionHandler] Detecting garage intent from: "${userInput}"`);

        try {
            const prompt = `Detect if user is specifying a GARAGE TYPE (car count), NOT dimensions.

CRITICAL DISTINCTION:
- "garage for 2 cars" → GARAGE TYPE (garageType = "2-car")
- "width 20" → DIMENSION (width = 20)
- "2 car garage" → GARAGE TYPE (garageType = "2-car")
- "20" alone → DIMENSION (width = 20) OR ambiguous
- "i want a 3 car garage" → GARAGE TYPE (garageType = "3-car")
- "garage for three cars" → GARAGE TYPE (carCount = 3, garageType = "3-car")

RULES:
1. Garage intent REQUIRES the words "garage", "car", or "cars"
2. Extract CAR COUNT if present
3. Do NOT extract dimensions
4. Return garage_type as "X-car" format

Return ONLY JSON:
{
  "isGarageIntent": <true if garage type, false otherwise>,
  "garageType": "X-car" | null,
  "carCount": <number or null>,
  "confidence": "high" | "medium" | "low",
  "reasoning": "brief explanation"
}

Examples:
- "i want garage for two cars" → {"isGarageIntent": true, "garageType": "2-car", "carCount": 2, "confidence": "high"}
- "3 car garage" → {"isGarageIntent": true, "garageType": "3-car", "carCount": 3, "confidence": "high"}
- "garage for a couple cars" → {"isGarageIntent": true, "garageType": "2-car", "carCount": 2, "confidence": "medium"}
- "width 20" → {"isGarageIntent": false, "confidence": "high", "reasoning": "Dimension, not garage"}
- "20" → {"isGarageIntent": false, "confidence": "low", "reasoning": "Ambiguous number"}

User input: "${userInput}"

ONLY JSON:`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const result = this.parseResponse(response);

            if (result) {
                logger.info(
                    `[GarageDimensionHandler] ${result.isGarageIntent ? '✅' : '❌'} Garage intent: ${result.garageType || 'none'} (${result.reasoning})`
                );
                return result;
            }

            return {
                isGarageIntent: false,
                confidence: 'low',
                reasoning: 'Failed to parse'
            };
        } catch (error) {
            logger.error(`[GarageDimensionHandler] Error:`, error);
            return {
                isGarageIntent: false,
                confidence: 'low',
                reasoning: 'Error during detection'
            };
        }
    }

    /**
     * ✅ Calculate dimensions from garage car count
     * "2-car" → width, length, height
     * Uses DimensionManager for smart calculation
     */
    public async calculateDimensionsFromGarageType(
        garageType: string,
        userInput: string
    ): Promise<{
        width: number;
        length: number;
        height: number;
        reasoning: string;
    } | null> {
        try {
            logger.info(`[GarageDimensionHandler] Calculating dimensions for garage_type: ${garageType}`);

            const carMatch = String(garageType).match(/(\d+)/);
            const numCars = carMatch ? parseInt(carMatch[1], 10) : null;

            if (!numCars || numCars <= 0 || numCars > 20) {
                logger.warn(`[GarageDimensionHandler] Invalid car count from: ${garageType}`);
                return null;
            }

            logger.info(`[GarageDimensionHandler] Extracted car count: ${numCars}`);

            const dimensionManager = DimensionManager.getInstance();
            const calculation = dimensionManager.calculateDimensions(userInput);

            if (calculation && calculation.width && calculation.length && calculation.height) {
                logger.info(
                    `[GarageDimensionHandler] ✅ Calculated: ${calculation.width}×${calculation.length}×${calculation.height}`
                );
                return {
                    width: calculation.width,
                    length: calculation.length,
                    height: calculation.height,
                    reasoning: `Calculated from ${numCars}-car garage`
                };
            }

            const width = (numCars * 6) + 8;
            const length = 20;
            const height = 10;

            logger.info(`[GarageDimensionHandler] ✅ Using formula: ${width}×${length}×${height} for ${numCars}-car`);

            return {
                width,
                length,
                height,
                reasoning: `Standard ${numCars}-car garage dimensions`
            };

        } catch (error) {
            logger.error(`[GarageDimensionHandler] Calculation error:`, error);
            return null;
        }
    }

    /**
     * ✅ NEW: Safe integration point for LeadAgent
     * Handles garage intent WITHOUT corrupting dimensions
     */
    public async processGarageIntentSafely(
        userInput: string,
        currentParams: Partial<UserFriendlyParams>
    ): Promise<{
        handled: boolean;
        garageType?: string;
        calculatedDimensions?: { width: number; length: number; height: number };
        response: string;
        updatedParams: Partial<UserFriendlyParams>;
    }> {
        logger.info(`[GarageDimensionHandler] Safe processing: "${userInput}"`);

        try {
            const garageDetection = await this.detectGarageIntent(userInput);

            if (!garageDetection.isGarageIntent || garageDetection.confidence === 'low') {
                logger.info(`[GarageDimensionHandler] Not a garage intent`);
                return {
                    handled: false,
                    response: '',
                    updatedParams: {}
                };
            }

            logger.info(`[GarageDimensionHandler] ✅ Garage intent detected: ${garageDetection.garageType}`);

            const dimensions = await this.calculateDimensionsFromGarageType(
                garageDetection.garageType!,
                userInput
            );

            if (!dimensions) {
                logger.error(`[GarageDimensionHandler] Failed to calculate dimensions`);
                return {
                    handled: false,
                    response: '',
                    updatedParams: {}
                };
            }

            logger.info(`[GarageDimensionHandler] ✅ Calculated dimensions: ${dimensions.width}×${dimensions.length}×${dimensions.height}`);

            const response = `✓ Got it! ${garageDetection.carCount}-car garage\n\nBuilding dimensions: ${dimensions.width}ft wide × ${dimensions.length}ft long × ${dimensions.height}ft tall`;

            const updatedParams: Partial<UserFriendlyParams> = {
                width: dimensions.width,
                length: dimensions.length,
                height: dimensions.height,
                building_type: "Garage"
            };

            logger.info(`[GarageDimensionHandler] ✅ Safe params update:`, updatedParams);

            logger.info(`[GarageDimensionHandler] ✅ Auto-detected building_type: Garage`);

            return {
                handled: true,
                garageType: garageDetection.garageType,
                calculatedDimensions: dimensions,
                response,
                updatedParams
            };

        } catch (error) {
            logger.error(`[GarageDimensionHandler] Exception:`, error);
            return {
                handled: false,
                response: '',
                updatedParams: {}
            };
        }
    }

    private parseResponse(response: string): any {
        try {
            let cleaned = response
                .replace(/```json\s*/g, '')
                .replace(/```\s*/g, '')
                .trim();

            const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                logger.warn(`[GarageDimensionHandler] No JSON found`);
                return null;
            }

            const parsed = JSON.parse(jsonMatch[0]);

            if (typeof parsed.isGarageIntent !== 'boolean') {
                logger.warn(`[GarageDimensionHandler] Invalid structure:`, parsed);
                return null;
            }

            const validConfidences = ['high', 'medium', 'low'];
            if (!validConfidences.includes(parsed.confidence)) {
                parsed.confidence = 'low';
            }

            return {
                isGarageIntent: parsed.isGarageIntent,
                garageType: parsed.garageType || null,
                carCount: parsed.carCount || null,
                confidence: parsed.confidence,
                reasoning: parsed.reasoning || 'No explanation'
            };
        } catch (error) {
            logger.error(`[GarageDimensionHandler] Parse error:`, error);
            return null;
        }
    }
}

export const garageDimensionHandler = GarageDimensionHandler.getInstance();
