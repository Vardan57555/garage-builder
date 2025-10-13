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
    tools = [
        PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance(),
        GeneralChatTool_1.GeneralChatTool.getInstance()
    ];
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
    async run(input) {
        console.log("Running LeadAgent for input:", input);
        try {
            const isGarageInput = /garage|building|width|length|height/i.test(input);
            if (isGarageInput) {
                console.log("Garage input");
                return await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance()._call(input, this.memory);
            }
            const tool = this.tools.find(t => t.name !== "priceParamsExtractor" && t.canHandle(input));
            if (!tool) {
                console.log("General input");
                return await GeneralChatTool_1.GeneralChatTool.getInstance()._call(input, this.memory);
            }
            return await tool._call(input, this.memory);
        }
        catch (error) {
            throw new Error(`LeadAgent execution failed: ${error.message}`);
        }
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() {
}
//# sourceMappingURL=LeadAgent.js.map