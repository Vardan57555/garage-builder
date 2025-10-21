"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const InstantiationError_1 = require("../../errors/InstantiationError");
const Log_1 = require("../../utils/logger/Log");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const ConfigValidator_1 = require("./ConfigValidator");
const logger = (0, Log_1.createLogger)(module);
class Config {
    static instance;
    _appConfig;
    _mySqlConfig;
    _openAiConfig;
    _authConfig;
    _redisConfig;
    _commonConfig;
    constructor(enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use Config.getInstance() instead of new.");
        }
        try {
            this._appConfig = this.readConfigFile("app.json", ConfigValidator_1.validateAppConfig);
            this._mySqlConfig = this.readConfigFile("mysql.json", ConfigValidator_1.validateMySqlConfig);
            this._authConfig = this.readConfigFile("auth.json", ConfigValidator_1.validateAuthConfig);
            this._redisConfig = this.readConfigFile("redis-config.json", ConfigValidator_1.validateRedisConfig);
            this._openAiConfig = this.readConfigFile("openAi.json", ConfigValidator_1.validateOpenAiConfig);
            this._commonConfig = this.readConfigFile("common.json", ConfigValidator_1.validateCommonConfig);
        }
        catch (error) {
            logger.error(`Error reading config file ${error.message}`);
        }
    }
    get appConfig() {
        return this._appConfig;
    }
    get mysqlConfig() {
        return this._mySqlConfig;
    }
    get authConfig() {
        return this._authConfig;
    }
    get commonConfig() {
        return this._commonConfig;
    }
    get openAiConfig() {
        return this._openAiConfig;
    }
    get redisConfig() {
        return this._redisConfig;
    }
    static getInstance() {
        if (!Config.instance) {
            Config.instance = new Config(Enforce);
        }
        return Config.instance;
    }
    readConfigFile = (fileName, validate) => {
        const fileFullName = path_1.default.join(__dirname, "..", "..", "configs", fileName);
        if (!fs_1.default.existsSync(fileFullName)) {
            throw new Error(`Config file '${fileName}' not found`);
        }
        const rawData = fs_1.default.readFileSync(fileFullName, "utf-8");
        const jsonData = JSON.parse(rawData);
        const validationResult = validate(jsonData);
        if (validationResult.error) {
            logger.error(`Error validating config file '${fileName}' ${validationResult.error.message}`);
            throw validationResult.error;
        }
        return validationResult.value;
    };
}
exports.default = Config;
function Enforce() {
}
//# sourceMappingURL=Config.js.map