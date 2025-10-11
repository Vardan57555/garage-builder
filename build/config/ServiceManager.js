"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceManager = void 0;
const Log_1 = require("../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ServiceManager {
    async initialize(server) {
        try {
            await this.connect(server);
            logger.info(`${this.constructor.name} connected successfully`);
        }
        catch (error) {
            logger.error(`Failed to connect to ${this.constructor.name}: ${error.message}`);
            process.exit(1);
        }
    }
    async shutdown() {
        try {
            await this.gracefulStop();
            logger.info(`${this.constructor.name} closed successfully`);
        }
        catch (error) {
            logger.error(`Failed to close ${this.constructor.name}:`, error.message);
        }
    }
}
exports.ServiceManager = ServiceManager;
//# sourceMappingURL=ServiceManager.js.map