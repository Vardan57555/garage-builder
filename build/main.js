"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MySqlManager_1 = require("./config/db/MySqlManager");
const app_1 = require("./app");
new app_1.App(MySqlManager_1.MySQLManager.getInstance()).listen();
//# sourceMappingURL=main.js.map