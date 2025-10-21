"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MySqlManager_1 = require("./config/db/MySqlManager");
const app_1 = require("./app");
const RedisManager_1 = require("./config/redis/RedisManager");
new app_1.App(MySqlManager_1.MySQLManager.getInstance(), RedisManager_1.RedisManager.getInstance()).listen();
//# sourceMappingURL=main.js.map