import pino from "pino";
import { createLogger } from "@utils/logger/Log";
import { LeadAgentStateType } from "@agents/LeadAgentState";
import { HumanMessage } from "@langchain/core/messages";
import { sharedLLM } from "@llm/SharedLLM";
import {AddonSelection} from "@agents/tools/io/IChat";

const logger: pino.Logger = createLogger(module);

export interface AddonOption {
    name: string;
    label: string;
    type: 'window' | 'door' | 'brace' | 'other';
    costPerUnit: number;
    description?: string;
}

export const ADDON_CATALOG: AddonOption[] = [
    {
        name: 'garage_door',
        label: 'Extra Garage Door',
        type: 'door',
        costPerUnit: 800,
        description: 'Standard garage door opening'
    },
    {
        name: 'window',
        label: 'Extra Window',
        type: 'window',
        costPerUnit: 250,
        description: 'Standard window installation'
    },
    {
        name: 'walkin_door',
        label: 'Walk-in Door',
        type: 'door',
        costPerUnit: 350,
        description: 'Personnel door'
    },
    {
        name: 'braces',
        label: 'Extra Braces',
        type: 'brace',
        costPerUnit: 150,
        description: 'Additional structural bracing'
    },
    {
        name: 'cupola',
        label: 'Cupola',
        type: 'other',
        costPerUnit: 400,
        description: 'Roof top ventilation'
    },
];

function formatAddonsForDisplay(addons: AddonOption[]): string {
    return addons
        .map((addon, idx) =>
            `${idx + 1}. ${addon.label} ($${addon.costPerUnit.toFixed(2)} each)\n   ${addon.description || ''}`
        )
        .join("\n\n");
}

async function detectAddonsFromInput(userInput: string): Promise<{ addons: string[]; quantities: Map<string, number> }> {
    try {
        const prompt = `Analyze this user input and extract addon requests. Return ONLY valid JSON.

Available addons: ${ADDON_CATALOG.map(a => a.name).join(', ')}

User input: "${userInput}"

Look for patterns like:
- "add 2 windows" → {"addons": ["window"], "quantities": {"window": 2}}
- "extra door and 3 braces" → {"addons": ["walkin_door", "braces"], "quantities": {"walkin_door": 1, "braces": 3}}
- "no addons" → {"addons": [], "quantities": {}}

Return JSON:
{
  "addons": ["addon_name_1", "addon_name_2"],
  "quantities": {"addon_name_1": number, "addon_name_2": number}
}`;

        const response = await sharedLLM.invoke([new HumanMessage(prompt)]);
        const cleaned = response.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            const result = JSON.parse(jsonMatch[0]);
            return result;
        }
        return { addons: [], quantities: new Map() };
    } catch (error) {
        logger.error("[detectAddonsFromInput] Error:", error);
        return { addons: [], quantities: new Map() };
    }
}

export const askForAddonsNode = async (state: LeadAgentStateType) => {
    logger.info(`[AddonsNode] Session ${state.sessionId} - Asking for addons`);

    const currentParams = state.userFriendlyParams;

    const promptMessage =
        `✓ Building specs locked in:\n` +
        `   ${currentParams.width}ft (W) × ${currentParams.length}ft (L) × ${currentParams.height}ft (H)\n\n` +
        `Would you like to add any optional features to your building?\n\n` +
        `${formatAddonsForDisplay(ADDON_CATALOG)}\n\n` +
        `Examples:\n` +
        `• "Add 2 windows and 1 door"\n` +
        `• "Yes, 3 braces"\n` +
        `• "No" (skip addons)\n\n` +
        `What would you like to add?`;

    return {
        response: promptMessage,
        isSelectingAddons: true,
        nextStep: "__end__",
    };
};

export const processAddonsNode = async (state: LeadAgentStateType) => {
    logger.info(`[ProcessAddonsNode] Session ${state.sessionId} - Processing addon selection`);

    try {
        const userInput = state.messages[state.messages.length - 1]?.content as string;

        if (!userInput) {
            return {
                response: "Please specify which addons you want.",
                nextStep: "__end__",
            };
        }

        const declinePatterns = [/\b(no|skip|none|don't|nope|nothing)\b/i];
        if (declinePatterns.some(p => p.test(userInput))) {
            logger.info("[ProcessAddonsNode] User declined addons");
            return {
                selectedAddons: [],
                response: "✓ No addons selected. Moving to price calculation...",
                isSelectingAddons: false,
                nextStep: "calculate_price",
            };
        }

        const { addons, quantities } = await detectAddonsFromInput(userInput);

        if (addons.length === 0) {
            return {
                response: "I didn't catch that. Could you specify addon quantities? (e.g., '2 windows' or 'skip')",
                isSelectingAddons: true,
                nextStep: "__end__",
            };
        }

        const selectedAddons: AddonSelection[] = [];
        let summaryLines: string[] = ["✓ Selected add-ons:"];

        for (const addonName of addons) {
            const catalogItem = ADDON_CATALOG.find(a => a.name === addonName);
            if (!catalogItem) continue;

            const quantity = quantities[addonName] || 1;
            const totalCost = quantity * catalogItem.costPerUnit;

            selectedAddons.push({
                name: addonName,
                label: catalogItem.label,
                quantity,
                cost: catalogItem.costPerUnit,
                totalCost,
                type: catalogItem.type,
                id: "",
                description: ""
            });

            summaryLines.push(`   • ${quantity}× ${catalogItem.label}: $${totalCost.toFixed(2)}`);
        }

        const totalAddonsPrice = selectedAddons.reduce((sum, a) => sum + a.totalCost, 0);
        summaryLines.push(`\nAdd-ons Total: $${totalAddonsPrice.toFixed(2)}`);
        summaryLines.push("\nCalculating final price...");

        logger.info(`[ProcessAddonsNode] ${selectedAddons.length} addons selected`);

        return {
            selectedAddons,
            response: summaryLines.join("\n"),
            isSelectingAddons: false,
            nextStep: "calculate_price",
        };
    } catch (error) {
        logger.error("[ProcessAddonsNode] Error:", error);
        return {
            response: "Error processing addons. Please try again.",
            nextStep: "__end__",
        };
    }
};
