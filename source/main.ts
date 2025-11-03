import { MySQLManager } from "@config/db/MySqlManager";
import { App } from "./app";
import {RedisManager} from "@config/redis/RedisManager";
import {setupLangSmith} from "@agents/LangSmithConfig";


setupLangSmith();

/**
 * Entry point of the application.
 * Initializes the App with MySQL and Redis managers and starts the server.
 */
new App(
    MySQLManager.getInstance(),
    RedisManager.getInstance()
).listen();
