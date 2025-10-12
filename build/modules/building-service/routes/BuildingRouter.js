"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuildingRouter = void 0;
const CustomRouter_1 = require("../../../utils/router/CustomRouter");
const InstantiationError_1 = require("../../../errors/InstantiationError");
const BuildingControllerImpl_1 = require("../../building-service/controllers/impl/BuildingControllerImpl");
const BuildingMiddlewares_1 = require("../../building-service/routes/io/BuildingMiddlewares");
class BuildingRouter extends CustomRouter_1.CustomRouter {
    static instance;
    controller;
    constructor(controller, enforce) {
        if (enforce !== Enforce) {
            throw new InstantiationError_1.InstantiationError(InstantiationError_1.InstantiationError.NOT_INSTANTIABLE, "Error: Instantiation failed: Use BuildingRouter.getInstance() instead of new.");
        }
        super();
        this.controller = controller;
        this.initializeRoutes();
    }
    static getInstance() {
        if (!BuildingRouter.instance) {
            BuildingRouter.instance = new BuildingRouter(BuildingControllerImpl_1.BuildingControllerImpl.getInstance(), Enforce);
        }
        return BuildingRouter.instance;
    }
    initializeRoutes() {
        this.route("/building-data")
            .all(...BuildingMiddlewares_1.BuildingMiddlewares.common.fetchAllMiddlewares)
            .get(...BuildingMiddlewares_1.BuildingMiddlewares.fetch.fetchCheckStateManufacturerMiddlewares, this.controller.fetchBuildingDataHandler);
    }
}
exports.BuildingRouter = BuildingRouter;
function Enforce() {
}
//# sourceMappingURL=BuildingRouter.js.map