"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneralChatTool = void 0;
const BaseTool_1 = require("../../tools/BaseTool");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const SharedLLM_1 = require("../../../llm/SharedLLM");
class GeneralChatTool extends BaseTool_1.BaseTool {
    static instance;
    name = "generalChat";
    description = "Handles general conversation and casual questions.";
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use GeneralChatTool.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!GeneralChatTool.instance) {
            GeneralChatTool.instance = new GeneralChatTool(Enforce);
        }
        return GeneralChatTool.instance;
    }
    canHandle(input) {
        const garageKeywords = /garage|building|width|length|height/i;
        return !garageKeywords.test(input);
    }
    async _call(input, memory) {
        const isGarageInput = /garage|building|width|length|height/i.test(input);
        if (isGarageInput) {
            return null;
        }
        const historyMessages = memory ? await memory.chatHistory.getMessages() : [];
        const messages = [
            ...historyMessages,
            { role: "user", content: input }
        ];
        const response = await SharedLLM_1.sharedLLM.invoke(messages);
        if (memory) {
            memory.chatHistory.addUserMessage(input);
            memory.chatHistory.addAIChatMessage(response.content);
        }
        return response.content;
    }
}
exports.GeneralChatTool = GeneralChatTool;
function Enforce() { }
//# sourceMappingURL=GeneralChatTool.js.map