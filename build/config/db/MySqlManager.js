"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLManager = void 0;
const InstantiationError_1 = require("../../errors/InstantiationError");
const ServerError_1 = require("../../errors/ServerError");
const dotenv_1 = __importDefault(require("dotenv"));
const node_path_1 = __importDefault(require("node:path"));
const sequelize_typescript_1 = require("sequelize-typescript");
const ServiceManager_1 = require("../ServiceManager");
const Config_1 = __importDefault(require("../system-config/Config"));
dotenv_1.default.config();
class MySQLManager extends ServiceManager_1.ServiceManager {
    static instance;
    _sequelize;
    constructor(enforce) {
        super();
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use MySQLManager.getInstance() instead of new.");
        }
    }
    static getInstance() {
        if (!MySQLManager.instance) {
            MySQLManager.instance = new MySQLManager(Enforce);
        }
        return MySQLManager.instance;
    }
    async connect() {
        const { host, port, database, username, password, dialect, logging, pool: { max, min, acquire, idle }, retry: { max_retry, match_options } } = Config_1.default.getInstance().mysqlConfig;
        this._sequelize ??= new sequelize_typescript_1.Sequelize({
            host: process.env.MYSQL_DB_HOST || host,
            port: parseInt(process.env.MYSQL_DB_PORT || String(port)),
            database: process.env.MYSQL_DB || database,
            username: process.env.MYSQL_USER || username,
            password: process.env.MYSQL_PASSWORD || password,
            dialect: dialect || "mysql",
            logging: logging,
            pool: { max, min, acquire, idle },
            retry: { max: max_retry, match: match_options },
            dialectOptions: {}
        });
        try {
            this._sequelize.addModels([node_path_1.default.resolve(__dirname, "./models")]);
            await this._sequelize.authenticate();
        }
        catch (error) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, `Unable to connect to the MySQL database with error: ${error.message}`);
        }
    }
    async gracefulStop() {
        if (this._sequelize) {
            await this._sequelize.close();
        }
    }
    get sequelize() {
        if (!this._sequelize) {
            throw new ServerError_1.ServerError(ServerError_1.ServerError.INTERNAL, "Sequelize instance not initialized.");
        }
        return this._sequelize;
    }
}
exports.MySQLManager = MySQLManager;
function Enforce() { }
//# sourceMappingURL=MySqlManager.js.map