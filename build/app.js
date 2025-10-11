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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.App = void 0;
const Constants_1 = require("./common/io/Constants");
const CommonMiddleware_1 = require("./common/middleware/CommonMiddleware");
const ApiRouter_1 = require("./common/routes/ApiRouter");
const MySqlManager_1 = require("./config/db/MySqlManager");
const CorsUtils_1 = require("./utils/cors/CorsUtils");
const Log_1 = require("./utils/logger/Log");
const body_parser_1 = __importDefault(require("body-parser"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const memorystore_1 = __importDefault(require("memorystore"));
const http = __importStar(require("node:http"));
const Config_1 = __importDefault(require("./config/system-config/Config"));
dotenv_1.default.config();
const logger = (0, Log_1.createLogger)(module);
class App {
    app;
    server;
    serviceManagers;
    constructor(...serviceManagers) {
        this.app = (0, express_1.default)();
        this.initializeApp();
        this.server = this.createServer();
        this.serviceManagers = serviceManagers;
    }
    async listen() {
        const port = parseInt(process.env.APP_PORT) || Config_1.default.getInstance().appConfig.port;
        try {
            await this.initializeManagers();
            this.server.listen(port, async () => {
                await MySqlManager_1.MySQLManager.getInstance().sequelize.sync({ force: false })
                    .then(() => logger.info("Database & tables created!"))
                    .catch((error) => logger.error(`Failed to sync models: ${error.message}`));
                logger.info(`Server is running on port ${port}`);
            });
            process.on(Constants_1.Constants.SIGINT, this.shutdown.bind(this));
            process.on(Constants_1.Constants.SIGTERM, this.shutdown.bind(this));
        }
        catch (error) {
            logger.error(`Failed to initialize services or start the server: ${error.message}`);
            process.exit(1);
        }
    }
    createServer() {
        return http.createServer(this.app);
    }
    initializeApp() {
        this.setupMiddlewares();
        this.setupRoutes();
    }
    setupMiddlewares() {
        const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || Config_1.default.getInstance().commonConfig.request_body_limit;
        this.app.use(body_parser_1.default.json({
            verify: function (req, _res, buf) {
                req["rawBody"] = buf;
            },
            limit: requestBodyLimit
        }));
        this.app.use(express_1.default.json({ limit: requestBodyLimit }));
        this.app.use(body_parser_1.default.json({ limit: requestBodyLimit }));
        this.app.use(body_parser_1.default.urlencoded({ extended: true, limit: requestBodyLimit }));
        this.app.use((0, cookie_parser_1.default)());
        const MemoryStore = (0, memorystore_1.default)(express_session_1.default);
        this.app.use((0, express_session_1.default)({
            cookie: { maxAge: 86400000 },
            store: new MemoryStore({
                checkPeriod: 86400000
            }),
            resave: false,
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET || Config_1.default.getInstance().authConfig.sessionSecret
        }));
        this.app.use(CorsUtils_1.CorsUtils.setupCors());
    }
    setupRoutes() {
        this.app.use("/api/v1", ApiRouter_1.ApiRouter.getInstance().getRouter());
        this.app.use(CommonMiddleware_1.error404Handler);
        this.app.use(CommonMiddleware_1.errorPageHandler);
    }
    async initializeManagers() {
        await Promise.all(this.serviceManagers
            .map((manager) => manager.initialize(this.server)));
    }
    async shutdown() {
        await Promise.all(this.serviceManagers.map((serviceManager) => serviceManager.shutdown()));
        process.exit(0);
    }
}
exports.App = App;
//# sourceMappingURL=app.js.map