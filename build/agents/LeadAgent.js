"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LeadAgent = void 0;
const memory_1 = require("langchain/memory");
const InstantiationError_1 = require("../errors/InstantiationError");
const PriceParamsExtractorTool_1 = require("./tools/impl/PriceParamsExtractorTool");
const SharedLLM_1 = require("../llm/SharedLLM");
const messages_1 = require("@langchain/core/messages");
const ProcedureExecutor_1 = require("../utils/procedure/ProcedureExecutor");
const REQUIRED_FIELDS = [
    "width",
    "length",
    "height",
    "state_name",
    "roof_type",
    "gauge",
];
const FIELD_PROMPTS = {
    garage_type: "What type of garage do you need?",
    width: "What width do you need for your garage (in feet)?",
    length: "What length do you need (in feet)?",
    height: "What height do you need (in feet)?",
    state_name: "Which state are you located in?",
    roof_type: "Which roof style would you prefer?\n  • Vertical (best weather protection)\n  • Regular (standard horizontal panels)\n  • Box (economy option)",
    manufacturer_name: "Do you have a preferred manufacturer? (optional, press Enter to use default)",
    utility_length: "Utility/lean-to length? (optional)",
    building_type: "Building type? (garage/carport/barn)",
    gauge: "Metal gauge preference? (12/14 or blank for standard)",
    is_barn: "Is this a barn style? (yes/no)",
};
class LeadAgent {
    static instance;
    memory;
    state;
    constructor(enforce) {
        if (enforce !== Enforce)
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        this.memory = new memory_1.BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new memory_1.ChatMessageHistory(),
        });
        this.state = {
            userFriendlyParams: {},
            hasGarageIntent: false,
        };
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
            return content
                .map((c) => ("text" in c ? c.text : JSON.stringify(c)))
                .join(" ");
        }
        return String(content);
    }
    async detectGarageIntentWithAI(input) {
        const prompt = `
You are an intent classifier for a garage/building pricing service.
Analyze if the user wants pricing for a garage, carport, barn, metal building, or any similar structure.
Return ONLY "YES" if they want building pricing, or "NO" if it's just general chat.
User input: "${input}"
Answer (YES or NO):
    `.trim();
        try {
            console.log("[LeadAgent] Intent detection prompt:", prompt);
            const aiMessage = await SharedLLM_1.sharedLLM.invoke([new messages_1.HumanMessage(prompt)]);
            console.log("[LeadAgent] Intent detection response:", aiMessage.content);
            const response = aiMessage.content.trim().toUpperCase();
            return response.includes("YES");
        }
        catch {
            const lowerInput = input.toLowerCase();
            return ["garage", "carport", "barn", "building", "price", "quote", "cost"].some((kw) => lowerInput.includes(kw));
        }
    }
    async mapStateToDB(stateName, preferredBuildingId = 1) {
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([stateName], "getMapIdByStateName(?)", "getMapIdByStateName");
            console.log("[LeadAgent] Mapping state:", stateName, "->", result);
            if (result && result.length > 0) {
                const preferredMapping = result.find((item) => item.building_id === preferredBuildingId);
                const mapping = preferredMapping || result[0];
                return {
                    map_id: mapping.map_id,
                    manufacturer_id: mapping.manufacturer_id
                };
            }
            return null;
        }
        catch (error) {
            console.error("[LeadAgent] State mapping failed:", error);
            return null;
        }
    }
    async mapRoofTypeToDB(roofType, mapId) {
        const fallbackMapping = {
            vertical: 1,
            regular: 2,
            standard: 2,
            box: 3,
            boxed: 3,
            economy: 3,
        };
        try {
            const result = await ProcedureExecutor_1.ProcedureExecutor.getProcedureData([mapId, roofType], "getRoofIdByType(?, ?)", "roof_mapping");
            if (result && result.length > 0)
                return result[0].roof_id;
            return fallbackMapping[roofType.toLowerCase()] || 2;
        }
        catch {
            const roofTypeLower = roofType.toLowerCase();
            if (roofTypeLower.includes("vertical"))
                return 1;
            if (roofTypeLower.includes("box"))
                return 3;
            return 2;
        }
    }
    async convertToTechnicalParams(userParams) {
        try {
            let map_id = 1;
            let manufacturer_id = 1;
            if (userParams.state_name) {
                const mapping = await this.mapStateToDB(userParams.state_name);
                if (!mapping)
                    throw new Error(`State "${userParams.state_name}" not found.`);
                map_id = mapping.map_id;
                manufacturer_id = mapping.manufacturer_id;
            }
            const roof_id = userParams.roof_type
                ? await this.mapRoofTypeToDB(userParams.roof_type, map_id)
                : 2;
            const defaultGauge = 14;
            const gauge = userParams.gauge || defaultGauge;
            return {
                width: userParams.width || 0,
                length: userParams.length || 0,
                height: userParams.height || 0,
                map_id,
                roof_id,
                manufacturer_id,
                utility_length: userParams.utility_length,
                building_type: userParams.building_type,
                gauge,
                is_barn: userParams.is_barn,
            };
        }
        catch (error) {
            console.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }
    getMissingFields(params) {
        return REQUIRED_FIELDS.filter((field) => params[field] === undefined || params[field] === null || params[field] === "" || params[field] === 0);
    }
    async run(input) {
        console.log("[LeadAgent] User input:", input);
        await this.memory.chatHistory.addUserMessage(input);
        const history = await this.memory.chatHistory.getMessages();
        const context = history.map((msg) => this.getMessageString(msg.content)).join("\n");
        if (!this.state.hasGarageIntent) {
            const hasIntent = await this.detectGarageIntentWithAI(input);
            if (!hasIntent) {
                const response = "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await this.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            this.state.hasGarageIntent = true;
        }
        const rawParams = await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance()._call(context);
        console.log("[LeadAgent] Raw params from extractor:", rawParams);
        const extractedParams = PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance().safeExtractUserFriendlyParams(rawParams);
        console.log("[LeadAgent] Safe extracted user-friendly params:", extractedParams);
        this.state.userFriendlyParams = { ...this.state.userFriendlyParams, ...extractedParams };
        const missingFields = this.getMissingFields(this.state.userFriendlyParams);
        console.log("[LeadAgent] Missing fields:", missingFields);
        if (missingFields.length > 0) {
            const nextField = missingFields[0];
            this.state.currentField = nextField;
            let response = "";
            if (extractedParams.width || extractedParams.length || extractedParams.height) {
                response += "Got it! ";
                if (extractedParams.width)
                    response += `Width: ${extractedParams.width}ft. `;
                if (extractedParams.length)
                    response += `Length: ${extractedParams.length}ft. `;
                if (extractedParams.height)
                    response += `Height: ${extractedParams.height}ft. `;
                response += "\n\n";
            }
            response += FIELD_PROMPTS[nextField];
            await this.memory.chatHistory.addAIChatMessage(response);
            return response;
        }
        const technicalParams = await this.convertToTechnicalParams(this.state.userFriendlyParams);
        console.log("[LeadAgent] Converted technical params:", technicalParams);
        if (!technicalParams)
            return "⚠️ Failed to convert user input to technical parameters.";
        const result = await PriceParamsExtractorTool_1.PriceParamsExtractorTool.getInstance().calculatePriceWithParams(technicalParams);
        await this.memory.chatHistory.addAIChatMessage(result);
        this.state = { userFriendlyParams: {}, hasGarageIntent: false };
        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
    }
    async reset() {
        this.state = { userFriendlyParams: {}, hasGarageIntent: false };
        this.memory = new memory_1.BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new memory_1.ChatMessageHistory(),
        });
    }
}
exports.LeadAgent = LeadAgent;
function Enforce() { }
//# sourceMappingURL=LeadAgent.js.map