import { AgentExecutor, initializeAgentExecutorWithOptions } from "langchain/agents";
import {BufferMemory, ChatMessageHistory} from "langchain/memory";
import { InstantiationError } from "@errors/InstantiationError";
import { ToolInterface } from "@langchain/core/tools";
import { sharedLLM } from "@llm/SharedLLM";
import { ChainValues } from "@langchain/core/dist/utils/types";
// import {GeneralChatTool} from "@agents/tools/impl/GeneralChatTool";
import { PriceParamsExtractorTool } from "./tools/impl/PriceParamsExtractorTool";
import {Constants} from "@common/io/Constants";


export class LeadAgent
{
    /**
     * Singleton instance of LeadAgent.
     */

    private static instance: LeadAgent;

    /**
     * Promise that resolves to the AgentExecutor instance.
     */

    private executorPromise: Promise<AgentExecutor>;

    constructor(enforce: () => void)
    {
        if (enforce !== Enforce)
        {
            throw new InstantiationError(InstantiationError.NOT_INSTANTIABLE, "Use LeadAgent.getInstance() instead of new.");
        }

        const tools: ToolInterface[] = [
            PriceParamsExtractorTool.getInstance(),
            // GeneralChatTool.getInstance()
        ];

        const memory = new BufferMemory({
            memoryKey: "chat_history",
            returnMessages: true,
            chatHistory: new ChatMessageHistory(),
        });

        this.executorPromise = initializeAgentExecutorWithOptions(tools, sharedLLM, {
            agentType: Constants.AGENT_TYPES.STRUCTURED_CHAT,
            verbose: true,
            memory: memory as unknown as never,
        });
    }

    /**
     * Gets the singleton instance of NgoRouter.
     *
     * @returns The singleton instance of NgoRouter.
     */

    public static getInstance(): LeadAgent
    {
        if (!LeadAgent.instance)
        {
            LeadAgent.instance = new LeadAgent(Enforce);
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
            const executor: AgentExecutor = await this.executorPromise;
            const result: ChainValues = await executor.call({ input });

            return result.output;
        }
        catch (error)
        {
            throw new Error(`LeadAgent execution failed: ${(error as Error).message}`);
        }
    }
}

/**
 * Function to enforce the Singleton pattern.
 */

function Enforce(): void
{
}
