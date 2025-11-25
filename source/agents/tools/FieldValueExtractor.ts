import pino from "pino";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {Constants} from "@common/io/Constants";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
import {ExtractionPromptBuilder} from "@agents/tools/impl/ExtractionPromptBuilder";

export class FieldValueExtractor {
    private logger: pino.Logger;
    private promptBuilder: ExtractionPromptBuilder;

    constructor(logger: pino.Logger) {
        this.logger = logger;
        this.promptBuilder = new ExtractionPromptBuilder();
    }

    async extractWithLLM(
        userInput: string,
        field: keyof UserFriendlyParams,
        currentParams: Partial<UserFriendlyParams>
    ): Promise<any> {
        this.logger.info(
            `[FieldValueExtractor] Extracting ${field} from: "${userInput}"`
        );

        if (InputValidator.isIndecisive(userInput)) {
            this.logger.info(
                `[FieldValueExtractor] Detected indecision: "${userInput}"`
            );
            const defaultValue = Constants.FIELD_DEFAULTS[field];

            if (defaultValue === null) {
                this.logger.warn(
                    `[FieldValueExtractor] No default for field: ${field}`
                );
                return null;
            }

            this.logger.info(
                `[FieldValueExtractor] Returning default for ${field}: ${defaultValue}`
            );
            return defaultValue;
        }

        try {
            const lockedContext = this.promptBuilder.buildLockedContext(
                currentParams
            );
            const prompt = this.promptBuilder.buildExtractionPrompt(
                field,
                userInput,
                lockedContext
            );

            this.logger.info(`[FieldValueExtractor] Calling LLM`);
            const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const value = response.trim().toLowerCase();

            this.logger.info(`[FieldValueExtractor] Raw response: "${value}"`);

            if (InputValidator.containsCodeArtifacts(value)) {
                this.logger.warn(
                    `[FieldValueExtractor] Invalid response (looks like code)`
                );
                return null;
            }

            if (InputValidator.isNullValue(value)) {
                this.logger.info(`[FieldValueExtractor] No value extracted`);
                return null;
            }

            this.logger.info(`[FieldValueExtractor] Extracted ${field}: ${value}`);
            return value;
        } catch (error) {
            this.logger.error(`[FieldValueExtractor] Error:`, error);
            return null;
        }
    }
}
