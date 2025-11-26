import pino from "pino";
import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {InputValidator} from "@agents/tools/validators/InputValidator";
import {Constants} from "@common/io/Constants";
import {sharedLLM} from "@llm/SharedLLM";
import {HumanMessage} from "@langchain/core/messages";
import {IParameterExtractionStrategy} from "@agents/tools/impl/io/IParameterExtractionStrategy";
import {ParameterExtractionStrategy} from "@agents/tools/impl/ParameterExtractionStrategy";
import {createLogger} from "@utils/logger/Log";
const logger: pino.Logger = createLogger(module);

export class FieldValueExtractor
{
    private parameterExtractionStrategy: IParameterExtractionStrategy = ParameterExtractionStrategy.getInstance();

    async extractWithLLM(userInput: string, field: keyof UserFriendlyParams, currentParams: Partial<UserFriendlyParams>): Promise<any>
    {
        logger.info(`[FieldValueExtractor] Extracting ${field} from: "${userInput}"`);

        if (InputValidator.isIndecisive(userInput))
        {
            logger.info(`[FieldValueExtractor] Detected indecision: "${userInput}"`);
            const defaultValue = Constants.FIELD_DEFAULTS[field];

            if (defaultValue === null)
            {
                logger.warn(`[FieldValueExtractor] No default for field: ${field}`);
                return null;
            }

            logger.info(`[FieldValueExtractor] Returning default for ${field}: ${defaultValue}`);
            return defaultValue;
        }

        try
        {
            const lockedContext: string = this.parameterExtractionStrategy.buildLockedContext(currentParams);
            const prompt: string = this.parameterExtractionStrategy.buildExtractionPrompt(
                field,
                userInput,
                lockedContext
            );

            logger.info(`[FieldValueExtractor] Calling LLM`);
            const response: string = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const value: string = response.trim().toLowerCase();

            logger.info(`[FieldValueExtractor] Raw response: "${value}"`);

            if (InputValidator.containsCodeArtifacts(value))
            {
                logger.warn(`[FieldValueExtractor] Invalid response (looks like code)`);
                return null;
            }

            if (InputValidator.isNullValue(value)) {
                logger.info(`[FieldValueExtractor] No value extracted`);
                return null;
            }

            logger.info(`[FieldValueExtractor] Extracted ${field}: ${value}`);
            return value;
        }
        catch (error)
        {
            logger.error(`[FieldValueExtractor] Error:`, error);
            return null;
        }
    }
}
