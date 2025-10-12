"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgent = void 0;
const agents_1 = require("langchain/agents");
const memory_1 = require("langchain/memory");
const InstantiationError_1 = require("../errors/InstantiationError");
const SharedLLM_1 = require("../llm/SharedLLM");
const GeneralChatTool_1 = require("./tools/impl/GeneralChatTool");
const PriceParamsExtractorTool_1 = require("./tools/impl/PriceParamsExtractorTool");
const Constants_1 = require("../common/io/Constants");
class LeadAgent {
    static instance;
    memory;
    tools = [
        PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance(),
        GeneralChatTool_1.GeneralChatTool.getInstance()
    ];
    priceExecutor;
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
            const agent = new LeadAgent(Enforce);
            await agent.init();
            LeadAgent.instance = agent;
        }
        return LeadAgent.instance;
    }
    async run(input) {
        try {
            const tool = this.tools.find(t => t.canHandle(input));
            if (!tool) {
                return await GeneralChatTool_1.GeneralChatTool.getInstance()._call(input, this.memory);
            }
            if (tool.name === "priceParamsExtractor") {
                const result = await this.priceExecutor.call({ input });
                return result?.output ?? await GeneralChatTool_1.GeneralChatTool.getInstance()._call(input, this.memory);
            }
            return await tool._call(input, this.memory);
        }
        catch (error) {
            throw new Error(`LeadAgent execution failed: ${error.message}`);
        }
    }
    async init() {
        this.priceExecutor = await (0, agents_1.initializeAgentExecutorWithOptions)([PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance()], SharedLLM_1.sharedLLM, {
            agentType: Constants_1.Constants.AGENT_TYPES.STRUCTURED_CHAT,
            verbose: false,
            memory: this.memory,
        });
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() {
}
//# sourceMappingURL=LeadAgent.js.map