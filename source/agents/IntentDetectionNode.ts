import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType} from "@agents/LeadAgentState";
import pino from "pino";

const logger: pino.Logger = createLogger(module);

async function detectGarageIntentWithLLM(userInput: string): Promise<boolean> {
    try {
        logger.info(`[detectGarageIntentWithLLM] Checking intent for: "${userInput}"`);

        const prompt = `You are a conversation classifier. Determine if the user is asking about getting a quote, pricing, or information about a garage, metal building, carport, or any type of storage/construction building.

Examples of YES answers:
- "I want a 2 car garage"
- "how much for a 20x30 building"
- "price for garage"
- "can i get a quote for metal building"
- "need storage shed"

Examples of NO answers:
- "what's the weather today"
- "how are you"
- "tell me a joke"

User message: "${userInput}"

Answer with ONLY "YES" or "NO":`;

        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
        const hasIntent = response.trim().toUpperCase().includes("YES");

        logger.info(`[detectGarageIntentWithLLM] Intent result: ${hasIntent}`);
        return hasIntent;
    } catch (error) {
        logger.error(`[detectGarageIntentWithLLM] Error:`, error);
        return false;
    }
}

export const detectGarageIntentNode = async (state: LeadAgentStateType) => {
    logger.info(`[IntentNode] Session ${state.sessionId} - Checking garage intent`);

    if (state.hasGarageIntent) {
        logger.info(`[IntentNode] Intent already confirmed, proceeding to extract_parameters`);
        return {
            hasGarageIntent: true,
            nextStep: "extract_parameters",
        };
    }

    try {
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        if (!userInput) {
            logger.warn(`[IntentNode] No user input provided`);
            return {
                hasGarageIntent: false,
                response: "Please provide some input.",
                nextStep: "__end__",
            };
        }

        logger.info(`[IntentNode] User input: "${userInput}"`);

        // ✅ IMPROVED: Better pattern matching
        const commonPatterns = [
            /\b(garage|shed|barn|carport|metal building|quote|price|cost)\b/i,
            /\b(\d+)\s*(car|cars)\b/i,                    // "2 cars", "3 car"
            /(\d+)\s*x\s*(\d+)\s*x\s*(\d+)/i,            // "20x30x10"
            /^(\d+)$/i,                                    // Just a number like "10" (assume dimension)
            /^\d+x\d+$/i,                                  // "20x30" (assume dimensions)
        ];

        const hasCommonPattern = commonPatterns.some(pattern => pattern.test(userInput));

        if (hasCommonPattern) {
            logger.info(`[IntentNode] ✅ Matched common pattern, confirming garage intent`);
            return {
                hasGarageIntent: true,
                nextStep: "extract_parameters",
            };
        }

        logger.info(`[IntentNode] No pattern match, using LLM for intent detection`);
        const hasIntent = await detectGarageIntentWithLLM(userInput);

        if (!hasIntent) {
            logger.info(`[IntentNode] ❌ No garage intent detected`);
            return {
                hasGarageIntent: false,
                response:
                    "Hello! I can help you get a price quote for a garage or metal building.\n\n" +
                    "Please tell me about your building - dimensions (width, length, height in feet) or type?",
                nextStep: "__end__",
            };
        }

        logger.info(`[IntentNode] ✅ Garage intent confirmed by LLM`);
        return {
            hasGarageIntent: true,
            nextStep: "extract_parameters",
        };
    } catch (error) {
        logger.error(`[IntentNode] Error:`, error);
        return {
            hasGarageIntent: false,
            response: "Error detecting intent. Please try again.",
            nextStep: "__end__",
        };
    }
};
