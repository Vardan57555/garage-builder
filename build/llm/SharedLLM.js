"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sharedLLM = void 0;
const ollama_1 = require("ollama");
exports.sharedLLM = new ollama_1.Ollama({
    host: process.env.OLLAMA_API_HOST || "http://ollama:11434",
});
async function preloadOllamaModel() {
    try {
        await exports.sharedLLM.generate({ model: "llama3.2:latest", prompt: "Hello" });
        console.log("Ollama model preloaded!");
    }
    catch (err) {
        console.error("Failed to preload Ollama model:", err);
    }
}
preloadOllamaModel();
//# sourceMappingURL=SharedLLM.js.map