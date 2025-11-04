"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MySqlManager_1 = require("./config/db/MySqlManager");
const app_1 = require("./app");
const RedisManager_1 = require("./config/redis/RedisManager");
const LangSmithConfig_1 = require("./agents/LangSmithConfig");
(0, LangSmithConfig_1.setupLangSmith)();
new app_1.App(MySqlManager_1.MySQLManager.getInstance(), RedisManager_1.RedisManager.getInstance()).listen();
//# sourceMappingURL=main.js.map