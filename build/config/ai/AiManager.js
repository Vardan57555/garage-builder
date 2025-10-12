"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIManager = void 0;
const openai_1 = __importDefault(require("openai"));
const ServiceManager_1 = require("../ServiceManager");
const InstantiationError_1 = require("../../errors/InstantiationError");
const ServerError_1 = require("../../errors/ServerError");
const dotenv_1 = __importDefault(require("dotenv"));
const Config_1 = __importDefault(require("../system-config/Config"));
dotenv_1.default.config();
class OpenAIManager extends ServiceManager_1.ServiceManager {
    static instance;
    _openaiClient;
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use OpenAIManager.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!OpenAIManager.instance) {
            OpenAIManager.instance = new OpenAIManager(Enforce);
        }
        return OpenAIManager.instance;
    }
    async connect() {
        const { apiKey } = Config_1.default.getInstance().openAiConfig;
        return new Promise((resolve, reject) => {
            if (!process.env.OPENAI_API_KEY) {
                reject(new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "Missing OpenAI API Key"));
                return;
            }
            this._openaiClient = new openai_1.default({
                apiKey: process.env.OPENAI_API_KEY || apiKey
            });
            resolve();
        });
    }
    async gracefulStop() {
        return Promise.resolve();
    }
    get getOpenaiClient() {
        if (!this._openaiClient) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "OpenAI Client not initialized.");
        }
        return this._openaiClient;
    }
}
exports.OpenAIManager = OpenAIManager;
function Enforce() {
}
//# sourceMappingURL=AiManager.js.map