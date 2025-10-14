// LeadAgent.ts
import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { GeneralChatTool } from "@agents/tools/impl/GeneralChatTool";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { BaseMessage } from "@langchain/core/messages";

export class LeadAgent {
    private static instance: LeadAgent;
    private memory: BufferMemory;

    private constructor(enforce: () => void) {
        if (enforce !== Enforce) {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Use LeadAgent.getInstance() instead of new."
            );
        }

        this.memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });
    }

    public static async getInstance(): Promise<LeadAgent> {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }

    private getMessageString(content: string | any[]): string {
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
            return content.map(c => ("text" in c ? c.text : JSON.stringify(c))).join(" ");
        }
        return String(content);
    }

    public async run(input: string): Promise<string> {
        try {
            // 1️⃣ Collect all previous garage-related messages
            const history: BaseMessage[] = await this.memory.chatHistory.getMessages();
            const garageMessages = history
                .filter(msg => /garage|building|width|length|height/i.test(this.getMessageString(msg.content)))
                .map(msg => this.getMessageString(msg.content));

            const fullGarageInput = garageMessages.concat([input]).join("\n");

            const isGarageInput = /garage|building|width|length|height/i.test(fullGarageInput);

            if (isGarageInput) {
                // 2️⃣ Price calculation with safe handling
                try {
                    const result = await PriceParamsExtractorTool.getInstance()._call(fullGarageInput, this.memory);
                    return result;
                } catch (e) {
                    console.error("PriceParamsExtractorTool failed:", e);
                    return "⚠️ Failed to calculate price. Please provide complete garage details.";
                }
            }

            // 3️⃣ Fallback to general conversation
            try {
                const result = await GeneralChatTool.getInstance()._call(input, this.memory);
                return result || "⚠️ Sorry, I couldn’t understand your input.";
            } catch (e) {
                console.error("GeneralChatTool failed:", e);
                return "⚠️ An error occurred while processing your request.";
            }

        } catch (error) {
            console.error("LeadAgent execution failed:", error);
            return "⚠️ An unexpected error occurred.";
        }
    }
}

function Enforce(): void {}

