import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents";
import {BufferMemory, ChatMessageHistory} from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { sharedLLM } from "@llm/SharedLLM";
import {GeneralChatTool} from "@agents/tools/impl/GeneralChatTool";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import {Constants} from "@common/io/Constants";

export class LeadAgent
{
    /**
     * Singleton instance of LeadAgent.
     */

    private static instance: LeadAgent;


    /**
     * Stores conversation memory for the agent.
     */

    private memory: BufferMemory;

    /**
     * List of tools available to the agent.
     */

    private tools = [
        PriceParamsExtractorTool.getInstance(),
        GeneralChatTool.getInstance()
    ];

    /**
     * Executes pricing-related agent actions.
     */

    private priceExecutor: AgentExecutor;

    constructor(enforce: () => void)
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
    }


    /**
     * Gets the singleton instance of NgoRouter.
     *
     * @returns The singleton instance of NgoRouter.
     */

    public static async getInstance(): Promise<LeadAgent>
    {
        if (!LeadAgent.instance)
        {
            const agent = new LeadAgent(Enforce);
            await agent.init();
            LeadAgent.instance = agent;
        }
        return LeadAgent.instance;
    }

    /**
     * Executes the agent on a given input.
     */


    public async run(input: string): Promise<string>
    {
        try
        {
            const tool: PriceParamsExtractorTool | GeneralChatTool = this.tools.find(t => t.canHandle(input));

            if (!tool)
            {
                return await GeneralChatTool.getInstance()._call(input, this.memory);
            }

            if (tool.name === "priceParamsExtractor")
            {
                const result = await this.priceExecutor.call({ input });
                return result?.output ?? await GeneralChatTool.getInstance()._call(input, this.memory);
            }

            return await (tool as GeneralChatTool)._call(input, this.memory);

        }
        catch (error)
        {
            throw new Error(`LeadAgent execution failed: ${(error as Error).message}`);
        }
    }

    /**
     * Initializes the price executor with the necessary tools, LLM, and memory.
     */

    private async init()
    {
        this.priceExecutor = await initializeAgentExecutorWithOptions(
            [PriceParamsExtractorTool.getInstance()],
            sharedLLM,
            {
                agentType: Constants.AGENT_TYPES.STRUCTURED_CHAT,
                verbose: false,
                memory: this.memory as unknown as never,
            }
        );
    }
}

/**
 * Function to enforce the Singleton pattern.
 */

function Enforce(): void
{
}
