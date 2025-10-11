import { ChatOpenAI } from "@langchain/openai";

export const sharedLLM = new ChatOpenAI({
    modelName: "gpt-4",
    temperature: 0.3
});
