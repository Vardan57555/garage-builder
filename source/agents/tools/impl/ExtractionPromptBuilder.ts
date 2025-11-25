import {UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";

export class ExtractionPromptBuilder
{
    public buildLockedContext(params: Partial<UserFriendlyParams>): string
    {
        const entries: string[] = [
            params.width && `  - width: ${params.width}ft`,
            params.length && `  - length: ${params.length}ft`,
            params.height && `  - height: ${params.height}ft`,
            params.state_name && `  - state_name: "${params.state_name}"`,
            params.roof_type && `  - roof_type: "${params.roof_type}"`,
            params.gauge && `  - gauge: ${params.gauge}`,
            params.garage_type && `  - garage_type: "${params.garage_type}"`,
        ].filter(Boolean);

        return entries.length > 0
            ? `Already extracted (do NOT override):\n${entries.join("\n")}`
            : "";
    }

    buildExtractionPrompt(field: keyof UserFriendlyParams, userInput: string, lockedContext: string): string
    {
        const config =
            Constants.FIELD_EXTRACTION_CONFIGS[field];

        return `CRITICAL: You are ONLY extracting a single value. NO EXPLANATIONS. NO CODE.

FIELD: ${field}
INSTRUCTION: ${config.instructions}

${lockedContext}

⚠️ STRICT RULES:
1. Return ONLY the value - nothing else
2. NO explanations, NO code, NO comments
3. NO markdown, NO JSON structure
4. If user expresses indecision ("any", "idk", "whatever", etc), return the DEFAULT for this field
5. If user mentions different field, return: null
6. If cannot extract, return: null

EXAMPLES:
${config.examples}

USER INPUT: "${userInput}"

RETURN ONLY THE VALUE:`;
    }
}
