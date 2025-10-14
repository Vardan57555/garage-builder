"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PredictionManager = void 0;
const ort = __importStar(require("onnxruntime-node"));
const InstantiationError_1 = require("../../errors/InstantiationError");
const Log_1 = require("../../utils/logger/Log");
const ServiceManager_1 = require("../ServiceManager");
const logger = (0, Log_1.createLogger)(module);
class PredictionManager extends ServiceManager_1.ServiceManager {
    static instance;
    session = null;
    isConnected = false;
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PredictionManager.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!PredictionManager.instance) {
            PredictionManager.instance = new PredictionManager(Enforce);
        }
        return PredictionManager.instance;
    }
    async loadModel(modelPath) {
        try {
            this.session = await ort.InferenceSession.create(modelPath);
            logger.info(`✅ Model loaded from ${modelPath}`);
        }
        catch (error) {
            logger.error(`❌ Failed to load model: ${error.message}`);
            throw error;
        }
    }
    async predict(features) {
        if (!this.session) {
            throw new Error("ONNX model session not initialized. Call loadModel() first.");
        }
        const inputTensor = new ort.Tensor("float32", Float32Array.from(features), [1, features.length]);
        const feeds = {
            input: inputTensor
        };
        const results = await this.session.run(feeds);
        const outputName = this.session.outputNames[0];
        return results[outputName].data[0];
    }
    async connect(server) {
        try {
            logger.info("Connecting to Prediction service...");
            this.isConnected = true;
        }
        catch (error) {
            logger.error(`PredictionManager failed to connect: ${error}`);
            throw error;
        }
    }
    async gracefulStop() {
        try {
            if (this.isConnected) {
                logger.info("Shutting down Prediction service...");
                this.isConnected = false;
            }
        }
        catch (error) {
            logger.error(`PredictionManager failed to shut down: ${error}`);
            throw error;
        }
    }
}
exports.PredictionManager = PredictionManager;
function Enforce() { }
//# sourceMappingURL=PredictionManager.js.map