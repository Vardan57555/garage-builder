import { BufferMemory, ChatMessageHistory } from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import { IPricingParams } from "@modules/price-service/services/io/IPrice";
import { sharedLLM } from "@llm/SharedLLM";
import { HumanMessage } from "@langchain/core/messages";
import { ProcedureExecutor } from "@utils/procedure/ProcedureExecutor";
import { logger } from "sequelize/lib/utils/logger";
import {ConversationState, RoofMappingResult, StateMapping, UserFriendlyParams} from "@agents/tools/io/IChat";
import {Constants} from "@common/io/Constants";

export class LeadAgent
{
    private static instance: LeadAgent;
    private memory: BufferMemory;
    private state: ConversationState;
    private stateMapCache: Map<string, StateMapping | null> = new Map();
    private roofMapCache: Map<string, number> = new Map();

    private constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        this.memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });

        this.state = {
            userFriendlyParams: {},
            hasGarageIntent: false,
        };
    }

    public static async getInstance(): Promise<LeadAgent>
    {
        if (!LeadAgent.instance)
        {
            LeadAgent.instance = new LeadAgent(Enforce);
        }
        return LeadAgent.instance;
    }

    private getMessageString(content: string | any[]): string
    {
        if (typeof content === "string") return content;
        if (Array.isArray(content)) {
            return content
                .map((c) => ("text" in c ? c.text : JSON.stringify(c)))
                .join(" ");
        }
        return String(content);
    }

    private async detectGarageIntentWithAI(input: string): Promise<boolean> {
        try {
            const prompt = Constants.INTENT_PROMPT.replace("{input}", input);
            console.log("[LeadAgent] Intent detection prompt:", prompt);

            const aiMessage = await sharedLLM.invoke([new HumanMessage(prompt)]);
            const response = (aiMessage.content as string).trim().toUpperCase();
            console.log("[LeadAgent] Intent detection response:", response);

            return response.includes("YES");
        } catch (error) {
            logger.warn("[LeadAgent] AI intent detection failed, using fallback:", error);
            return this.detectGarageIntentFallback(input);
        }
    }

    private detectGarageIntentFallback(input: string): boolean {
        const lowerInput = input.toLowerCase();
        return Array.from(Constants.INTENT_KEYWORDS).some((kw) => lowerInput.includes(kw));
    }

    private async mapStateToDB(
        stateName: string,
        preferredBuildingId = 1
    ): Promise<StateMapping | null> {
        const cacheKey = `${stateName}:${preferredBuildingId}`;
        if (this.stateMapCache.has(cacheKey)) {
            return this.stateMapCache.get(cacheKey) ?? null;
        }

        try {
            const result = await ProcedureExecutor.getProcedureData<any>(
                [stateName],
                "getMapIdByStateName(?)",
                "getMapIdByStateName"
            );

            if (result?.length > 0) {
                const preferredMapping = result.find(
                    (item: any) => item.building_id === preferredBuildingId
                );
                const mapping = preferredMapping || result[0];
                const output: StateMapping = {
                    map_id: mapping.map_id,
                    manufacturer_id: mapping.manufacturer_id,
                };
                this.stateMapCache.set(cacheKey, output);
                return output;
            }

            this.stateMapCache.set(cacheKey, null);
            return null;
        } catch (error) {
            logger.error("[LeadAgent] State mapping failed:", error);
            this.stateMapCache.set(cacheKey, null);
            return null;
        }
    }

    private async mapRoofTypeToDB(roofType: string, mapId: number): Promise<number> {
        const normalizedRoofType = roofType.toLowerCase();
        const cacheKey = `${normalizedRoofType}:${mapId}`;

        if (this.roofMapCache.has(cacheKey)) {
            return this.roofMapCache.get(cacheKey)!;
        }

        try {
            const result: RoofMappingResult[] =
                await ProcedureExecutor.getProcedureData<RoofMappingResult>(
                    [mapId, roofType],
                    "getRoofIdByType(?, ?)",
                    "roof_mapping"
                );

            if (result?.length > 0) {
                this.roofMapCache.set(cacheKey, result[0].roof_id);
                return result[0].roof_id;
            }
        } catch (error) {
            logger.error("[LeadAgent] Roof type mapping failed:", error);
        }

        // Fallback logic
        const fallbackId = Constants.ROOF_TYPE_MAPPING[normalizedRoofType] ??
            (normalizedRoofType.includes("vertical") ? 1 :
                normalizedRoofType.includes("box") ? 3 : 2);

        this.roofMapCache.set(cacheKey, fallbackId);
        return fallbackId;
    }

    private async convertToTechnicalParams(
        userParams: UserFriendlyParams
    ): Promise<IPricingParams | null> {
        try {
            let map_id = 1;
            let manufacturer_id = 1;

            // Map state if provided
            if (userParams.state_name) {
                const mapping = await this.mapStateToDB(userParams.state_name);
                if (mapping) {
                    map_id = mapping.map_id;
                    manufacturer_id = mapping.manufacturer_id;
                } else {
                    console.warn(
                        `[LeadAgent] State "${userParams.state_name}" not found, using defaults.`
                    );
                }
            }

            // Map roof type
            const roof_id = userParams.roof_type
                ? await this.mapRoofTypeToDB(userParams.roof_type, map_id)
                : 2;

            return {
                width: userParams.width ?? 0,
                length: userParams.length ?? 0,
                height: userParams.height ?? 0,
                map_id,
                roof_id,
                manufacturer_id,
                utility_length: userParams.utility_length,
                building_type: userParams.building_type,
                gauge: userParams.gauge ?? 14,
                is_barn: userParams.is_barn,
            };
        } catch (error) {
            logger.error("[LeadAgent] Param conversion failed:", error);
            return null;
        }
    }

    private getMissingFields(
        params: Partial<UserFriendlyParams>
    ): (keyof UserFriendlyParams)[] {
        return Constants.REQUIRED_FIELDS.filter(
            (field) => !params[field]
        );
    }

    private formatDimensionsResponse(extractedParams: Partial<UserFriendlyParams>): string {
        const dimensions = (["width", "length", "height"] as const)
            .filter((k) => extractedParams[k])
            .map((k) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${extractedParams[k]}ft.`)
            .join(" ");

        return dimensions ? `Got it! ${dimensions}\n\n` : "";
    }

    public async run(input: string): Promise<string> {
        console.log("[LeadAgent] User input:", input);

        await this.memory.chatHistory.addUserMessage(input);

        // Step 1: Detect intent
        if (!this.state.hasGarageIntent) {
            const hasIntent = await this.detectGarageIntentWithAI(input);
            if (!hasIntent) {
                const response =
                    "Hello! 👋 I can help you get a price quote for a garage or metal building.\n" +
                    "Please tell me what type of building or provide dimensions (width, length, height in feet).";
                await this.memory.chatHistory.addAIChatMessage(response);
                return response;
            }
            this.state.hasGarageIntent = true;
        }

        // Step 2: Extract parameters
        const extractor = PriceParamsExtractorTool.getInstance();
        const rawParams = await extractor._call(await this.getConversationContext());
        console.log("[LeadAgent] Raw params from extractor:", rawParams);

        const extractedParams = extractor.safeExtractUserFriendlyParams(rawParams);
        console.log("[LeadAgent] Safe extracted user-friendly params:", extractedParams);

        this.state.userFriendlyParams = {
            ...this.state.userFriendlyParams,
            ...extractedParams
        };

        // Step 3: Ask missing fields
        const missingFields = this.getMissingFields(this.state.userFriendlyParams);
        if (missingFields.length > 0) {
            const nextField = missingFields[0];
            this.state.currentField = nextField;
            const response = this.formatDimensionsResponse(extractedParams) +
                Constants.FIELD_PROMPTS[nextField];

            await this.memory.chatHistory.addAIChatMessage(response);
            return response;
        }

        // Step 4: Convert & calculate
        const technicalParams = await this.convertToTechnicalParams(
            this.state.userFriendlyParams as UserFriendlyParams
        );

        if (!technicalParams) {
            return "⚠️ Failed to convert user input to technical parameters.";
        }

        const result = await extractor.calculatePriceWithParams(technicalParams);
        await this.memory.chatHistory.addAIChatMessage(result);

        // Reset state
        this.resetState();

        return result + "\n\n💬 Need another quote? Just describe what you're looking for!";
    }

    private async getConversationContext(): Promise<string> {
        const history = await this.memory.chatHistory.getMessages();
        return history.map(msg => this.getMessageString(msg.content)).join("\n");
    }

    private resetState(): void {
        this.state.userFriendlyParams = {};
        this.state.hasGarageIntent = false;
        this.state.currentField = undefined;
    }

    public async reset(): Promise<void> {
        this.resetState();
        this.stateMapCache.clear();
        this.roofMapCache.clear();
        this.memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });
    }
}

function Enforce(): void {}
