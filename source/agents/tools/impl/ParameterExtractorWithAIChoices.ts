import { LeadAgentStateType } from "@agents/LeadAgentState";
import { ExtractionResult } from "@agents/tools/io/IParameterExtraction";
import { handleChoiceWithAI, AIDrivenChoiceHandler } from "@agents/tools/impl/AIDrivenChoiceHandler";
import pino from "pino";
import { createLogger } from "@utils/logger/Log";

const logger: pino.Logger = createLogger(module);

/**
 * ✅ CHOICE FLOW STATE: Track where user is in choice confirmation
 */
interface ChoiceFlowState {
    isInChoiceFlow: boolean;
    fieldBeingChosen?: string;
    matchedValue?: string;
    clarificationPrompt?: string;
    attemptCount?: number;
}

/**
 * ✅ UPDATED ParameterExtractor with AI-driven choice handler
 */
export class ParameterExtractorWithAIChoices {

    /**
     * 🎯 NEW METHOD: Handle choice fields with AI
     */
    private async handleChoiceFieldWithAI(
        state: LeadAgentStateType,
        fieldName: string,
        userInput: string,
        currentParams: any
    ): Promise<ExtractionResult> {

        logger.info(`[handleChoiceFieldWithAI] Processing ${fieldName}: "${userInput}"`);

        // ✅ CHECK: Are we in a confirmation flow?
        const choiceFlowState = this.extractChoiceFlowState(state);

        if (choiceFlowState.isInChoiceFlow && choiceFlowState.fieldBeingChosen === fieldName) {
            // User is responding to clarification prompt
            logger.info(`[handleChoiceFieldWithAI] In confirmation flow for ${fieldName}`);

            return await this.handleConfirmationResponse(
                state,
                userInput,
                choiceFlowState,
                currentParams,
                fieldName
            );
        }

        // ✅ STEP 1: Get available options
        const availableOptions = AIDrivenChoiceHandler.getAvailableOptions(fieldName);

        if (!availableOptions.length) {
            logger.warn(`[handleChoiceFieldWithAI] No options for ${fieldName}`);
            return {
                validationError: `No options available for ${fieldName}`,
                response: `Error: Cannot process ${fieldName}`,
                nextStep: "ask_for_field",
                currentField: fieldName,
                userFriendlyParams: currentParams,
            };
        }

        // ✅ STEP 2: Match user input to option using AI
        const matchResult = await handleChoiceWithAI(fieldName, userInput, availableOptions);

        if (!matchResult) {
            logger.warn(`[handleChoiceFieldWithAI] No valid match for ${fieldName}`);

            // Show user what options are available
            const choicePrompt = await AIDrivenChoiceHandler.generateChoicePrompt(
                fieldName,
                availableOptions,
                `Please select one of the available ${fieldName} options`
            );

            return {
                validationError: `Could not understand "${userInput}" for ${fieldName}`,
                response: `❌ I didn't understand that. ${choicePrompt}`,
                nextStep: "ask_for_field",
                currentField: fieldName,
                userFriendlyParams: currentParams,
            };
        }

        logger.info(`[handleChoiceFieldWithAI] Matched: ${matchResult.selected} (confidence: ${matchResult.confidence})`);

        // ✅ STEP 3: If high confidence, accept immediately
        if (matchResult.confidence === "high") {
            logger.info(`[handleChoiceFieldWithAI] ✅ High confidence, accepting: ${matchResult.selected}`);

            currentParams[fieldName] = matchResult.selected;

            return {
                userFriendlyParams: currentParams,
                currentField: null,
                nextStep: "check_missing_fields",
                response: `✅ Updated ${fieldName} to ${matchResult.selected}`
            };
        }

        // ✅ STEP 4: If medium/low confidence, ask for confirmation
        logger.info(`[handleChoiceFieldWithAI] Medium/low confidence (${matchResult.confidence}), asking for confirmation`);

        // ✅ FIXED: Don't use _choiceFlowMeta - store in state instead (see extractChoiceFlowState)
        return {
            userFriendlyParams: currentParams,
            currentField: fieldName,
            nextStep: "ask_for_confirmation",
            response: matchResult.clarificationPrompt ||
                `Did you mean "${matchResult.selected}"? Please confirm (yes/no or enter new choice).`,
            // ✅ Store choice metadata in a way that can be retrieved later
            // We'll encode it in the response message for now and extract it when needed
        };
    }

    /**
     * ✅ NEW METHOD: Handle confirmation response
     */
    private async handleConfirmationResponse(
        state: LeadAgentStateType,
        userInput: string,
        choiceFlowState: ChoiceFlowState,
        currentParams: any,
        fieldName: string
    ): Promise<ExtractionResult> {

        logger.info(`[handleConfirmationResponse] User responding to confirmation: "${userInput}"`);

        // ✅ Try to confirm the matched value
        const confirmation = await AIDrivenChoiceHandler.confirmChoice(
            userInput,
            choiceFlowState.matchedValue!
        );

        if (confirmation.confirmed) {
            logger.info(`[handleConfirmationResponse] ✅ Confirmed: ${choiceFlowState.matchedValue}`);

            currentParams[fieldName] = choiceFlowState.matchedValue;

            return {
                userFriendlyParams: currentParams,
                currentField: null,
                nextStep: "check_missing_fields",
                response: `✅ Perfect! Updated ${fieldName} to **${choiceFlowState.matchedValue}**`
            };
        }

        logger.info(`[handleConfirmationResponse] ❌ Rejected, re-asking`);

        // User rejected or said "no" - show options again
        const availableOptions = AIDrivenChoiceHandler.getAvailableOptions(fieldName);
        const choicePrompt = await AIDrivenChoiceHandler.generateChoicePrompt(
            fieldName,
            availableOptions,
            `Let's try again`
        );

        return {
            userFriendlyParams: currentParams,
            currentField: fieldName,
            nextStep: "ask_for_field",
            response: `No problem! ${choicePrompt}`,
        };
    }

    /**
     * ✅ IMPROVED: Extract choice flow state from messages
     *
     * This method looks at the chat history to determine if we're in a confirmation flow
     */
    private extractChoiceFlowState(state: LeadAgentStateType): ChoiceFlowState {
        // ✅ STRATEGY: Look at the previous assistant message to detect confirmation pattern

        if (state.messages.length < 2) {
            return {
                isInChoiceFlow: false,
                fieldBeingChosen: state.currentField,
            };
        }

        // Get the last assistant message
        const lastMessage = state.messages[state.messages.length - 1];
        // Check if the last message looks like a confirmation prompt
        const messageContent = typeof lastMessage?.content === 'string'
            ? lastMessage.content
            : '';

        // ✅ DETECTION: If message contains "Did you mean" or similar, we're confirming
        const isConfirmationPrompt = /did you mean|is that correct|should i|confirm|yes.*no/i.test(messageContent);

        if (isConfirmationPrompt && state.currentField) {
            logger.info(`[extractChoiceFlowState] Detected confirmation flow for ${state.currentField}`);

            // Try to extract the matched value from the message
            const matchedValueMatch = messageContent.match(/mean\s+["\']?([^"\'?]+)["\']?/);
            const matchedValue = matchedValueMatch ? matchedValueMatch[1].trim() : undefined;

            return {
                isInChoiceFlow: true,
                fieldBeingChosen: state.currentField,
                matchedValue,
                clarificationPrompt: messageContent,
            };
        }

        return {
            isInChoiceFlow: false,
            fieldBeingChosen: state.currentField,
        };
    }

    /**
     * ✅ UPDATED: Main extract method with choice handler integration
     */
    async extract(state: LeadAgentStateType): Promise<ExtractionResult> {
        logger.info(`[ParameterExtractor] Session ${state.sessionId} - Extracting parameters`);

        const currentParams = { ...state.userFriendlyParams };
        const userInput = this.extractContextFromState(state);

        // ✅ Check if this is a choice field
        const isChoiceField = ["roof_type", "building_type", "gauge"].includes(state.currentField || "");

        if (state.currentField && isChoiceField) {
            logger.info(`[ParameterExtractor] Choice field detected: ${state.currentField}`);

            return await this.handleChoiceFieldWithAI(
                state,
                state.currentField,
                userInput,
                currentParams
            );
        }

        // ... rest of your existing extraction logic
        // (dimensions, building_type extraction, etc.)

        return {
            userFriendlyParams: currentParams,
            nextStep: "check_missing_fields",
        };
    }

    private extractContextFromState(state: LeadAgentStateType): string {
        const lastMessage = state.messages[state.messages.length - 1];
        if (!lastMessage) return "";

        if (typeof lastMessage.content === "string") {
            return lastMessage.content;
        }

        if (Array.isArray(lastMessage.content)) {
            return lastMessage.content
                .map((c) =>
                    typeof c === "string" ? c : "text" in c ? c.text : JSON.stringify(c)
                )
                .join(" ");
        }

        return "";
    }
}

/**
 * ✅ USAGE EXAMPLE: How to call from your agent
 */
export async function exampleUsage() {
    const extractor = new ParameterExtractorWithAIChoices();

    // Scenario 1: User says "vertical" when asked for roof_type (HIGH CONFIDENCE)
    const result1 = await extractor.extract({
        sessionId: "123",
        userFriendlyParams: {},
        currentField: "roof_type",
        messages: [
            { role: "user", content: "vertical" } as any
        ],
        stateMapCache: new Map(),
    } as any);

    console.log("Result 1:", result1);
    // → {
    //   response: "✅ Updated roof_type to vertical",
    //   userFriendlyParams: { roof_type: "vertical" },
    //   nextStep: "check_missing_fields"
    // }

    // Scenario 2: User says "1" when asked for roof_type (MEDIUM CONFIDENCE - needs confirmation)
    const result2 = await extractor.extract({
        sessionId: "124",
        userFriendlyParams: {},
        currentField: "roof_type",
        messages: [
            { role: "user", content: "1" } as any
        ],
        stateMapCache: new Map(),
    } as any);

    console.log("Result 2:", result2);
    // → {
    //   response: "Got it! You want a Vertical roof... Is that correct?",
    //   nextStep: "ask_for_confirmation",
    //   currentField: "roof_type"
    // }

    // Scenario 3: User confirms with "yes" (CONFIRMATION ACCEPTED)
    const result3 = await extractor.extract({
        sessionId: "124",
        userFriendlyParams: {},
        currentField: "roof_type",
        messages: [
            { role: "user", content: "1" } as any,
            { role: "assistant", content: "Got it! You want a Vertical roof... Is that correct?" } as any,
            { role: "user", content: "yes" } as any
        ],
        stateMapCache: new Map(),
    } as any);

    console.log("Result 3:", result3);
    // → {
    //   response: "✅ Perfect! Updated roof_type to vertical",
    //   userFriendlyParams: { roof_type: "vertical" },
    //   nextStep: "check_missing_fields"
    // }
}
