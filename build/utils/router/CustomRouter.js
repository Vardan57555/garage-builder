"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomRouter = void 0;
const express_1 = __importDefault(require("express"));
class CustomRouter {
    router;
    constructor() {
        this.router = express_1.default.Router();
    }
    getRouter() {
        return this.router;
    }
    use(path, router) {
        this.router.use(path, router.getRouter());
    }
    route(path) {
        return this.router.route(path);
    }
}
exports.CustomRouter = CustomRouter;
//# sourceMappingURL=CustomRouter.js.map