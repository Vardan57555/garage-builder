"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ManufacturerRouter = void 0;
const CustomRouter_1 = require("../../../utils/router/CustomRouter");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const ManufacturerControllerImpl_1 = require("../../manufacturer-service/controllers/impl/ManufacturerControllerImpl");
const ManufacturerMiddlewares_1 = require("../../manufacturer-service/routes/io/ManufacturerMiddlewares");
class ManufacturerRouter extends CustomRouter_1.CustomRouter {
    static instance;
    controller;
    constructor(controller, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use ManufacturerRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }
    static getInstance() {
        if (!ManufacturerRouter.instance) {
            ManufacturerRouter.instance = new ManufacturerRouter(ManufacturerControllerImpl_1.ManufacturerControllerImpl.getInstance(), Enforce);
        }
        return ManufacturerRouter.instance;
    }
    initializeRoutes() {
        this.route("/")
            .all(...ManufacturerMiddlewares_1.ManufacturerMiddlewares.common.fetchAllMiddlewares)
            .get(this.controller.fetchAllHandler);
        this.route("/:state_id")
            .all(...ManufacturerMiddlewares_1.ManufacturerMiddlewares.common.idRouteMiddlewares)
            .get(...ManufacturerMiddlewares_1.ManufacturerMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchManufacturerByStateHandler);
    }
}
exports.ManufacturerRouter = ManufacturerRouter;
function Enforce() {
}
//# sourceMappingURL=ManufacturerRouter.js.map