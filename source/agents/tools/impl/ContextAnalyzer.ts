/**
 * ✅ NEW: AI-Driven Context Analyzer
 * Determines if a numeric input is a state answer or dimension-related
 */
import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { ExtractionResult } from "@agents/tools/io/IParameterExtraction";
import { UserFriendlyParams } from "@agents/tools/io/IChat";

const logger: pino.Logger = createLogger(module);

export class ContextAnalyzer {
    private static instance: ContextAnalyzer;

    public static getInstance(): ContextAnalyzer {
        if (!ContextAnalyzer.instance) {
            ContextAnalyzer.instance = new ContextAnalyzer();
        }
        return ContextAnalyzer.instance;
    }

    /**
     * Determines the intent of a numeric input given the current context
     * @param userInput The user's input
     * @param currentField The field being asked for (e.g., "state_name")
     * @param conversationHistory Recent chat messages for context
     * @returns "state" | "dimension" | "unclear"
     */
    public async analyzeNumericInput(
        userInput: string,
        currentField: string | null,
        conversationHistory: string
    ): Promise<"state" | "dimension" | "unclear"> {
        try {
            if (currentField === "state_name") {
                logger.info(`[ContextAnalyzer] Currently asking for state_name`);

                if (/^\d+$/.test(userInput.trim()) && userInput.length <= 3) {
                    logger.info(`[ContextAnalyzer] Numeric input "${userInput}" in state context - likely STATE`);
                    return "state";
                }
            }

            if (currentField && !["width", "length", "height", "utility_length"].includes(currentField)) {
                if (/^\d+$/.test(userInput.trim())) {
                    logger.info(`[ContextAnalyzer] In non-dimension field (${currentField}) with numeric input - likely related to current FIELD`);
                    return "state"; // Not dimension
                }
            }

            logger.info(`[ContextAnalyzer] Using AI to analyze context...`);
            return await this.analyzeWithAI(userInput, currentField, conversationHistory);

        } catch (error) {
            logger.error(`[ContextAnalyzer] Error analyzing input:`, error);
            return "unclear";
        }
    }

    /**
     * Uses LLM to understand context
     */
    private async analyzeWithAI(
        userInput: string,
        currentField: string | null,
        conversationHistory: string
    ): Promise<"state" | "dimension" | "unclear"> {
        try {
            const prompt = `You are analyzing user intent based on conversation context.

CURRENT FIELD BEING ASKED: ${currentField || "none"}
RECENT CONVERSATION:
${conversationHistory}

USER'S NEW INPUT: "${userInput}"

TASK: Determine if the user is:
1. Answering the current question (respond with "current_field")
2. Providing dimensions (width, length, height) (respond with "dimension")
3. Unclear what they mean (respond with "unclear")

RULES:
- If currently asking for state → "${userInput}" is answering STATE question
- If currently asking for roof_type/building_type/gauge → "${userInput}" is answering THAT question
- If input is just a number like "10" or "20" while asking for non-dimension field → it's answering CURRENT FIELD
- Only mark as "dimension" if explicitly mentioning: width, length, height, "x", or multiple numbers in sequence
- If current field is null/unspecified AND input is just a number → could be dimension

RESPOND WITH ONLY ONE WORD: current_field | dimension | unclear`;

            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);

            const result = response.toLowerCase().trim();
            logger.info(`[ContextAnalyzer] AI analysis result: "${result}"`);

            if (result.includes("dimension")) return "dimension";
            if (result.includes("current")) return "state";
            return "unclear";

        } catch (error) {
            logger.error(`[ContextAnalyzer] AI analysis failed:`, error);
            return "unclear";
        }
    }
}

export class ExtractionResultBuilder {
    /**
     * ✅ Creates a complete ExtractionResult with all required fields
     */
    static error(
        userFriendlyParams: Partial<UserFriendlyParams>,
        currentField: string | null,
        errorMessage: string,
        responseMessage: string
    ): ExtractionResult {
        return {
            userFriendlyParams,
            currentField,
            validationError: errorMessage,
            response: responseMessage,
            nextStep: "ask_for_field",
            _pendingConfirmation: null,
        };
    }

    /**
     * ✅ Creates a successful ExtractionResult
     */
    static success(
        userFriendlyParams: Partial<UserFriendlyParams>,
        currentField: string | null,
        responseMessage: string,
        nextStep: string = "check_missing_fields"
    ): ExtractionResult {
        return {
            userFriendlyParams,
            currentField,
            nextStep,
            response: responseMessage,
            _pendingConfirmation: null,
        };
    }
}
