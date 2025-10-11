import { MySQLManager } from "@config/db/MySqlManager";
import { App } from "./app";

/**
 * Entry point of the application.
 * Initializes the App with MySQL and Redis managers and starts the server.
 */
new App(
    MySQLManager.getInstance(),
).listen();
