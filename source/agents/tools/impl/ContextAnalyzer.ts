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
            // ✅ QUICK CHECK: If asking for state, almost always it's a state answer
            if (currentField === "state_name") {
                logger.info(`[ContextAnalyzer] Currently asking for state_name`);

                // Check if it looks like a state code
                if (/^\d+$/.test(userInput.trim()) && userInput.length <= 3) {
                    // Could be FIPS code (01-56) or numeric state identifier
                    logger.info(`[ContextAnalyzer] Numeric input "${userInput}" in state context - likely STATE`);
                    return "state";
                }
            }

            // ✅ QUICK CHECK: If dimensions are already complete and asking for non-dimension field
            if (currentField && !["width", "length", "height", "utility_length"].includes(currentField)) {
                if (/^\d+$/.test(userInput.trim())) {
                    logger.info(`[ContextAnalyzer] In non-dimension field (${currentField}) with numeric input - likely related to current FIELD`);
                    return "state"; // Not dimension
                }
            }

            // ✅ Use AI for ambiguous cases
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

// ============================================================================
// FIXED: Helper to create proper ExtractionResult objects
// ============================================================================

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

// ============================================================================
// UPDATED: State Field Handler with Context Awareness
// ============================================================================

export class StateFieldHandler {
    private contextAnalyzer: ContextAnalyzer;

    constructor() {
        this.contextAnalyzer = ContextAnalyzer.getInstance();
    }

    /**
     * ✅ FIXED: Smarter state field handling with proper typing
     */
    public async handleStateField(
        state: any, // LeadAgentStateType
        userInput: string,
        currentParams: Partial<UserFriendlyParams>,
        parameterValidator: any // ParameterValidator import
    ): Promise<ExtractionResult> {

        logger.info(`[StateFieldHandler] Processing state field: input="${userInput}"`);

        // ✅ STEP 1: Get recent conversation context
        let recentMessages = "";
        try {
            recentMessages = state.messages
                .slice(-3)
                .map((msg: any) => {
                    const content = typeof msg.content === "string"
                        ? msg.content
                        : Array.isArray(msg.content)
                            ? msg.content
                                .map((c: any) => typeof c === "string" ? c : "text" in c ? c.text : "")
                                .join(" ")
                            : "";
                    return `${msg._getType?.() || "message"}: ${content}`;
                })
                .join("\n");
        } catch (e) {
            logger.warn(`[StateFieldHandler] Could not extract conversation history`);
        }

        // ✅ STEP 2: Analyze if numeric input is really about state or dimensions
        if (/^\d+$/.test(userInput.trim())) {
            logger.info(`[StateFieldHandler] Numeric input detected, analyzing context...`);

            const intent = await this.contextAnalyzer.analyzeNumericInput(
                userInput,
                state.currentField,
                recentMessages
            );

            logger.info(`[StateFieldHandler] Context analysis result: ${intent}`);

            if (intent === "dimension") {
                logger.warn(`[StateFieldHandler] ⚠️ User provided "${userInput}" but we're asking for STATE - treating as dimension attempt`);

                return ExtractionResultBuilder.error(
                    currentParams,
                    state.currentField,
                    `Looks like a dimension number, but I need your state`,
                    `❌ I need your state name to proceed (e.g., Texas, California, Florida).\n\nPlease enter your state name - NOT a number.`
                );
            }
        }

        // ✅ STEP 3: Format validation
        const formatValidation = this.validateStateFormat(userInput);
        if (!formatValidation.isValid) {
            return ExtractionResultBuilder.error(
                currentParams,
                state.currentField,
                formatValidation.error!,
                `❌ ${formatValidation.error}\n\nPlease provide a valid US state name (e.g., Texas, California, Florida).`
            );
        }

        // ✅ STEP 4: Database validation
        try {
            const dbValidation = await parameterValidator.validateState(
                userInput,
                state.stateMapCache
            );

            if (!dbValidation.isValid) {
                return ExtractionResultBuilder.error(
                    currentParams,
                    state.currentField,
                    dbValidation.error,
                    `❌ ${dbValidation.error}\n\nPlease provide a valid US state name.`
                );
            }

            // ✅ SUCCESS: Update params safely with proper typing
            const updatedParams: Partial<UserFriendlyParams> = {
                ...currentParams,
                state_name: dbValidation.normalizedValue,
            };

            return ExtractionResultBuilder.success(
                updatedParams,
                null, // Clear current field
                `✅ State confirmed: ${dbValidation.normalizedValue}`,
                "check_missing_fields"
            );

        } catch (error) {
            logger.error(`[StateFieldHandler] Database validation error:`, error);

            return ExtractionResultBuilder.error(
                currentParams,
                state.currentField,
                "Database validation error",
                `❌ Error validating state. Please try again.`
            );
        }
    }

    /**
     * ✅ Simple format validation for state names
     */
    private validateStateFormat(input: string): { isValid: boolean; error?: string } {
        const trimmed = input.trim();

        if (!trimmed || trimmed.length === 0) {
            return { isValid: false, error: "State name cannot be empty" };
        }

        // Allow letters, spaces, hyphens, apostrophes (for names like "New York", "New-Hampshire")
        if (!/^[a-zA-Z\s\-']{2,50}$/.test(trimmed)) {
            return {
                isValid: false,
                error: "State name should only contain letters (e.g., 'Texas' or 'New York')"
            };
        }

        return { isValid: true };
    }
}

// ============================================================================
// IMPROVED: Ask For Field Messages
// ============================================================================

export class ImprovedFieldPrompts {
    /**
     * ✅ Better prompt for state field
     */
    static statePrompt(params: Partial<UserFriendlyParams>): string {
        const hasDimensions = !!(
            params.width &&
            params.length &&
            params.height
        );

        const dimensionInfo = hasDimensions
            ? `✓ Building dimensions confirmed: ${params.width}ft wide × ${params.length}ft long × ${params.height}ft tall\n\n`
            : "";

        return `${dimensionInfo}📍 Which state are you in?\n\nPlease enter your state name (e.g., Texas, California, Florida) - NOT a number or zip code.`;
    }

    /**
     * ✅ Better prompt for dimension fields
     */
    static dimensionPrompt(
        params: Partial<UserFriendlyParams>,
        field: "width" | "length" | "height"
    ): string {
        const stateInfo = params.state_name
            ? `📍 State: ${params.state_name}\n`
            : "";

        const descriptions: Record<string, { label: string; example: string }> = {
            width: { label: "Width (front to back)", example: "20" },
            length: { label: "Length (side to side)", example: "30" },
            height: { label: "Height (top to bottom)", example: "10" },
        };

        const desc = descriptions[field];

        const existing = [];
        if (params.width) existing.push(`Width: ${params.width}ft`);
        if (params.length) existing.push(`Length: ${params.length}ft`);
        if (params.height) existing.push(`Height: ${params.height}ft`);

        const existingInfo = existing.length > 0
            ? `Current: ${existing.join(" | ")}\n\n`
            : "";

        return `${stateInfo}${existingInfo}📐 What is the ${desc.label} in feet?\n\nEnter a number (e.g., ${desc.example})`;
    }
}
