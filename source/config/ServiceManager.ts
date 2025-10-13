import { createLogger } from "@utils/logger/Log";
import http from "http";
import pino from "pino";

const logger: pino.Logger = createLogger(module);

/**
 * Abstract class representing a service manager.
 * This class provides a template for managing the lifecycle of a service, including connecting to and gracefully stopping the service.
 */
export abstract class ServiceManager
{
    /**
     * Connects to the service.
     * This method must be implemented by subclasses to define the connection logic.
     *
     * @returns A promise that resolves when the connection is established.
     */
    public abstract connect(server?: http.Server): Promise<void>;

    /**
     * Gracefully stops the service.
     * This method must be implemented by subclasses to define the shutdown logic.
     *
     * @returns A promise that resolves when the service is stopped.
     */
    public abstract gracefulStop(): Promise<void>;

    /**
     * Initializes the service by connecting to it.
     * If the connection fails, the process exits with a status code of 1.
     *
     * @returns A promise that resolves when the service is initialized.
     */
    public async initialize(server?: http.Server): Promise<void>
    {
        try
        {
            await this.connect(server);
            logger.info(`${this.constructor.name} connected successfully`);
        }
        catch (error)
        {
            logger.error(`Failed to connect to ${this.constructor.name}: ${error.message}`);
            process.exit(1);
        }
    }

    /**
     * Shuts down the service gracefully.
     * If the shutdown fails, an error is logged.
     *
     * @returns A promise that resolves when the service is shut down.
     */
    public async shutdown(): Promise<void>
    {
        try
        {
            await this.gracefulStop();
            logger.info(`${this.constructor.name} closed successfully`);
        }
        catch (error)
        {
            logger.error(`Failed to close ${this.constructor.name}: ${error.message}`);
        }
    }
}
