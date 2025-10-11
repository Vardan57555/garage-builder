import { Ollama } from "ollama";

export const sharedLLM = new Ollama({
    host: process.env.OLLAMA_API_HOST || "http://ollama:11434",
});

async function preloadOllamaModel() {
    try {
        await sharedLLM.generate({ model: "llama3.2:latest", prompt: "Hello" });
        console.log("Ollama model preloaded!");
    } catch (err) {
        console.error("Failed to preload Ollama model:", err);
    }
}

// Call this once when the backend starts
preloadOllamaModel();
