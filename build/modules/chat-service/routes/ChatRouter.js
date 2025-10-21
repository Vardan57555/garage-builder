"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatRouter = void 0;
const CustomRouter_1 = require("../../../utils/router/CustomRouter");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const ChatControllerImpl_1 = require("../../chat-service/controllers/impl/ChatControllerImpl");
const Log_1 = require("../../../utils/logger/Log");
const logger = (0, Log_1.createLogger)(module);
class ChatRouter extends CustomRouter_1.CustomRouter {
    static instance;
    controller;
    constructor(controller, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ChatRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
        logger.info("[ChatRouter] Router initialized");
    }
    static getInstance() {
        if (!ChatRouter.instance) {
            ChatRouter.instance = new ChatRouter(ChatControllerImpl_1.ChatControllerImpl.getInstance(), Enforce);
        }
        return ChatRouter.instance;
    }
    initializeRoutes() {
        this.route("/")
            .post(this.controller.fetchBuildingPricingWithUtilityHandler);
        this.route("/end")
            .post(this.controller.endSessionHandler);
    }
}
exports.ChatRouter = ChatRouter;
function Enforce() { }
//# sourceMappingURL=ChatRouter.js.map