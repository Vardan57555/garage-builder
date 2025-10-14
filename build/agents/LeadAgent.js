"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgent = void 0;
const memory_1 = require("langchain/memory");
const InstantiationError_1 = require("../errors/InstantiationError");
const GeneralChatTool_1 = require("./tools/impl/GeneralChatTool");
const PriceParamsExtractorTool_1 = require("./tools/impl/PriceParamsExtractorTool");
class LeadAgent {
    static instance;
    memory;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }
        this.memory = new memory_1.BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new memory_1.ChatMessageHistory(),
        });
    }
    static async getInstance() {
        if (!LeadAgent.instance) {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }
    getMessageString(content) {
        if (typeof content === "string")
            return content;
        if (Array.isArray(content)) {
            return content.map(c => ("text" in c ? c.text : JSON.stringify(c))).join(" ");
        }
        return String(content);
    }
    async run(input) {
        try {
            const history = await this.memory.chatHistory.getMessages();
            const garageMessages = history
                .filter(msg => /garage|building|width|length|height/i.test(this.getMessageString(msg.content)))
                .map(msg => this.getMessageString(msg.content));
            const fullGarageInput = garageMessages.concat([input]).join("\n");
            const isGarageInput = /garage|building|width|length|height/i.test(fullGarageInput);
            if (isGarageInput) {
                try {
                    const result = await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance()._call(fullGarageInput, this.memory);
                    return result;
                }
                catch (e) {
                    console.error("PriceParamsExtractorTool failed:", e);
                    return "⚠️ Failed to calculate price. Please provide complete garage details.";
                }
            }
            try {
                const result = await GeneralChatTool_1.GeneralChatTool.getInstance()._call(input, this.memory);
                return result || "⚠️ Sorry, I couldn’t understand your input.";
            }
            catch (e) {
                console.error("GeneralChatTool failed:", e);
                return "⚠️ An error occurred while processing your request.";
            }
        }
        catch (error) {
            console.error("LeadAgent execution failed:", error);
            return "⚠️ An unexpected error occurred.";
        }
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map