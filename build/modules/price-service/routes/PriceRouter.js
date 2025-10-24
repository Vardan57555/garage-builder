"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriceRouter = void 0;
const CustomRouter_1 = require("../../../utils/router/CustomRouter");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const StateMiddlewares_1 = require("../../states-service/routes/io/StateMiddlewares");
const PriceControllerImpl_1 = require("../../price-service/controllers/impl/PriceControllerImpl");
class PriceRouter extends CustomRouter_1.CustomRouter {
    static instance;
    controller;
    constructor(controller, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use PriceRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }
    static getInstance() {
        if (!PriceRouter.instance) {
            PriceRouter.instance = new PriceRouter(PriceControllerImpl_1.PriceControllerImpl.getInstance(), Enforce);
        }
        return PriceRouter.instance;
    }
    initializeRoutes() {
        this.route("/")
            .all(...StateMiddlewares_1.StateMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.fetchAllPricesHandler);
    }
}
exports.PriceRouter = PriceRouter;
function Enforce() {
}
//# sourceMappingURL=PriceRouter.js.map