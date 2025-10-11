import { InstantiationError } from "@errors/InstantiationError";
import { ServerError } from "@errors/ServerError";
import dotenv from "dotenv";
import path from "node:path";
import { Sequelize } from "sequelize-typescript";
import { ServiceManager } from "../ServiceManager";
import Config from "../system-config/Config";

dotenv.config();

/**
 * MySQLManager is a singleton class responsible for managing the MySQL connection.
 * It provides methods to connect to and gracefully stop the MySQL client.
 */
export class MySQLManager extends ServiceManager
{
    /**
     * Singleton instance of the MySQLManager class.
     * @private
     */
    private static instance: MySQLManager;

    /**
     * The Sequelize client instance.
     * @private
     */
    private _sequelize: Sequelize;

    /**
     * Constructs a new MySQLManager instance.
     * Initializes the MySQLManager with the provided configuration.
     * @param enforce - A function to enforce the Singleton pattern.
     */
    constructor(enforce: () => void)
    {
        super();

        if (enforce !== Enforce)
        {
            throw new InstantiationError(
                InstantiationError.NOT_INSTANTIABLE,
                "Error: Instantiation failed: Use MySQLManager.getInstance() instead of new."
            );
        }
    }

    /**
     * Gets the single instance of the MySQLManager class.
     * @returns The single instance of the MySQLManager class.
     */
    public static getInstance(): MySQLManager
    {
        if (!MySQLManager.instance)
        {
            MySQLManager.instance = new MySQLManager(Enforce);
        }

        return MySQLManager.instance;
    }

    /**
     * Connects to the MySQL server using the configuration from the Config class.
     * Logs the connection status and handles reconnection on errors.
     * @throws Will throw an error if the connection fails.
     */
    public async connect(): Promise<void>
    {
        const {
            host,
            port,
            database,
            username,
            password,
            dialect,
            logging,
            pool: { max, min, acquire, idle },
            retry: { max_retry, match_options }
            } = Config.getInstance().mysqlConfig;

        this._sequelize ??= new Sequelize({
            host: process.env.MYSQL_DB_HOST || host,
            port: parseInt(process.env.MYSQL_DB_PORT || String(port)),
            database: process.env.MYSQL_DB || database,
            username: process.env.MYSQL_USER || username,
            password: process.env.MYSQL_PASSWORD || password,
            dialect: dialect || "mysql",
            logging: logging,
            pool: { max, min, acquire, idle },
            retry: { max: max_retry, match: match_options },
            dialectOptions: {} // add SSL if needed: { ssl: { require: true, rejectUnauthorized: false } }
        });

        try
        {
            this._sequelize.addModels([path.resolve(__dirname, "./models")]);
            await this._sequelize.authenticate();
        }
        catch (error: any)
        {
            throw new ServerError(
                ServerError.INTERNAL,
                `Unable to connect to the MySQL database with error: ${error.message}`
            );
        }
    }

    /**
     * Gracefully stops the MySQL client by closing the connection.
     * Logs the disconnection status.
     */
    public async gracefulStop(): Promise<void>
    {
        if (this._sequelize)
        {
            await this._sequelize.close();
        }
    }

    /**
     * Gets the Sequelize client instance.
     * @returns The Sequelize client instance.
     * @throws Will throw an error if the Sequelize client is not initialized.
     */
    public get sequelize(): Sequelize
    {
        if (!this._sequelize)
        {
            throw new ServerError(ServerError.INTERNAL, "Sequelize instance not initialized.");
        }

        return this._sequelize;
    }
}

/**
 * Function to enforce the Singleton pattern.
 */
function Enforce(): void {}
