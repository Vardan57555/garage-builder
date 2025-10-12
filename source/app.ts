import { Constants } from "@common/io/Constants";
import { CustomServer } from "@common/io/IServer";
import { error404Handler, errorPageHandler } from "@common/middleware/CommonMiddleware";
import { ApiRouter } from "@common/routes/ApiRouter";
import { MySQLManager } from "@config/db/MySqlManager";
import { ServiceManager } from "@config/ServiceManager";
import { CorsUtils } from "@utils/cors/CorsUtils";
import { createLogger } from "@utils/logger/Log";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import express, { Express } from "express";
import session from "express-session";
import memoryStore from "memorystore";
import * as http from "node:http";
import { Server as HttpServer, IncomingMessage, ServerResponse } from "node:http";
import { Server as HttpsServer } from "node:https";
import pino from "pino";
import Config from "./config/system-config/Config";

dotenv.config();

const logger: pino.Logger = createLogger(module);

/**
 * Class representing the main application.
 * This class sets up the Express application, middleware, routes, and manages the server lifecycle.
 */
export class App
{
    /**
     * The Express application instance.
     * @private
     */
    private readonly app: Express;

    /**
     * The HTTPS server instance.
     * @private
     */
    private readonly server: HttpsServer | HttpServer;

    /**
     * The service managers for the application.
     * @private
     */
    private serviceManagers: ServiceManager[];

    /**
     * Creates an instance of `App`.
     * Initializes the Express application and managers.
     *
     * @param {ServiceManager[]} serviceManagers - The service managers to use for the application.
     */
    constructor(...serviceManagers: ServiceManager[])
    {
        this.app = express();
        this.initializeApp();
        this.server = this.createServer();
        this.serviceManagers = serviceManagers;
    }

    /**
     * Starts the Express server and initializes the managers.
     */
    public async listen(): Promise<void>
    {
        const port: number = parseInt(process.env.APP_PORT) || Config.getInstance().appConfig.port;

        try
        {
            await this.initializeManagers();

            this.server.listen(port, async (): Promise<void> =>
            {
                await MySQLManager.getInstance().sequelize.sync({ force: false })
                    .then((): void => logger.info("Database & tables created!"))
                    .catch((error: Error): void => logger.error(`Failed to sync models: ${error.message}`));

                logger.info(`Server is running on port ${port}`);
            });

            process.on(Constants.SIGINT, this.shutdown.bind(this));
            process.on(Constants.SIGTERM, this.shutdown.bind(this));
        }
        catch (error)
        {
            logger.error(`Failed to initialize services or start the server: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Creates an HTTP or HTTPS server based on the environment.
     *
     * @returns {CustomServer} The server instance created.
     */
    private createServer(): CustomServer
    {
        return http.createServer(this.app);
    }

    /**
     * Initializes the Express application.
     */
    private initializeApp(): void
    {
        this.setupMiddlewares();
        this.setupRoutes();
    }

    /**
     * Sets up the middleware for the Express application.
     */
    private setupMiddlewares(): void
    {
        const requestBodyLimit: string = process.env.REQUEST_BODY_LIMIT || Config.getInstance().commonConfig.request_body_limit;

        this.app.use(
            bodyParser.json({
                verify: function(req: IncomingMessage, _res: ServerResponse, buf: Buffer): void
                {
                    req["rawBody"] = buf;
                },
                limit: requestBodyLimit
            })
        );
        this.app.use(express.json({ limit: requestBodyLimit }));
        this.app.use(bodyParser.json({ limit: requestBodyLimit }));
        this.app.use(bodyParser.urlencoded({ extended: true, limit: requestBodyLimit }));
        this.app.use(cookieParser());
        const MemoryStore = memoryStore(session);

        this.app.use(session({
            cookie: { maxAge: 86400000 },
            store: new MemoryStore({
                checkPeriod: 86400000
            }),
            resave: false,
            saveUninitialized: false,
            secret: process.env.SESSION_SECRET || Config.getInstance().authConfig.sessionSecret
        }));
        this.app.use(CorsUtils.setupCors());
    }

    /**
     * Sets up the routes for the Express application.
     */
    private setupRoutes(): void
    {
        this.app.use("/api/v1", ApiRouter.getInstance().getRouter());

        this.app.use(error404Handler);
        this.app.use(errorPageHandler);
    }


    /**
     * Initializes managers with parallel execution
     * while ensuring SocketManager is initialized first.
     */
    private async initializeManagers(): Promise<void>
    {

        await Promise.all(
            this.serviceManagers
                .map((manager: ServiceManager): Promise<void> => manager.initialize(this.server))
        );
    }

    /**
     * Gracefully shuts down the managers and exits the process.
     */
    private async shutdown(): Promise<void>
    {
        await Promise.all(this.serviceManagers.map((serviceManager: ServiceManager): Promise<void> => serviceManager.shutdown()));
        process.exit(0);
    }
}
