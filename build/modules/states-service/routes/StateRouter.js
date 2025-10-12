"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateRouter = void 0;
const CustomRouter_1 = require("../../../utils/router/CustomRouter");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const StateControllerImpl_1 = require("../../states-service/controllers/impl/StateControllerImpl");
const StateMiddlewares_1 = require("../../states-service/routes/io/StateMiddlewares");
class StateRouter extends CustomRouter_1.CustomRouter {
    static instance;
    controller;
    constructor(controller, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use StateRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }
    static getInstance() {
        if (!StateRouter.instance) {
            StateRouter.instance = new StateRouter(StateControllerImpl_1.StateControllerImpl.getInstance(), Enforce);
        }
        return StateRouter.instance;
    }
    initializeRoutes() {
        this.route("/")
            .all(...StateMiddlewares_1.StateMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.fetchAllHandler);
        this.route("/:manufacturer_id")
            .all(...StateMiddlewares_1.StateMiddlewares.common.idRouteMiddlewares)
            .get(...StateMiddlewares_1.StateMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchByManufacturerIdHandler);
    }
}
exports.StateRouter = StateRouter;
function Enforce() {
}
//# sourceMappingURL=StateRouter.js.map